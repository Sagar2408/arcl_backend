const { AnnualReport } = require('../models');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');


// CREATE ANNUAL REPORT
exports.createAnnualReport = async (req, res) => {
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

    const pdf_url = `/uploads/annual_reports/${req.file.filename}`;

    const annualReport = await AnnualReport.create({
      title,
      date,
      pdf_url
    });

    res.status(201).json({
      success: true,
      message: "Annual report created successfully",
      data: annualReport
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Error creating annual report",
      error: error.message
    });

  }
};



// GET ALL ANNUAL REPORTS (Pagination + Search)
exports.getAllAnnualReports = async (req, res) => {

  try {

    const { page = 1, limit = 10, search } = req.query;

    const offset = (page - 1) * limit;

    const whereClause = {};

    if (search) {
      whereClause.title = {
        [Op.like]: `%${search}%`
      };
    }

    const { count, rows: annualReports } = await AnnualReport.findAndCountAll({

      where: whereClause,

      order: [['created_at', 'DESC']],

      limit: parseInt(limit),

      offset: parseInt(offset)

    });

    res.json({
      success: true,
      data: annualReports,
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
      message: "Error fetching annual reports",
      error: error.message
    });

  }
};



// UPDATE ANNUAL REPORT
exports.updateAnnualReport = async (req, res) => {

  try {

    const { id } = req.params;

    const { title, date } = req.body;

    const annualReport = await AnnualReport.findByPk(id);

    if (!annualReport) {
      return res.status(404).json({
        success: false,
        message: "Annual report not found"
      });
    }

    let pdf_url = annualReport.pdf_url;

    // If new PDF uploaded
    if (req.file) {

      // Delete old PDF
      const oldFilePath = path.join(__dirname, '..', annualReport.pdf_url);

      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }

      pdf_url = `/uploads/annual_reports/${req.file.filename}`;
    }

    await annualReport.update({
      title: title || annualReport.title,
      date: date || annualReport.date,
      pdf_url
    });

    res.json({
      success: true,
      message: "Annual report updated successfully",
      data: annualReport
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Error updating annual report",
      error: error.message
    });

  }
};



// DELETE ANNUAL REPORT
exports.deleteAnnualReport = async (req, res) => {

  try {

    const { id } = req.params;

    const annualReport = await AnnualReport.findByPk(id);

    if (!annualReport) {
      return res.status(404).json({
        success: false,
        message: "Annual report not found"
      });
    }

    // Delete PDF file
    const filePath = path.join(__dirname, '..', annualReport.pdf_url);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await annualReport.destroy();

    res.json({
      success: true,
      message: "Annual report deleted successfully"
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Error deleting annual report",
      error: error.message
    });

  }
};