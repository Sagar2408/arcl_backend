const { ShareholdingPattern } = require('../models');
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

const MODULE_NAME = 'shareholding_patterns';
const ENTITY_LABEL = 'shareholding pattern';
const SNAPSHOT_FIELDS = ['title', 'date', 'pdf_url', 'category'];

// CREATE SHAREHOLDING PATTERN
exports.createShareholdingPattern = async (req, res) => {
  try {
    const { title, date, category = 'general' } = req.body;

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

    const pdf_url = `/uploads/${req.file.filename}`;

    const pattern = await ShareholdingPattern.create({
      title,
      date,
      pdf_url,
      category
    });

    const newData = buildSnapshot(pattern, SNAPSHOT_FIELDS);

    await logAudit({
      req,
      action: 'CREATE',
      module: MODULE_NAME,
      recordId: pattern.id,
      newData,
      description: buildCreateDescription({
        entityLabel: ENTITY_LABEL,
        data: newData,
        extraParts: newData.category ? [`Category: ${newData.category}`] : []
      })
    });

    res.status(201).json({
      success: true,
      message: 'Shareholding pattern created successfully',
      data: pattern
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating shareholding pattern',
      error: error.message
    });
  }
};

// GET ALL SHAREHOLDING PATTERNS (Pagination + Search)
exports.getAllShareholdingPatterns = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, category } = req.query;
    const offset = (page - 1) * limit;
    const whereClause = {};

    if (category) {
      whereClause.category = category;
    }

    if (search) {
      whereClause.title = {
        [Op.like]: `%${search}%`
      };
    }

    const { count, rows: patterns } = await ShareholdingPattern.findAndCountAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    });

    res.json({
      success: true,
      data: patterns,
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
      message: 'Error fetching shareholding patterns',
      error: error.message
    });
  }
};

// UPDATE SHAREHOLDING PATTERN
exports.updateShareholdingPattern = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, date, category } = req.body;

    const pattern = await ShareholdingPattern.findByPk(id);

    if (!pattern) {
      return res.status(404).json({
        success: false,
        message: 'Shareholding pattern not found'
      });
    }

    const oldData = buildSnapshot(pattern, SNAPSHOT_FIELDS);
    let pdf_url = pattern.pdf_url;

    if (req.file) {
      const oldFilePath = path.join(__dirname, '..', pattern.pdf_url);

      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }

      pdf_url = `/uploads/shareholding-pattern/${category || pattern.category}/${req.file.filename}`;
    }

    await pattern.update({
      title: title || pattern.title,
      date: date || pattern.date,
      pdf_url,
      category: category || pattern.category
    });

    const newData = buildSnapshot(pattern, SNAPSHOT_FIELDS);

    await logAudit({
      req,
      action: 'UPDATE',
      module: MODULE_NAME,
      recordId: pattern.id,
      oldData,
      newData,
      description: buildUpdateAuditDescription({
        entityLabel: ENTITY_LABEL,
        oldData,
        newData,
        fields: ['title', 'date', 'category'],
        labels: {
          title: 'title',
          date: 'date',
          category: 'category'
        },
        fileChanged: oldData.pdf_url !== newData.pdf_url,
        fallback: `Updated shareholding pattern "${newData.title || oldData.title || 'record'}"`
      })
    });

    res.json({
      success: true,
      message: 'Shareholding pattern updated successfully',
      data: pattern
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating shareholding pattern',
      error: error.message
    });
  }
};

// DELETE SHAREHOLDING PATTERN
exports.deleteShareholdingPattern = async (req, res) => {
  try {
    const { id } = req.params;

    const pattern = await ShareholdingPattern.findByPk(id);

    if (!pattern) {
      return res.status(404).json({
        success: false,
        message: 'Shareholding pattern not found'
      });
    }

    const oldData = buildSnapshot(pattern, SNAPSHOT_FIELDS);
    const filePath = path.join(__dirname, '..', pattern.pdf_url);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await pattern.destroy();

    await logAudit({
      req,
      action: 'DELETE_APPROVE',
      module: MODULE_NAME,
      recordId: pattern.id,
      oldData,
      description: buildDeleteDescription({
        entityLabel: ENTITY_LABEL,
        title: oldData.title
      })
    });

    res.json({
      success: true,
      message: 'Shareholding pattern deleted successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting shareholding pattern',
      error: error.message
    });
  }
};
