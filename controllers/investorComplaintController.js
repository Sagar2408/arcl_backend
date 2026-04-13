const { InvestorComplaint } = require('../models');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const logAudit = require('../utils/auditLogger');
const {
  buildSnapshot,
  buildCreateDescription,
  buildUpdateAuditDescription,
  buildDeleteDescription
} = require('../utils/controllerAuditHelper');

const MODULE_NAME = 'investor_complaints';
const ENTITY_LABEL = 'investor complaint';
const SNAPSHOT_FIELDS = ['title', 'date', 'pdf_url'];

// CREATE INVESTOR COMPLAINT
exports.createInvestorComplaint = async (req, res) => {
  try {
    const { title, date } = req.body;

    if (!title || !date) {
      return res.status(400).json({
        success: false,
        message: 'Title and date are required'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'PDF file is required'
      });
    }

    const pdf_url = `/uploads/investor_complaints/${req.file.filename}`;

    const complaint = await InvestorComplaint.create({
      title,
      date,
      pdf_url
    });

    const newData = buildSnapshot(complaint, SNAPSHOT_FIELDS);

    await logAudit({
      req,
      action: 'CREATE',
      module: MODULE_NAME,
      recordId: complaint.id,
      newData,
      description: buildCreateDescription({
        entityLabel: ENTITY_LABEL,
        data: newData
      })
    });

    res.status(201).json({
      success: true,
      message: 'Investor complaint created successfully',
      data: complaint
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating investor complaint',
      error: error.message
    });
  }
};

// GET ALL INVESTOR COMPLAINTS (Pagination + Search)
exports.getAllInvestorComplaints = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const offset = (page - 1) * limit;
    const whereClause = {};

    if (search) {
      whereClause.title = {
        [Op.like]: `%${search}%`
      };
    }

    const { count, rows: complaints } = await InvestorComplaint.findAndCountAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    });

    res.json({
      success: true,
      data: complaints,
      pagination: {
        total: count,
        page: parseInt(page, 10),
        pages: Math.ceil(count / limit),
        limit: parseInt(limit, 10)
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching investor complaints',
      error: error.message
    });
  }
};

// UPDATE INVESTOR COMPLAINT
exports.updateInvestorComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, date } = req.body;

    const complaint = await InvestorComplaint.findByPk(id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Investor complaint not found'
      });
    }

    const oldData = buildSnapshot(complaint, SNAPSHOT_FIELDS);
    let pdf_url = complaint.pdf_url;

    if (req.file) {
      const oldFilePath = path.join(__dirname, '..', complaint.pdf_url);

      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }

      pdf_url = `/uploads/investor_complaints/${req.file.filename}`;
    }

    await complaint.update({
      title: title || complaint.title,
      date: date || complaint.date,
      pdf_url
    });

    const newData = buildSnapshot(complaint, SNAPSHOT_FIELDS);

    await logAudit({
      req,
      action: 'UPDATE',
      module: MODULE_NAME,
      recordId: complaint.id,
      oldData,
      newData,
      description: buildUpdateAuditDescription({
        entityLabel: ENTITY_LABEL,
        oldData,
        newData,
        fields: ['title', 'date'],
        labels: {
          title: 'title',
          date: 'date'
        },
        fileChanged: oldData.pdf_url !== newData.pdf_url,
        fallback: `Updated investor complaint "${newData.title || oldData.title || 'record'}"`
      })
    });

    res.json({
      success: true,
      message: 'Investor complaint updated successfully',
      data: complaint
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating investor complaint',
      error: error.message
    });
  }
};

// DELETE INVESTOR COMPLAINT
exports.deleteInvestorComplaint = async (req, res) => {
  try {
    const { id } = req.params;

    const complaint = await InvestorComplaint.findByPk(id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Investor complaint not found'
      });
    }

    const oldData = buildSnapshot(complaint, SNAPSHOT_FIELDS);
    const filePath = path.join(__dirname, '..', complaint.pdf_url);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await complaint.destroy();

    await logAudit({
      req,
      action: 'DELETE_APPROVE',
      module: MODULE_NAME,
      recordId: complaint.id,
      oldData,
      description: buildDeleteDescription({
        entityLabel: ENTITY_LABEL,
        title: oldData.title
      })
    });

    res.json({
      success: true,
      message: 'Investor complaint deleted successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting investor complaint',
      error: error.message
    });
  }
};
