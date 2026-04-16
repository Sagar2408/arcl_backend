const { Announcement } = require('../models');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const logAudit = require('../utils/auditLogger');
const {
  buildSnapshot,
  buildDeleteDescription
} = require('../utils/controllerAuditHelper');

const allowedCategories = ['announcements', 'shareholders_meeting'];
const SNAPSHOT_FIELDS = ['title', 'date', 'pdf_url', 'category'];

const getAnnouncementModule = (category) => {
  return category === 'shareholders_meeting' ? 'shareholders_meetings' : 'announcements';
};

const getAnnouncementLabel = (category) => {
  return category === 'shareholders_meeting' ? 'shareholders meeting announcement' : 'announcement';
};

// CREATE ANNOUNCEMENT
exports.createAnnouncement = async (req, res) => {
  try {
    let { title, date, category = 'announcements' } = req.body;

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

    if (!allowedCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category'
      });
    }

    const pdf_url = `/uploads/announcements/general/${req.file.filename}`;

    const announcement = await Announcement.create({
      title,
      date,
      pdf_url,
      category
    });

    const moduleName = getAnnouncementModule(announcement.category);

    await logAudit({
      req,
      action: 'CREATE',
      module: moduleName,
      recordId: announcement.id,
      newData: announcement.toJSON(),
      description: `Created announcement "${announcement.title || 'record'}"`
    });

    res.status(201).json({
      success: true,
      message: 'Announcement created successfully',
      data: announcement
    });

  } catch (error) {
    console.error('CREATE ANNOUNCEMENT ERROR:', error);

    res.status(500).json({
      success: false,
      message: 'Error creating announcement',
      error: error.message
    });
  }
};

// GET ALL ANNOUNCEMENTS (WITH CATEGORY SUPPORT)
exports.getAllAnnouncements = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, category } = req.query;
    const offset = (page - 1) * limit;
    const whereClause = {};

    if (category && allowedCategories.includes(category)) {
      whereClause.category = category;
    }

    if (search) {
      whereClause.title = {
        [Op.like]: `%${search}%`
      };
    }

    const { count, rows: announcements } = await Announcement.findAndCountAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    });

    res.json({
      success: true,
      data: announcements,
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
      message: 'Error fetching announcements',
      error: error.message
    });
  }
};

// UPDATE ANNOUNCEMENT
exports.updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    let { title, date, category } = req.body;

    const announcement = await Announcement.findByPk(id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    if (category && !allowedCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category'
      });
    }

    const oldData = announcement.toJSON();
    let pdf_url = announcement.pdf_url;

    if (req.file) {
      const oldFilePath = path.join(__dirname, '..', announcement.pdf_url);

      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }

      pdf_url = `/uploads/${req.file.path
        .split('uploads/')[1]
        .replace(/\\/g, '/')}`;
    }

    await announcement.update({
      title: title || announcement.title,
      date: date || announcement.date,
      category: category || announcement.category,
      pdf_url
    });

    const moduleName = getAnnouncementModule(announcement.category);

    await logAudit({
      req,
      action: 'UPDATE',
      module: moduleName,
      recordId: announcement.id,
      oldData,
      newData: announcement.toJSON(),
      description: `Updated announcement "${announcement.title || 'record'}"`
    });

    res.json({
      success: true,
      message: 'Announcement updated successfully',
      data: announcement
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating announcement',
      error: error.message
    });
  }
};

// DELETE ANNOUNCEMENT
exports.deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;

    const announcement = await Announcement.findByPk(id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    const oldData = buildSnapshot(announcement, SNAPSHOT_FIELDS);
    const moduleName = getAnnouncementModule(oldData.category);
    const entityLabel = getAnnouncementLabel(oldData.category);
    const filePath = path.join(__dirname, '..', announcement.pdf_url);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await announcement.destroy();

    await logAudit({
      req,
      action: 'DELETE_APPROVE',
      module: moduleName,
      recordId: announcement.id,
      oldData,
      description: buildDeleteDescription({
        entityLabel,
        title: oldData.title
      })
    });

    res.json({
      success: true,
      message: 'Announcement deleted successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting announcement',
      error: error.message
    });
  }
};
