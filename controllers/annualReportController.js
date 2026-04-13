const { AnnualReport } = require('../models');
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

const MODULE_NAME = 'annual_reports';
const ENTITY_LABEL = 'annual report';
const SNAPSHOT_FIELDS = ['title', 'date', 'pdf_url'];

// CREATE ANNUAL REPORT
exports.createAnnualReport = async (req, res) => {
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

    const pdf_url = `/uploads/annual_reports/${req.file.filename}`;

    const annualReport = await AnnualReport.create({
      title,
      date,
      pdf_url
    });

    const newData = buildSnapshot(annualReport, SNAPSHOT_FIELDS);

    await logAudit({
      req,
      action: 'CREATE',
      module: MODULE_NAME,
      recordId: annualReport.id,
      newData,
      description: buildCreateDescription({
        entityLabel: ENTITY_LABEL,
        data: newData
      })
    });

    res.status(201).json({
      success: true,
      message: 'Annual report created successfully',
      data: annualReport
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating annual report',
      error: error.message
    });
  }
};

// GET ALL ANNUAL REPORTS (Pagination + Search)
exports.getAllAnnualReports = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const offset = (page - 1) * limit;
    const whereClause = {};

    if (search) {
      whereClause.title = {
        [Op.like]: `%${search}%`
      };
    }

    const { count, rows: annualReports } = await AnnualReport.findAndCountAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    });

    res.json({
      success: true,
      data: annualReports,
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
      message: 'Error fetching annual reports',
      error: error.message
    });
  }
};

// UPDATE ANNUAL REPORT
exports.updateAnnualReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, date } = req.body;

    const annualReport = await AnnualReport.findByPk(id);

    if (!annualReport) {
      return res.status(404).json({
        success: false,
        message: 'Annual report not found'
      });
    }

    const oldData = buildSnapshot(annualReport, SNAPSHOT_FIELDS);
    let pdf_url = annualReport.pdf_url;

    if (req.file) {
      const oldFilePath = path.join(__dirname, '..', annualReport.pdf_url);

      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }

      pdf_url = `/uploads/annual_reports/${req.file.filename}`;
    }

    await annualReport.update({
      title: title || annualReport.title,
      date: date || annualReport.date,
      pdf_url
    });

    const newData = buildSnapshot(annualReport, SNAPSHOT_FIELDS);

    await logAudit({
      req,
      action: 'UPDATE',
      module: MODULE_NAME,
      recordId: annualReport.id,
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
        fallback: `Updated annual report "${newData.title || oldData.title || 'record'}"`
      })
    });

    res.json({
      success: true,
      message: 'Annual report updated successfully',
      data: annualReport
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating annual report',
      error: error.message
    });
  }
};

// DELETE ANNUAL REPORT
exports.deleteAnnualReport = async (req, res) => {
  try {
    const { id } = req.params;

    const annualReport = await AnnualReport.findByPk(id);

    if (!annualReport) {
      return res.status(404).json({
        success: false,
        message: 'Annual report not found'
      });
    }

    const oldData = buildSnapshot(annualReport, SNAPSHOT_FIELDS);
    const filePath = path.join(__dirname, '..', annualReport.pdf_url);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await annualReport.destroy();

    await logAudit({
      req,
      action: 'DELETE_APPROVE',
      module: MODULE_NAME,
      recordId: annualReport.id,
      oldData,
      description: buildDeleteDescription({
        entityLabel: ENTITY_LABEL,
        title: oldData.title
      })
    });

    res.json({
      success: true,
      message: 'Annual report deleted successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting annual report',
      error: error.message
    });
  }
};
