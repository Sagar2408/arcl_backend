const { FinancialStatement } = require('../models');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');


// CREATE FINANCIAL STATEMENT
exports.createFinancialStatement = async (req, res) => {
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

    const pdf_url = `/uploads/financial_statements/${req.file.filename}`;

    const financialStatement = await FinancialStatement.create({
      title,
      date,
      pdf_url
    });

    res.status(201).json({
      success: true,
      message: "Financial statement created successfully",
      data: financialStatement
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Error creating financial statement",
      error: error.message
    });

  }
};



// GET ALL FINANCIAL STATEMENTS (Pagination + Search)
exports.getAllFinancialStatements = async (req, res) => {

  try {

    const { page = 1, limit = 10, search } = req.query;

    const offset = (page - 1) * limit;

    const whereClause = {};

    if (search) {
      whereClause.title = {
        [Op.like]: `%${search}%`
      };
    }

    const { count, rows: financialStatements } = await FinancialStatement.findAndCountAll({

      where: whereClause,

      order: [['created_at', 'DESC']],

      limit: parseInt(limit),

      offset: parseInt(offset)

    });

    res.json({
      success: true,
      data: financialStatements,
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
      message: "Error fetching financial statements",
      error: error.message
    });

  }
};



// UPDATE FINANCIAL STATEMENT
exports.updateFinancialStatement = async (req, res) => {

  try {

    const { id } = req.params;

    const { title, date } = req.body;

    const financialStatement = await FinancialStatement.findByPk(id);

    if (!financialStatement) {
      return res.status(404).json({
        success: false,
        message: "Financial statement not found"
      });
    }

    let pdf_url = financialStatement.pdf_url;

    // If new PDF uploaded
    if (req.file) {

      // Delete old PDF
      const oldFilePath = path.join(__dirname, '..', financialStatement.pdf_url);

      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }

      pdf_url = `/uploads/financial_statements/${req.file.filename}`;
    }

    await financialStatement.update({
      title: title || financialStatement.title,
      date: date || financialStatement.date,
      pdf_url
    });

    res.json({
      success: true,
      message: "Financial statement updated successfully",
      data: financialStatement
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Error updating financial statement",
      error: error.message
    });

  }
};



// DELETE FINANCIAL STATEMENT
exports.deleteFinancialStatement = async (req, res) => {

  try {

    const { id } = req.params;

    const financialStatement = await FinancialStatement.findByPk(id);

    if (!financialStatement) {
      return res.status(404).json({
        success: false,
        message: "Financial statement not found"
      });
    }

    // Delete PDF file
    const filePath = path.join(__dirname, '..', financialStatement.pdf_url);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await financialStatement.destroy();

    res.json({
      success: true,
      message: "Financial statement deleted successfully"
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Error deleting financial statement",
      error: error.message
    });

  }
};