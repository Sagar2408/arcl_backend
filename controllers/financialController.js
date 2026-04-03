const { Financial } = require('../models');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');


// 🔥 CATEGORY → FOLDER MAPPING
const categoryFolderMap = {
  annual_report: "Annual Report",
  annual_return: "Annual Return",
  financial_result: "Financial Result",
  financial_statements: "Financial Statements",
  newspaper_publication: "Newspaper Publication"
};


// CREATE FINANCIAL
exports.createFinancial = async (req, res) => {
  try {

    const { title, date, category } = req.body;

    if (!title || !date || !category) {
      return res.status(400).json({
        success: false,
        message: "Title, date and category are required"
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "PDF file is required"
      });
    }

    const folderName = categoryFolderMap[category];

    if (!folderName) {
      return res.status(400).json({
        success: false,
        message: "Invalid category"
      });
    }

    // ✅ SAFEST WAY (NO PATH ERROR EVER)
    const pdf_url = `/uploads/${req.file.filename}`;

    const financial = await Financial.create({
      title,
      date,
      category,
      pdf_url
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



// GET ALL FINANCIALS
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

      // ✅ DELETE OLD FILE SAFELY
      const oldFilePath = path.join(__dirname, '..', financial.pdf_url);

      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }

      // ✅ SAFE PATH (NO DUPLICATION BUG)
      pdf_url = `/uploads/${req.file.path
        .split('uploads/')[1]
        .replace(/\\/g, '/')}`;
    }

    await financial.update({
      title: title || financial.title,
      date: date || financial.date,
      category: category || financial.category,
      pdf_url
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

    // ✅ DELETE FILE
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