const { FinancialStatement } = require('../models');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const logAudit = require('../utils/auditLogger');
const {
  buildSnapshot,
  buildDeleteDescription
} = require('../utils/controllerAuditHelper');

const MODULE_NAME = 'financial_statements';
const ENTITY_LABEL = 'financial statement';
const SNAPSHOT_FIELDS = ['title', 'date', 'pdf_url'];

// CREATE FINANCIAL STATEMENT
exports.createFinancialStatement = async (req, res) => {
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

    const pdf_url = `/uploads/financial_statements/${req.file.filename}`;

    const financialStatement = await FinancialStatement.create({
      title,
      date,
      pdf_url
    });

    await logAudit({
      req,
      action: 'CREATE',
      module: MODULE_NAME,
      recordId: financialStatement.id,
      newData: financialStatement.toJSON(),
      description: `Created financial statement "${financialStatement.title || 'record'}"`
    });

    res.status(201).json({
      success: true,
      message: 'Financial statement created successfully',
      data: financialStatement
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating financial statement',
      error: error.message
    });
  }
};

// GET ALL FINANCIAL STATEMENTS (Pagination + Search)
exports.getAllFinancialStatements = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const offset = (page - 1) * limit;
    const whereClause = {};

    if (search) {
      whereClause.title = {
        [Op.like]: `%${search}%`
      };
    }

    const { count, rows: financialStatements } = await FinancialStatement.findAndCountAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    });

    res.json({
      success: true,
      data: financialStatements,
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
      message: 'Error fetching financial statements',
      error: error.message
    });
  }
};

// UPDATE FINANCIAL STATEMENT
exports.updateFinancialStatement = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, date } = req.body;

    const financialStatement = await FinancialStatement.findByPk(id);

    if (!financialStatement) {
      return res.status(404).json({
        success: false,
        message: 'Financial statement not found'
      });
    }

    const oldData = financialStatement.toJSON();
    let pdf_url = financialStatement.pdf_url;

    if (req.file) {
      const oldFilePath = path.join(__dirname, '..', financialStatement.pdf_url);

      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }

      pdf_url = `/uploads/financial_statements/${req.file.filename}`;
    }

    await financialStatement.update({
      title: title || financialStatement.title,
      date: date || financialStatement.date,
      pdf_url
    });

    await logAudit({
      req,
      action: 'UPDATE',
      module: MODULE_NAME,
      recordId: financialStatement.id,
      oldData,
      newData: financialStatement.toJSON(),
      description: `Updated financial statement "${financialStatement.title || 'record'}"`
    });

    res.json({
      success: true,
      message: 'Financial statement updated successfully',
      data: financialStatement
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating financial statement',
      error: error.message
    });
  }
};

// DELETE FINANCIAL STATEMENT
exports.deleteFinancialStatement = async (req, res) => {
  try {
    const { id } = req.params;

    const financialStatement = await FinancialStatement.findByPk(id);

    if (!financialStatement) {
      return res.status(404).json({
        success: false,
        message: 'Financial statement not found'
      });
    }

    const oldData = buildSnapshot(financialStatement, SNAPSHOT_FIELDS);
    const filePath = path.join(__dirname, '..', financialStatement.pdf_url);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await financialStatement.destroy();

    await logAudit({
      req,
      action: 'DELETE_APPROVE',
      module: MODULE_NAME,
      recordId: financialStatement.id,
      oldData,
      description: buildDeleteDescription({
        entityLabel: ENTITY_LABEL,
        title: oldData.title
      })
    });

    res.json({
      success: true,
      message: 'Financial statement deleted successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting financial statement',
      error: error.message
    });
  }
};
