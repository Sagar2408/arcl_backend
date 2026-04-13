const { ShareholdersMeeting } = require('../models');
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

const MODULE_NAME = 'shareholders_meetings';
const ENTITY_LABEL = 'shareholders meeting';
const SNAPSHOT_FIELDS = ['title', 'date', 'pdf_url'];

// CREATE SHAREHOLDERS MEETING
exports.createShareholdersMeeting = async (req, res) => {
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

    const pdf_url = `/uploads/shareholders_meetings/${req.file.filename}`;

    const meeting = await ShareholdersMeeting.create({
      title,
      date,
      pdf_url
    });

    const newData = buildSnapshot(meeting, SNAPSHOT_FIELDS);

    await logAudit({
      req,
      action: 'CREATE',
      module: MODULE_NAME,
      recordId: meeting.id,
      newData,
      description: buildCreateDescription({
        entityLabel: ENTITY_LABEL,
        data: newData
      })
    });

    res.status(201).json({
      success: true,
      message: 'Shareholders meeting created successfully',
      data: meeting
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating shareholders meeting',
      error: error.message
    });
  }
};

// GET ALL SHAREHOLDERS MEETINGS (Pagination + Search)
exports.getAllShareholdersMeetings = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const offset = (page - 1) * limit;
    const whereClause = {};

    if (search) {
      whereClause.title = {
        [Op.like]: `%${search}%`
      };
    }

    const { count, rows: meetings } = await ShareholdersMeeting.findAndCountAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    });

    res.json({
      success: true,
      data: meetings,
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
      message: 'Error fetching shareholders meetings',
      error: error.message
    });
  }
};

// UPDATE SHAREHOLDERS MEETING
exports.updateShareholdersMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, date } = req.body;

    const meeting = await ShareholdersMeeting.findByPk(id);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Shareholders meeting not found'
      });
    }

    const oldData = buildSnapshot(meeting, SNAPSHOT_FIELDS);
    let pdf_url = meeting.pdf_url;

    if (req.file) {
      const oldFilePath = path.join(__dirname, '..', meeting.pdf_url);

      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }

      pdf_url = `/uploads/shareholders_meetings/${req.file.filename}`;
    }

    await meeting.update({
      title: title || meeting.title,
      date: date || meeting.date,
      pdf_url
    });

    const newData = buildSnapshot(meeting, SNAPSHOT_FIELDS);

    await logAudit({
      req,
      action: 'UPDATE',
      module: MODULE_NAME,
      recordId: meeting.id,
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
        fallback: `Updated shareholders meeting "${newData.title || oldData.title || 'record'}"`
      })
    });

    res.json({
      success: true,
      message: 'Shareholders meeting updated successfully',
      data: meeting
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating shareholders meeting',
      error: error.message
    });
  }
};

// DELETE SHAREHOLDERS MEETING
exports.deleteShareholdersMeeting = async (req, res) => {
  try {
    const { id } = req.params;

    const meeting = await ShareholdersMeeting.findByPk(id);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Shareholders meeting not found'
      });
    }

    const oldData = buildSnapshot(meeting, SNAPSHOT_FIELDS);
    const filePath = path.join(__dirname, '..', meeting.pdf_url);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await meeting.destroy();

    await logAudit({
      req,
      action: 'DELETE_APPROVE',
      module: MODULE_NAME,
      recordId: meeting.id,
      oldData,
      description: buildDeleteDescription({
        entityLabel: ENTITY_LABEL,
        title: oldData.title
      })
    });

    res.json({
      success: true,
      message: 'Shareholders meeting deleted successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting shareholders meeting',
      error: error.message
    });
  }
};
