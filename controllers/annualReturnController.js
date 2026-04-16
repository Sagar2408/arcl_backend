const { AnnualReturn } = require('../models');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const logAudit = require('../utils/auditLogger');
const {
  buildSnapshot,
  buildDeleteDescription
} = require('../utils/controllerAuditHelper');

const MODULE_NAME = 'annual_returns';
const ENTITY_LABEL = 'annual return';
const SNAPSHOT_FIELDS = ['title', 'date', 'pdf_url'];

// CREATE ANNUAL RETURN
exports.createAnnualReturn = async (req, res) => {
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

    const pdf_url = `/uploads/annual_returns/${req.file.filename}`;

    const annualReturn = await AnnualReturn.create({
      title,
      date,
      pdf_url
    });

    await logAudit({
      req,
      action: 'CREATE',
      module: MODULE_NAME,
      recordId: annualReturn.id,
      newData: annualReturn.toJSON(),
      description: `Created annual return "${annualReturn.title || 'record'}"`
    });

    res.status(201).json({
      success: true,
      message: 'Annual return created successfully',
      data: annualReturn
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating annual return',
      error: error.message
    });
  }
};

// GET ALL ANNUAL RETURNS (Pagination + Search)
exports.getAllAnnualReturns = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const offset = (page - 1) * limit;
    const whereClause = {};

    if (search) {
      whereClause.title = {
        [Op.like]: `%${search}%`
      };
    }

    const { count, rows: annualReturns } = await AnnualReturn.findAndCountAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    });

    res.json({
      success: true,
      data: annualReturns,
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
      message: 'Error fetching annual returns',
      error: error.message
    });
  }
};

// UPDATE ANNUAL RETURN
exports.updateAnnualReturn = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, date } = req.body;

    const annualReturn = await AnnualReturn.findByPk(id);

    if (!annualReturn) {
      return res.status(404).json({
        success: false,
        message: 'Annual return not found'
      });
    }

    const oldData = annualReturn.toJSON();
    let pdf_url = annualReturn.pdf_url;

    if (req.file) {
      const oldFilePath = path.join(__dirname, '..', annualReturn.pdf_url);

      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }

      pdf_url = `/uploads/annual_returns/${req.file.filename}`;
    }

    await annualReturn.update({
      title: title || annualReturn.title,
      date: date || annualReturn.date,
      pdf_url
    });

    await logAudit({
      req,
      action: 'UPDATE',
      module: MODULE_NAME,
      recordId: annualReturn.id,
      oldData,
      newData: annualReturn.toJSON(),
      description: `Updated annual return "${annualReturn.title || 'record'}"`
    });

    res.json({
      success: true,
      message: 'Annual return updated successfully',
      data: annualReturn
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating annual return',
      error: error.message
    });
  }
};

// DELETE ANNUAL RETURN
exports.deleteAnnualReturn = async (req, res) => {
  try {
    const { id } = req.params;

    const annualReturn = await AnnualReturn.findByPk(id);

    if (!annualReturn) {
      return res.status(404).json({
        success: false,
        message: 'Annual return not found'
      });
    }

    const oldData = buildSnapshot(annualReturn, SNAPSHOT_FIELDS);
    const filePath = path.join(__dirname, '..', annualReturn.pdf_url);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await annualReturn.destroy();

    await logAudit({
      req,
      action: 'DELETE_APPROVE',
      module: MODULE_NAME,
      recordId: annualReturn.id,
      oldData,
      description: buildDeleteDescription({
        entityLabel: ENTITY_LABEL,
        title: oldData.title
      })
    });

    res.json({
      success: true,
      message: 'Annual return deleted successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting annual return',
      error: error.message
    });
  }
};
