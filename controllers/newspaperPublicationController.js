const { NewspaperPublication } = require('../models');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');


// CREATE NEWSPAPER PUBLICATION
exports.createNewspaperPublication = async (req, res) => {
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

    const pdf_url = `/uploads/newspaper_publications/${req.file.filename}`;

    const newspaperPublication = await NewspaperPublication.create({
      title,
      date,
      pdf_url
    });

    res.status(201).json({
      success: true,
      message: "Newspaper publication created successfully",
      data: newspaperPublication
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Error creating newspaper publication",
      error: error.message
    });

  }
};



// GET ALL NEWSPAPER PUBLICATIONS (Pagination + Search)
exports.getAllNewspaperPublications = async (req, res) => {

  try {

    const { page = 1, limit = 10, search } = req.query;

    const offset = (page - 1) * limit;

    const whereClause = {};

    if (search) {
      whereClause.title = {
        [Op.like]: `%${search}%`
      };
    }

    const { count, rows: newspaperPublications } = await NewspaperPublication.findAndCountAll({

      where: whereClause,

      order: [['created_at', 'DESC']],

      limit: parseInt(limit),

      offset: parseInt(offset)

    });

    res.json({
      success: true,
      data: newspaperPublications,
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
      message: "Error fetching newspaper publications",
      error: error.message
    });

  }
};



// UPDATE NEWSPAPER PUBLICATION
exports.updateNewspaperPublication = async (req, res) => {

  try {

    const { id } = req.params;

    const { title, date } = req.body;

    const newspaperPublication = await NewspaperPublication.findByPk(id);

    if (!newspaperPublication) {
      return res.status(404).json({
        success: false,
        message: "Newspaper publication not found"
      });
    }

    let pdf_url = newspaperPublication.pdf_url;

    // If new PDF uploaded
    if (req.file) {

      // Delete old PDF
      const oldFilePath = path.join(__dirname, '..', newspaperPublication.pdf_url);

      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }

      pdf_url = `/uploads/newspaper_publications/${req.file.filename}`;
    }

    await newspaperPublication.update({
      title: title || newspaperPublication.title,
      date: date || newspaperPublication.date,
      pdf_url
    });

    res.json({
      success: true,
      message: "Newspaper publication updated successfully",
      data: newspaperPublication
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Error updating newspaper publication",
      error: error.message
    });

  }
};



// DELETE NEWSPAPER PUBLICATION
exports.deleteNewspaperPublication = async (req, res) => {

  try {

    const { id } = req.params;

    const newspaperPublication = await NewspaperPublication.findByPk(id);

    if (!newspaperPublication) {
      return res.status(404).json({
        success: false,
        message: "Newspaper publication not found"
      });
    }

    // Delete PDF file
    const filePath = path.join(__dirname, '..', newspaperPublication.pdf_url);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await newspaperPublication.destroy();

    res.json({
      success: true,
      message: "Newspaper publication deleted successfully"
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Error deleting newspaper publication",
      error: error.message
    });

  }
};