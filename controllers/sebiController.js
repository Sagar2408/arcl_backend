const { SEBI } = require('../models');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const logAudit = require('../utils/auditLogger');
const {
  buildSnapshot,
  buildDeleteDescription
} = require('../utils/controllerAuditHelper');

const MODULE_NAME = 'sebi';
const ENTITY_LABEL = 'SEBI circular';
const SNAPSHOT_FIELDS = ['title', 'date', 'pdf_url'];

// CREATE SEBI
exports.createSEBI = async (req, res) => {
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

    const pdf_url = `/uploads/sebi/${req.file.filename}`;

    const sebi = await SEBI.create({
      title,
      date,
      pdf_url
    });

    await logAudit({
      req,
      action: 'CREATE',
      module: MODULE_NAME,
      recordId: sebi.id,
      newData: sebi.toJSON(),
      description: `Created SEBI circular "${sebi.title || 'record'}"`
    });

    res.status(201).json({
      success: true,
      message: 'SEBI created successfully',
      data: sebi
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating SEBI',
      error: error.message
    });
  }
};

// GET ALL SEBI (Pagination + Search)
exports.getAllSEBI = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const offset = (page - 1) * limit;
    const whereClause = {};

    if (search) {
      whereClause.title = {
        [Op.like]: `%${search}%`
      };
    }

    const { count, rows: sebi } = await SEBI.findAndCountAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    });

    res.json({
      success: true,
      data: sebi,
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
      message: 'Error fetching SEBI',
      error: error.message
    });
  }
};

// UPDATE SEBI
exports.updateSEBI = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, date } = req.body;

    const sebi = await SEBI.findByPk(id);

    if (!sebi) {
      return res.status(404).json({
        success: false,
        message: 'SEBI not found'
      });
    }

    const oldData = sebi.toJSON();
    let pdf_url = sebi.pdf_url;

    if (req.file) {
      const oldFilePath = path.join(__dirname, '..', sebi.pdf_url);

      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }

      pdf_url = `/uploads/sebi/${req.file.filename}`;
    }

    await sebi.update({
      title: title || sebi.title,
      date: date || sebi.date,
      pdf_url
    });

    await logAudit({
      req,
      action: 'UPDATE',
      module: MODULE_NAME,
      recordId: sebi.id,
      oldData,
      newData: sebi.toJSON(),
      description: `Updated SEBI circular "${sebi.title || 'record'}"`
    });

    res.json({
      success: true,
      message: 'SEBI updated successfully',
      data: sebi
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating SEBI',
      error: error.message
    });
  }
};

// DELETE SEBI
exports.deleteSEBI = async (req, res) => {
  try {
    const { id } = req.params;

    const sebi = await SEBI.findByPk(id);

    if (!sebi) {
      return res.status(404).json({
        success: false,
        message: 'SEBI not found'
      });
    }

    const oldData = buildSnapshot(sebi, SNAPSHOT_FIELDS);
    const filePath = path.join(__dirname, '..', sebi.pdf_url);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await sebi.destroy();

    await logAudit({
      req,
      action: 'DELETE_APPROVE',
      module: MODULE_NAME,
      recordId: sebi.id,
      oldData,
      description: buildDeleteDescription({
        entityLabel: ENTITY_LABEL,
        title: oldData.title
      })
    });

    res.json({
      success: true,
      message: 'SEBI deleted successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting SEBI',
      error: error.message
    });
  }
};
