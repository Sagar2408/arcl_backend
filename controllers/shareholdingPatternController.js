const { ShareholdingPattern } = require('../models');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');


// CREATE SHAREHOLDING PATTERN
exports.createShareholdingPattern = async (req, res) => {
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

    // ✅ FIXED LINE
    const pdf_url = `/uploads/${req.file.filename}`;

    const pattern = await ShareholdingPattern.create({
      title,
      date,
      pdf_url,
      category
    });

    res.status(201).json({
      success: true,
      message: "Shareholding pattern created successfully",
      data: pattern
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Error creating shareholding pattern",
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

      limit: parseInt(limit),

      offset: parseInt(offset)

    });

    res.json({
      success: true,
      data: patterns,
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
      message: "Error fetching shareholding patterns",
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
        message: "Shareholding pattern not found"
      });
    }

    let pdf_url = pattern.pdf_url;

    // If new PDF uploaded
    if (req.file) {

      // Delete old PDF
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

    res.json({
      success: true,
      message: "Shareholding pattern updated successfully",
      data: pattern
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Error updating shareholding pattern",
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
        message: "Shareholding pattern not found"
      });
    }

    // Delete PDF file
    const filePath = path.join(__dirname, '..', pattern.pdf_url);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await pattern.destroy();

    res.json({
      success: true,
      message: "Shareholding pattern deleted successfully"
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Error deleting shareholding pattern",
      error: error.message
    });

  }
};
