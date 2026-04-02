const { Announcement } = require('../models');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');


// CREATE ANNOUNCEMENT
exports.createAnnouncement = async (req, res) => {
  try {

    const { title, date, category = 'general' } = req.body;

    if (!title || !date) {
      return res.status(400).json({
        success: false,
        message: "Title and date are required"
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "PDF file is required"
      });
    }

    const pdf_url = `/uploads/announcements/${category}/${req.file.filename}`;

    const announcement = await Announcement.create({
      title,
      date,
      pdf_url,
      category
    });

    res.status(201).json({
      success: true,
      message: "Announcement created successfully",
      data: announcement
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Error creating announcement",
      error: error.message
    });

  }
};



// GET ALL ANNOUNCEMENTS (Pagination + Search)
exports.getAllAnnouncements = async (req, res) => {

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

    const { count, rows: announcements } = await Announcement.findAndCountAll({

      where: whereClause,

      order: [['created_at', 'DESC']],

      limit: parseInt(limit),

      offset: parseInt(offset)

    });

    res.json({
      success: true,
      data: announcements,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit),
        limit: parseInt(limit)
      }
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Error fetching announcements",
      error: error.message
    });

  }
};



// UPDATE ANNOUNCEMENT
exports.updateAnnouncement = async (req, res) => {

  try {

    const { id } = req.params;

    const { title, date, category } = req.body;

    const announcement = await Announcement.findByPk(id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found"
      });
    }

    let pdf_url = announcement.pdf_url;

    // If new PDF uploaded
    if (req.file) {

      // Delete old PDF
      const oldFilePath = path.join(__dirname, '..', announcement.pdf_url);

      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }

      pdf_url = `/uploads/announcements/${category || announcement.category}/${req.file.filename}`;
    }

    await announcement.update({
      title: title || announcement.title,
      date: date || announcement.date,
      pdf_url,
      category: category || announcement.category
    });

    res.json({
      success: true,
      message: "Announcement updated successfully",
      data: announcement
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Error updating announcement",
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
        message: "Announcement not found"
      });
    }

    // Delete PDF file
    const filePath = path.join(__dirname, '..', announcement.pdf_url);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await announcement.destroy();

    res.json({
      success: true,
      message: "Announcement deleted successfully"
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Error deleting announcement",
      error: error.message
    });

  }
};
