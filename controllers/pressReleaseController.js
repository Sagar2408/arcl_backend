const { PressRelease } = require('../models');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');


// CREATE PRESS RELEASE
exports.createPressRelease = async (req, res) => {
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

    const pdf_url = `/uploads/press-release/${category}/${req.file.filename}`;

    const release = await PressRelease.create({
      title,
      date,
      pdf_url,
      category
    });

    res.status(201).json({
      success: true,
      message: "Press release created successfully",
      data: release
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Error creating press release",
      error: error.message
    });

  }
};



// GET ALL PRESS RELEASES (Pagination + Search)
exports.getAllPressReleases = async (req, res) => {

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

    const { count, rows: releases } = await PressRelease.findAndCountAll({

      where: whereClause,

      order: [['created_at', 'DESC']],

      limit: parseInt(limit),

      offset: parseInt(offset)

    });

    res.json({
      success: true,
      data: releases,
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
      message: "Error fetching press releases",
      error: error.message
    });

  }
};



// UPDATE PRESS RELEASE
exports.updatePressRelease = async (req, res) => {

  try {

    const { id } = req.params;

    const { title, date, category } = req.body;

    const release = await PressRelease.findByPk(id);

    if (!release) {
      return res.status(404).json({
        success: false,
        message: "Press release not found"
      });
    }

    let pdf_url = release.pdf_url;

    // If new PDF uploaded
    if (req.file) {

      // Delete old PDF
      const oldFilePath = path.join(__dirname, '..', release.pdf_url);

      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }

      pdf_url = `/uploads/press-release/${category || release.category}/${req.file.filename}`;
    }

    await release.update({
      title: title || release.title,
      date: date || release.date,
      pdf_url,
      category: category || release.category
    });

    res.json({
      success: true,
      message: "Press release updated successfully",
      data: release
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Error updating press release",
      error: error.message
    });

  }
};



// DELETE PRESS RELEASE
exports.deletePressRelease = async (req, res) => {

  try {

    const { id } = req.params;

    const release = await PressRelease.findByPk(id);

    if (!release) {
      return res.status(404).json({
        success: false,
        message: "Press release not found"
      });
    }

    // Delete PDF file
    const filePath = path.join(__dirname, '..', release.pdf_url);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await release.destroy();

    res.json({
      success: true,
      message: "Press release deleted successfully"
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Error deleting press release",
      error: error.message
    });

  }
};
