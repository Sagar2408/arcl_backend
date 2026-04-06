const { FinancialResult } = require('../models');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');


// CREATE FINANCIAL RESULT
exports.createFinancialResult = async (req, res) => {
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

    const pdf_url = `/uploads/financial_results/${req.file.filename}`;

    const financialResult = await FinancialResult.create({
      title,
      date,
      pdf_url
    });

    res.status(201).json({
      success: true,
      message: "Financial result created successfully",
      data: financialResult
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Error creating financial result",
      error: error.message
    });

  }
};



// GET ALL FINANCIAL RESULTS (Pagination + Search)
exports.getAllFinancialResults = async (req, res) => {

  try {

    const { page = 1, limit = 10, search } = req.query;

    const offset = (page - 1) * limit;

    const whereClause = {};

    if (search) {
      whereClause.title = {
        [Op.like]: `%${search}%`
      };
    }

    const { count, rows: financialResults } = await FinancialResult.findAndCountAll({

      where: whereClause,

      order: [['created_at', 'DESC']],

      limit: parseInt(limit),

      offset: parseInt(offset)

    });

    res.json({
      success: true,
      data: financialResults,
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
      message: "Error fetching financial results",
      error: error.message
    });

  }
};



// UPDATE FINANCIAL RESULT
exports.updateFinancialResult = async (req, res) => {

  try {

    const { id } = req.params;

    const { title, date } = req.body;

    const financialResult = await FinancialResult.findByPk(id);

    if (!financialResult) {
      return res.status(404).json({
        success: false,
        message: "Financial result not found"
      });
    }

    let pdf_url = financialResult.pdf_url;

    // If new PDF uploaded
    if (req.file) {

      // Delete old PDF
      const oldFilePath = path.join(__dirname, '..', financialResult.pdf_url);

      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }

      pdf_url = `/uploads/financial_results/${req.file.filename}`;
    }

    await financialResult.update({
      title: title || financialResult.title,
      date: date || financialResult.date,
      pdf_url
    });

    res.json({
      success: true,
      message: "Financial result updated successfully",
      data: financialResult
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Error updating financial result",
      error: error.message
    });

  }
};



// DELETE FINANCIAL RESULT
exports.deleteFinancialResult = async (req, res) => {

  try {

    const { id } = req.params;

    const financialResult = await FinancialResult.findByPk(id);

    if (!financialResult) {
      return res.status(404).json({
        success: false,
        message: "Financial result not found"
      });
    }

    // Delete PDF file
    const filePath = path.join(__dirname, '..', financialResult.pdf_url);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await financialResult.destroy();

    res.json({
      success: true,
      message: "Financial result deleted successfully"
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Error deleting financial result",
      error: error.message
    });

  }
};