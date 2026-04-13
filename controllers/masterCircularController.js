const { MasterCircular } = require('../models');
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

const MODULE_NAME = 'master_circulars';
const ENTITY_LABEL = 'master circular';
const SNAPSHOT_FIELDS = ['title', 'date', 'pdf_url'];

// CREATE MASTER CIRCULAR
exports.createMasterCircular = async (req, res) => {
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

    const pdf_url = `/uploads/master-circulars/${req.file.filename}`;

    const circular = await MasterCircular.create({
      title,
      date,
      pdf_url
    });

    const newData = buildSnapshot(circular, SNAPSHOT_FIELDS);

    await logAudit({
      req,
      action: 'CREATE',
      module: MODULE_NAME,
      recordId: circular.id,
      newData,
      description: buildCreateDescription({
        entityLabel: ENTITY_LABEL,
        data: newData
      })
    });

    res.status(201).json({
      success: true,
      message: 'Master Circular created successfully',
      data: circular
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating master circular',
      error: error.message
    });
  }
};

// GET ALL MASTER CIRCULARS
exports.getAllMasterCirculars = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const offset = (page - 1) * limit;
    const whereClause = {};

    if (search) {
      whereClause.title = {
        [Op.like]: `%${search}%`
      };
    }

    const { count, rows: circulars } = await MasterCircular.findAndCountAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    });

    res.json({
      success: true,
      data: circulars,
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
      message: 'Error fetching master circulars',
      error: error.message
    });
  }
};

// UPDATE MASTER CIRCULAR
exports.updateMasterCircular = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, date } = req.body;

    const circular = await MasterCircular.findByPk(id);

    if (!circular) {
      return res.status(404).json({
        success: false,
        message: 'Master Circular not found'
      });
    }

    const oldData = buildSnapshot(circular, SNAPSHOT_FIELDS);
    let pdf_url = circular.pdf_url;

    if (req.file) {
      const oldFilePath = path.join(__dirname, '..', circular.pdf_url);

      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }

      pdf_url = `/uploads/master-circulars/${req.file.filename}`;
    }

    await circular.update({
      title: title || circular.title,
      date: date || circular.date,
      pdf_url
    });

    const newData = buildSnapshot(circular, SNAPSHOT_FIELDS);

    await logAudit({
      req,
      action: 'UPDATE',
      module: MODULE_NAME,
      recordId: circular.id,
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
        fallback: `Updated master circular "${newData.title || oldData.title || 'record'}"`
      })
    });

    res.json({
      success: true,
      message: 'Master Circular updated successfully',
      data: circular
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating master circular',
      error: error.message
    });
  }
};

// DELETE MASTER CIRCULAR
exports.deleteMasterCircular = async (req, res) => {
  try {
    const { id } = req.params;

    const circular = await MasterCircular.findByPk(id);

    if (!circular) {
      return res.status(404).json({
        success: false,
        message: 'Master Circular not found'
      });
    }

    const oldData = buildSnapshot(circular, SNAPSHOT_FIELDS);
    const filePath = path.join(__dirname, '..', circular.pdf_url);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await circular.destroy();

    await logAudit({
      req,
      action: 'DELETE_APPROVE',
      module: MODULE_NAME,
      recordId: circular.id,
      oldData,
      description: buildDeleteDescription({
        entityLabel: ENTITY_LABEL,
        title: oldData.title
      })
    });

    res.json({
      success: true,
      message: 'Master Circular deleted successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting master circular',
      error: error.message
    });
  }
};
