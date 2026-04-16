const { FinancialResult } = require('../models');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const logAudit = require('../utils/auditLogger');
const {
  buildSnapshot,
  buildDeleteDescription
} = require('../utils/controllerAuditHelper');

const MODULE_NAME = 'financial_results';
const ENTITY_LABEL = 'financial result';
const SNAPSHOT_FIELDS = ['title', 'date', 'pdf_url'];

// CREATE FINANCIAL RESULT
exports.createFinancialResult = async (req, res) => {
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

    const pdf_url = `/uploads/financial_results/${req.file.filename}`;

    const financialResult = await FinancialResult.create({
      title,
      date,
      pdf_url
    });

    await logAudit({
      req,
      action: 'CREATE',
      module: MODULE_NAME,
      recordId: financialResult.id,
      newData: financialResult.toJSON(),
      description: `Created financial result "${financialResult.title || 'record'}"`
    });

    res.status(201).json({
      success: true,
      message: 'Financial result created successfully',
      data: financialResult
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating financial result',
      error: error.message
    });
  }
};

// GET ALL FINANCIAL RESULTS (Pagination + Search)
exports.getAllFinancialResults = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const offset = (page - 1) * limit;
    const whereClause = {};

    if (search) {
      whereClause.title = {
        [Op.like]: `%${search}%`
      };
    }

    const { count, rows: financialResults } = await FinancialResult.findAndCountAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    });

    res.json({
      success: true,
      data: financialResults,
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
      message: 'Error fetching financial results',
      error: error.message
    });
  }
};

// UPDATE FINANCIAL RESULT
exports.updateFinancialResult = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, date } = req.body;

    const financialResult = await FinancialResult.findByPk(id);

    if (!financialResult) {
      return res.status(404).json({
        success: false,
        message: 'Financial result not found'
      });
    }

    const oldData = financialResult.toJSON();
    let pdf_url = financialResult.pdf_url;

    if (req.file) {
      const oldFilePath = path.join(__dirname, '..', financialResult.pdf_url);

      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }

      pdf_url = `/uploads/financial_results/${req.file.filename}`;
    }

    await financialResult.update({
      title: title || financialResult.title,
      date: date || financialResult.date,
      pdf_url
    });

    await logAudit({
      req,
      action: 'UPDATE',
      module: MODULE_NAME,
      recordId: financialResult.id,
      oldData,
      newData: financialResult.toJSON(),
      description: `Updated financial result "${financialResult.title || 'record'}"`
    });

    res.json({
      success: true,
      message: 'Financial result updated successfully',
      data: financialResult
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating financial result',
      error: error.message
    });
  }
};

// DELETE FINANCIAL RESULT
exports.deleteFinancialResult = async (req, res) => {
  try {
    const { id } = req.params;

    const financialResult = await FinancialResult.findByPk(id);

    if (!financialResult) {
      return res.status(404).json({
        success: false,
        message: 'Financial result not found'
      });
    }

    const oldData = buildSnapshot(financialResult, SNAPSHOT_FIELDS);
    const filePath = path.join(__dirname, '..', financialResult.pdf_url);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await financialResult.destroy();

    await logAudit({
      req,
      action: 'DELETE_APPROVE',
      module: MODULE_NAME,
      recordId: financialResult.id,
      oldData,
      description: buildDeleteDescription({
        entityLabel: ENTITY_LABEL,
        title: oldData.title
      })
    });

    res.json({
      success: true,
      message: 'Financial result deleted successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting financial result',
      error: error.message
    });
  }
};
