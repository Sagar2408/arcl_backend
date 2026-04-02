const { Financial } = require('../models');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');


// CREATE FINANCIAL
exports.createFinancial = async (req, res) => {
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

    const pdf_url = `/uploads/financials/${category}/${req.file.filename}`;

    const financial = await Financial.create({
      title,
      date,
      pdf_url,
      category
    });

    res.status(201).json({
      success: true,
      message: "Financial record created successfully",
      data: financial
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Error creating financial record",
      error: error.message
    });

  }
};



// GET ALL FINANCIALS (Pagination + Search)
exports.getAllFinancials = async (req, res) => {

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

    const { count, rows: financials } = await Financial.findAndCountAll({

      where: whereClause,

      order: [['created_at', 'DESC']],

      limit: parseInt(limit),

      offset: parseInt(offset)

    });

    res.json({
      success: true,
      data: financials,
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
      message: "Error fetching financial records",
      error: error.message
    });

  }
};



// UPDATE FINANCIAL
exports.updateFinancial = async (req, res) => {

  try {

    const { id } = req.params;

    const { title, date, category } = req.body;

    const financial = await Financial.findByPk(id);

    if (!financial) {
      return res.status(404).json({
        success: false,
        message: "Financial record not found"
      });
    }

    let pdf_url = financial.pdf_url;

    // If new PDF uploaded
    if (req.file) {

      // Delete old PDF
      const oldFilePath = path.join(__dirname, '..', financial.pdf_url);

      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }

      pdf_url = `/uploads/financials/${category || financial.category}/${req.file.filename}`;
    }

    await financial.update({
      title: title || financial.title,
      date: date || financial.date,
      pdf_url,
      category: category || financial.category
    });

    res.json({
      success: true,
      message: "Financial record updated successfully",
      data: financial
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Error updating financial record",
      error: error.message
    });

  }
};



// DELETE FINANCIAL
exports.deleteFinancial = async (req, res) => {

  try {

    const { id } = req.params;

    const financial = await Financial.findByPk(id);

    if (!financial) {
      return res.status(404).json({
        success: false,
        message: "Financial record not found"
      });
    }

    // Delete PDF file
    const filePath = path.join(__dirname, '..', financial.pdf_url);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await financial.destroy();

    res.json({
      success: true,
      message: "Financial record deleted successfully"
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Error deleting financial record",
      error: error.message
    });

  }
};
