const { DeleteRequest, User, AuditTrail, sequelize } = require('../models');
const { Op } = require('sequelize');

// CREATE DELETE REQUEST (Executive)
exports.createRequest = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { section, record_id, record_title, reason } = req.body;

    // Check if request already exists
    const existingRequest = await DeleteRequest.findOne({
      where: {
        section,
        record_id,
        status: 'pending'
      },
      transaction
    });

    if (existingRequest) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Delete request already pending for this record'
      });
    }

    const request = await DeleteRequest.create({
      requested_by: req.user.id,
      section,
      record_id,
      record_title,
      reason
    }, { transaction });

    // Log action
    await AuditTrail.create({
      user_id: req.user.id,
      action: 'DELETE_REQUEST',
      section,
      record_id,
      reason,
      new_data: { request_id: request.id },
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    }, { transaction });

    await transaction.commit();

    res.status(201).json({
      success: true,
      message: 'Delete request submitted for approval',
      data: request
    });

  } catch (error) {
    await transaction.rollback();
    res.status(500).json({
      success: false,
      message: 'Error creating delete request',
      error: error.message
    });
  }
};

// GET ALL DELETE REQUESTS (Super Admin - all, Executive - own)
exports.getAllRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    const whereClause = {};
    
    // Executive can only see their own requests
    if (req.user.role === 'executive') {
      whereClause.requested_by = req.user.id;
    }
    
    if (status) whereClause.status = status;

    const { count, rows: requests } = await DeleteRequest.findAndCountAll({
      where: whereClause,
      include: [
        { model: User, as: 'requester', attributes: ['id', 'username'] },
        { model: User, as: 'reviewer', attributes: ['id', 'username'] }
      ],
      order: [['requested_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: requests,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit),
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching delete requests',
      error: error.message
    });
  }
};

// GET PENDING COUNT (for Super Admin notification badge)
exports.getPendingCount = async (req, res) => {
  try {
    const count = await DeleteRequest.count({
      where: { status: 'pending' }
    });

    res.json({
      success: true,
      data: { pending_count: count }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching pending count',
      error: error.message
    });
  }
};

// APPROVE DELETE REQUEST (Super Admin)
exports.approveRequest = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { review_note } = req.body;

    const request = await DeleteRequest.findByPk(id, {
      include: [{ model: User, as: 'requester' }],
      transaction
    });

    if (!request) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Delete request not found'
      });
    }

    if (request.status !== 'pending') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Request already processed'
      });
    }

    // Update request
    await request.update({
      status: 'approved',
      reviewed_by: req.user.id,
      reviewed_at: new Date(),
      review_note
    }, { transaction });

    // Log approval
    await AuditTrail.create({
      user_id: req.user.id,
      action: 'DELETE_APPROVE',
      section: request.section,
      record_id: request.record_id,
      reason: request.reason,
      new_data: {
        approved_by: req.user.username,
        requested_by: request.requester.username,
        review_note
      },
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: 'Delete request approved. Record can now be deleted.',
      data: request
    });

  } catch (error) {
    await transaction.rollback();
    res.status(500).json({
      success: false,
      message: 'Error approving request',
      error: error.message
    });
  }
};

// REJECT DELETE REQUEST (Super Admin)
exports.rejectRequest = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { review_note } = req.body;

    const request = await DeleteRequest.findByPk(id, {
      include: [{ model: User, as: 'requester' }],
      transaction
    });

    if (!request) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Delete request not found'
      });
    }

    if (request.status !== 'pending') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Request already processed'
      });
    }

    // Update request
    await request.update({
      status: 'rejected',
      reviewed_by: req.user.id,
      reviewed_at: new Date(),
      review_note
    }, { transaction });

    // Log rejection
    await AuditTrail.create({
      user_id: req.user.id,
      action: 'DELETE_REJECT',
      section: request.section,
      record_id: request.record_id,
      reason: request.reason,
      new_data: {
        rejected_by: req.user.username,
        requested_by: request.requester.username,
        review_note
      },
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: 'Delete request rejected',
      data: request
    });

  } catch (error) {
    await transaction.rollback();
    res.status(500).json({
      success: false,
      message: 'Error rejecting request',
      error: error.message
    });
  }
};