const {
  DeleteRequest,
  User,
  AuditTrail,
  sequelize,
  Circular,
  MasterCircular,
  DailyStat,
  MonthlyStat,
  Newsletter,
  Announcement,
  InvestorComplaint,
  ShareholdingPattern,
  PressRelease,
  ShareholdersMeeting,
  SEBI,
  RBI,
  FinancialResult,
  AnnualReport,
  AnnualReturn,
  NewspaperPublication,
  FinancialStatement
} = require('../models');

// ==============================
// 🔥 MODEL MAPPING (IMPORTANT)
// ==============================
const modelMap = {
  user: User,
  circulars: Circular,
  master_circulars: MasterCircular,
  daily_stats: DailyStat,
  monthly_stats: MonthlyStat,
  newsletter: Newsletter,
  announcements: Announcement,
  investor_complaints: InvestorComplaint,
  shareholding: ShareholdingPattern,
  press_release: PressRelease,
  shareholders_meeting: ShareholdersMeeting,
  sebi: SEBI,
  rbi: RBI,
  financial_result: FinancialResult,
  annual_reports: AnnualReport,
  annual_returns: AnnualReturn,
  newspaper_publication: NewspaperPublication,
  financial_statements: FinancialStatement
};

// ==============================
// 📌 CREATE DELETE REQUEST
// ==============================
exports.createRequest = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { section, record_id, record_title, reason } = req.body;

    const existingRequest = await DeleteRequest.findOne({
      where: { section, record_id, status: 'pending' },
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

// ==============================
// 📌 GET ALL REQUESTS
// ==============================
exports.getAllRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};

    if (req.user.role === 'executive') {
      whereClause.requested_by = req.user.id;
    }

    if (status) whereClause.status = status;

    const { count, rows } = await DeleteRequest.findAndCountAll({
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
      data: rows,
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

// ==============================
// 🔔 GET PENDING COUNT
// ==============================
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

// ==============================
// ✅ APPROVE REQUEST
// ==============================
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

    // 🔥 DYNAMIC DELETE LOGIC
    const Model = modelMap[request.section];

    if (!Model) {
      throw new Error(`Invalid section: ${request.section}`);
    }

    const record = await Model.findByPk(request.record_id, { transaction });

    if (!record) {
      throw new Error('Record not found');
    }

    await record.destroy({ transaction });

    // 🔥 UPDATE REQUEST
    await request.update({
      status: 'approved',
      reviewed_by: req.user.id,
      reviewed_at: new Date(),
      review_note
    }, { transaction });

    // 🔥 AUDIT LOG
    await AuditTrail.create({
      user_id: req.user.id,
      action: 'DELETE_APPROVE',
      section: request.section,
      record_id: request.record_id,
      reason: request.reason,
      new_data: {
        approved_by: req.user.username,
        requested_by: request.requester?.username,
        review_note,
        deleted: true
      },
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: 'Delete request approved and record deleted successfully',
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

// ==============================
// ❌ REJECT REQUEST
// ==============================
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

    await request.update({
      status: 'rejected',
      reviewed_by: req.user.id,
      reviewed_at: new Date(),
      review_note
    }, { transaction });

    await AuditTrail.create({
      user_id: req.user.id,
      action: 'DELETE_REJECT',
      section: request.section,
      record_id: request.record_id,
      reason: request.reason,
      new_data: {
        rejected_by: req.user.username,
        requested_by: request.requester?.username,
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