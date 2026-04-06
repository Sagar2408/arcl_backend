const { ShareholdersMeeting } = require('../models');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');


// CREATE SHAREHOLDERS MEETING
exports.createShareholdersMeeting = async (req, res) => {
  try {

    const { title, date } = req.body;

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

    const pdf_url = `/uploads/shareholders_meetings/${req.file.filename}`;

    const meeting = await ShareholdersMeeting.create({
      title,
      date,
      pdf_url
    });

    res.status(201).json({
      success: true,
      message: "Shareholders meeting created successfully",
      data: meeting
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Error creating shareholders meeting",
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

      limit: parseInt(limit),

      offset: parseInt(offset)

    });

    res.json({
      success: true,
      data: meetings,
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
      message: "Error fetching shareholders meetings",
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
        message: "Shareholders meeting not found"
      });
    }

    let pdf_url = meeting.pdf_url;

    // If new PDF uploaded
    if (req.file) {

      // Delete old PDF
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

    res.json({
      success: true,
      message: "Shareholders meeting updated successfully",
      data: meeting
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Error updating shareholders meeting",
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
        message: "Shareholders meeting not found"
      });
    }

    // Delete PDF file
    const filePath = path.join(__dirname, '..', meeting.pdf_url);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await meeting.destroy();

    res.json({
      success: true,
      message: "Shareholders meeting deleted successfully"
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Error deleting shareholders meeting",
      error: error.message
    });

  }
};