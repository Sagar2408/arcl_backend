const { RBI } = require('../models');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');


// CREATE RBI
exports.createRBI = async (req, res) => {
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

    const pdf_url = `/uploads/rbi/${req.file.filename}`;

    const rbi = await RBI.create({
      title,
      date,
      pdf_url
    });

    res.status(201).json({
      success: true,
      message: "RBI created successfully",
      data: rbi
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Error creating RBI",
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

      limit: parseInt(limit),

      offset: parseInt(offset)

    });

    res.json({
      success: true,
      data: rbi,
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
      message: "Error fetching RBI",
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
        message: "RBI not found"
      });
    }

    let pdf_url = rbi.pdf_url;

    // If new PDF uploaded
    if (req.file) {

      // Delete old PDF
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

    res.json({
      success: true,
      message: "RBI updated successfully",
      data: rbi
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Error updating RBI",
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
        message: "RBI not found"
      });
    }

    // Delete PDF file
    const filePath = path.join(__dirname, '..', rbi.pdf_url);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await rbi.destroy();

    res.json({
      success: true,
      message: "RBI deleted successfully"
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Error deleting RBI",
      error: error.message
    });

  }
};