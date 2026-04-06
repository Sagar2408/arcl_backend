const { SEBI } = require('../models');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');


// CREATE SEBI
exports.createSEBI = async (req, res) => {
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

    const pdf_url = `/uploads/sebi/${req.file.filename}`;

    const sebi = await SEBI.create({
      title,
      date,
      pdf_url
    });

    res.status(201).json({
      success: true,
      message: "SEBI created successfully",
      data: sebi
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Error creating SEBI",
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

      limit: parseInt(limit),

      offset: parseInt(offset)

    });

    res.json({
      success: true,
      data: sebi,
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
      message: "Error fetching SEBI",
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
        message: "SEBI not found"
      });
    }

    let pdf_url = sebi.pdf_url;

    // If new PDF uploaded
    if (req.file) {

      // Delete old PDF
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

    res.json({
      success: true,
      message: "SEBI updated successfully",
      data: sebi
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Error updating SEBI",
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
        message: "SEBI not found"
      });
    }

    // Delete PDF file
    const filePath = path.join(__dirname, '..', sebi.pdf_url);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await sebi.destroy();

    res.json({
      success: true,
      message: "SEBI deleted successfully"
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Error deleting SEBI",
      error: error.message
    });

  }
};