const { PressRelease } = require('../models');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const logAudit = require('../utils/auditLogger');
const {
  buildSnapshot,
  buildDeleteDescription
} = require('../utils/controllerAuditHelper');

const MODULE_NAME = 'press_releases';
const ENTITY_LABEL = 'press release';
const SNAPSHOT_FIELDS = ['title', 'date', 'pdf_url'];

// CREATE PRESS RELEASE
exports.createPressRelease = async (req, res) => {
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

    const pdf_url = `/uploads/press_releases/${req.file.filename}`;

    const pressRelease = await PressRelease.create({
      title,
      date,
      pdf_url
    });

    await logAudit({
      req,
      action: 'CREATE',
      module: MODULE_NAME,
      recordId: pressRelease.id,
      newData: pressRelease.toJSON(),
      description: `Created press release "${pressRelease.title || 'record'}"`
    });

    res.status(201).json({
      success: true,
      message: 'Press release created successfully',
      data: pressRelease
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating press release',
      error: error.message
    });
  }
};

// GET ALL PRESS RELEASES (Pagination + Search)
exports.getAllPressReleases = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const offset = (page - 1) * limit;
    const whereClause = {};

    if (search) {
      whereClause.title = {
        [Op.like]: `%${search}%`
      };
    }

    const { count, rows: pressReleases } = await PressRelease.findAndCountAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    });

    res.json({
      success: true,
      data: pressReleases,
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
      message: 'Error fetching press releases',
      error: error.message
    });
  }
};

// UPDATE PRESS RELEASE
exports.updatePressRelease = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, date } = req.body;

    const pressRelease = await PressRelease.findByPk(id);

    if (!pressRelease) {
      return res.status(404).json({
        success: false,
        message: 'Press release not found'
      });
    }

    const oldData = pressRelease.toJSON();
    let pdf_url = pressRelease.pdf_url;

    if (req.file) {
      const oldFilePath = path.join(__dirname, '..', pressRelease.pdf_url);

      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }

      pdf_url = `/uploads/press_releases/${req.file.filename}`;
    }

    await pressRelease.update({
      title: title || pressRelease.title,
      date: date || pressRelease.date,
      pdf_url
    });

    await logAudit({
      req,
      action: 'UPDATE',
      module: MODULE_NAME,
      recordId: pressRelease.id,
      oldData,
      newData: pressRelease.toJSON(),
      description: `Updated press release "${pressRelease.title || 'record'}"`
    });

    res.json({
      success: true,
      message: 'Press release updated successfully',
      data: pressRelease
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating press release',
      error: error.message
    });
  }
};

// DELETE PRESS RELEASE
exports.deletePressRelease = async (req, res) => {
  try {
    const { id } = req.params;

    const pressRelease = await PressRelease.findByPk(id);

    if (!pressRelease) {
      return res.status(404).json({
        success: false,
        message: 'Press release not found'
      });
    }

    const oldData = buildSnapshot(pressRelease, SNAPSHOT_FIELDS);
    const filePath = path.join(__dirname, '..', pressRelease.pdf_url);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await pressRelease.destroy();

    await logAudit({
      req,
      action: 'DELETE_APPROVE',
      module: MODULE_NAME,
      recordId: pressRelease.id,
      oldData,
      description: buildDeleteDescription({
        entityLabel: ENTITY_LABEL,
        title: oldData.title
      })
    });

    res.json({
      success: true,
      message: 'Press release deleted successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting press release',
      error: error.message
    });
  }
};
