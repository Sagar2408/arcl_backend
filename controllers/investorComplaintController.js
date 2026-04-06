const { InvestorComplaint } = require('../models');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');


// CREATE INVESTOR COMPLAINT
exports.createInvestorComplaint = async (req, res) => {
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

    const pdf_url = `/uploads/investor_complaints/${req.file.filename}`;

    const complaint = await InvestorComplaint.create({
      title,
      date,
      pdf_url
    });

    res.status(201).json({
      success: true,
      message: "Investor complaint created successfully",
      data: complaint
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Error creating investor complaint",
      error: error.message
    });

  }
};



// GET ALL INVESTOR COMPLAINTS (Pagination + Search)
exports.getAllInvestorComplaints = async (req, res) => {

  try {

    const { page = 1, limit = 10, search } = req.query;

    const offset = (page - 1) * limit;

    const whereClause = {};

    if (search) {
      whereClause.title = {
        [Op.like]: `%${search}%`
      };
    }

    const { count, rows: complaints } = await InvestorComplaint.findAndCountAll({

      where: whereClause,

      order: [['created_at', 'DESC']],

      limit: parseInt(limit),

      offset: parseInt(offset)

    });

    res.json({
      success: true,
      data: complaints,
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
      message: "Error fetching investor complaints",
      error: error.message
    });

  }
};



// UPDATE INVESTOR COMPLAINT
exports.updateInvestorComplaint = async (req, res) => {

  try {

    const { id } = req.params;

    const { title, date } = req.body;

    const complaint = await InvestorComplaint.findByPk(id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Investor complaint not found"
      });
    }

    let pdf_url = complaint.pdf_url;

    // If new PDF uploaded
    if (req.file) {

      // Delete old PDF
      const oldFilePath = path.join(__dirname, '..', complaint.pdf_url);

      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }

      pdf_url = `/uploads/investor_complaints/${req.file.filename}`;
    }

    await complaint.update({
      title: title || complaint.title,
      date: date || complaint.date,
      pdf_url
    });

    res.json({
      success: true,
      message: "Investor complaint updated successfully",
      data: complaint
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Error updating investor complaint",
      error: error.message
    });

  }
};



// DELETE INVESTOR COMPLAINT
exports.deleteInvestorComplaint = async (req, res) => {

  try {

    const { id } = req.params;

    const complaint = await InvestorComplaint.findByPk(id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Investor complaint not found"
      });
    }

    // Delete PDF file
    const filePath = path.join(__dirname, '..', complaint.pdf_url);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await complaint.destroy();

    res.json({
      success: true,
      message: "Investor complaint deleted successfully"
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Error deleting investor complaint",
      error: error.message
    });

  }
};