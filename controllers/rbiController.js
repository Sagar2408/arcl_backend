const { RBI } = require('../models');
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

const MODULE_NAME = 'rbi';
const ENTITY_LABEL = 'RBI circular';
const SNAPSHOT_FIELDS = ['title', 'date', 'pdf_url'];

// CREATE RBI
exports.createRBI = async (req, res) => {
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

    const pdf_url = `/uploads/rbi/${req.file.filename}`;

    const rbi = await RBI.create({
      title,
      date,
      pdf_url
    });

    const newData = buildSnapshot(rbi, SNAPSHOT_FIELDS);

    await logAudit({
      req,
      action: 'CREATE',
      module: MODULE_NAME,
      recordId: rbi.id,
      newData,
      description: buildCreateDescription({
        entityLabel: ENTITY_LABEL,
        data: newData
      })
    });

    res.status(201).json({
      success: true,
      message: 'RBI created successfully',
      data: rbi
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating RBI',
      error: error.message
    });
  }
};

// GET ALL RBI (Pagination + Search)
exports.getAllRBI = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const offset = (page - 1) * limit;
    const whereClause = {};

    if (search) {
      whereClause.title = {
        [Op.like]: `%${search}%`
      };
    }

    const { count, rows: rbi } = await RBI.findAndCountAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    });

    res.json({
      success: true,
      data: rbi,
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
      message: 'Error fetching RBI',
      error: error.message
    });
  }
};

// UPDATE RBI
exports.updateRBI = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, date } = req.body;

    const rbi = await RBI.findByPk(id);

    if (!rbi) {
      return res.status(404).json({
        success: false,
        message: 'RBI not found'
      });
    }

    const oldData = buildSnapshot(rbi, SNAPSHOT_FIELDS);
    let pdf_url = rbi.pdf_url;

    if (req.file) {
      const oldFilePath = path.join(__dirname, '..', rbi.pdf_url);

      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }

      pdf_url = `/uploads/rbi/${req.file.filename}`;
    }

    await rbi.update({
      title: title || rbi.title,
      date: date || rbi.date,
      pdf_url
    });

    const newData = buildSnapshot(rbi, SNAPSHOT_FIELDS);

    await logAudit({
      req,
      action: 'UPDATE',
      module: MODULE_NAME,
      recordId: rbi.id,
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
        fallback: `Updated RBI circular "${newData.title || oldData.title || 'record'}"`
      })
    });

    res.json({
      success: true,
      message: 'RBI updated successfully',
      data: rbi
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating RBI',
      error: error.message
    });
  }
};

// DELETE RBI
exports.deleteRBI = async (req, res) => {
  try {
    const { id } = req.params;

    const rbi = await RBI.findByPk(id);

    if (!rbi) {
      return res.status(404).json({
        success: false,
        message: 'RBI not found'
      });
    }

    const oldData = buildSnapshot(rbi, SNAPSHOT_FIELDS);
    const filePath = path.join(__dirname, '..', rbi.pdf_url);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await rbi.destroy();

    await logAudit({
      req,
      action: 'DELETE_APPROVE',
      module: MODULE_NAME,
      recordId: rbi.id,
      oldData,
      description: buildDeleteDescription({
        entityLabel: ENTITY_LABEL,
        title: oldData.title
      })
    });

    res.json({
      success: true,
      message: 'RBI deleted successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting RBI',
      error: error.message
    });
  }
};
