const { Circular } = require('../models');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');

// CREATE CIRCULAR
exports.createCircular = async (req, res) => {
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

    const pdf_url = `/uploads/circulars/${req.file.filename}`;

    const circular = await Circular.create({
      title,
      date,
      pdf_url
    });

    res.status(201).json({
      success: true,
      message: "Circular created successfully",
      data: circular
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Error creating circular",
      error: error.message
    });

  }
};
// GET ALL CIRCULARS (Pagination + Search)
exports.getAllCirculars = async (req, res) => {

  try {

    const { page = 1, limit = 10, search } = req.query;

    const offset = (page - 1) * limit;

    const whereClause = {};

    if (search) {
      whereClause.title = {
        [Op.like]: `%${search}%`
      };
    }

    const { count, rows: circulars } = await Circular.findAndCountAll({

      where: whereClause,

      order: [['created_at', 'DESC']],

      limit: parseInt(limit),

      offset: parseInt(offset)

    });

    res.json({
      success: true,
      data: circulars,
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
      message: "Error fetching circulars",
      error: error.message
    });

  }
};
// UPDATE CIRCULAR
exports.updateCircular = async (req, res) => {

  try {

    const { id } = req.params;

    const { title, date } = req.body;

    const circular = await Circular.findByPk(id);

    if (!circular) {
      return res.status(404).json({
        success: false,
        message: "Circular not found"
      });
    }

    let pdf_url = circular.pdf_url;

    // If new PDF uploaded
    if (req.file) {

      // Delete old PDF
      const oldFilePath = path.join(__dirname, '..', circular.pdf_url);

      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }

      pdf_url = `/uploads/circulars/${req.file.filename}`;
    }

    await circular.update({
      title: title || circular.title,
      date: date || circular.date,
      pdf_url
    });

    res.json({
      success: true,
      message: "Circular updated successfully",
      data: circular
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Error updating circular",
      error: error.message
    });

  }
};
// DELETE CIRCULAR
exports.deleteCircular = async (req, res) => {
  try {
    // 🔥 BLOCK EXECUTIVE DIRECT DELETE
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: "You cannot delete directly. Raise a delete request."
      });
    }

    const { id } = req.params;

    const circular = await Circular.findByPk(id);

    if (!circular) {
      return res.status(404).json({
        success: false,
        message: "Circular not found"
      });
    }

    // 🔥 SAFE FILE PATH FIX
    const filePath = path.join(
      __dirname,
      '..',
      'uploads',
      'circulars',
      path.basename(circular.pdf_url || '')
    );

    // 🔥 SAFE FILE DELETE
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (fileErr) {
      console.error("File delete error:", fileErr);
    }

    // 🔥 DELETE RECORD
    await circular.destroy();

    res.json({
      success: true,
      message: "Circular deleted successfully"
    });

  } catch (error) {
    console.error("Delete Circular Error:", error);

    res.status(500).json({
      success: false,
      message: "Error deleting circular"
    });
  }
};