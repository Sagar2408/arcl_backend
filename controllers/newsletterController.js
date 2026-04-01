const { Newsletter } = require("../models");
const { Op } = require("sequelize");
const fs = require("fs");
const path = require("path");


// CREATE
exports.createNewsletter = async (req, res) => {
  try {
    const { title, date } = req.body;

    if (!title || !date) {
      return res.status(400).json({
        success: false,
        message: "Title and date are required",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "PDF file is required",
      });
    }

    const pdf_url = `/uploads/newsletters/${req.file.filename}`;

    const newsletter = await Newsletter.create({
      title,
      date,
      pdf_url,
    });

    res.status(201).json({
      success: true,
      message: "Newsletter created successfully",
      data: newsletter,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating newsletter",
      error: error.message,
    });
  }
};


// GET ALL
exports.getAllNewsletters = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;

    const offset = (page - 1) * limit;

    const whereClause = {};

    if (search) {
      whereClause.title = {
        [Op.like]: `%${search}%`,
      };
    }

    const { count, rows } = await Newsletter.findAndCountAll({
      where: whereClause,
      order: [["created_at", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching newsletters",
      error: error.message,
    });
  }
};


// UPDATE
exports.updateNewsletter = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, date } = req.body;

    const newsletter = await Newsletter.findByPk(id);

    if (!newsletter) {
      return res.status(404).json({
        success: false,
        message: "Newsletter not found",
      });
    }

    let pdf_url = newsletter.pdf_url;

    if (req.file) {
      const oldPath = path.join(
        __dirname,
        "..",
        newsletter.pdf_url.replace(/^\//, "")
      );

      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }

      pdf_url = `/uploads/newsletters/${req.file.filename}`;
    }

    await newsletter.update({
      title: title || newsletter.title,
      date: date || newsletter.date,
      pdf_url,
    });

    res.json({
      success: true,
      message: "Newsletter updated successfully",
      data: newsletter,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating newsletter",
      error: error.message,
    });
  }
};


// DELETE
exports.deleteNewsletter = async (req, res) => {
  try {
    const { id } = req.params;

    const newsletter = await Newsletter.findByPk(id);

    if (!newsletter) {
      return res.status(404).json({
        success: false,
        message: "Newsletter not found",
      });
    }

    const filePath = path.join(
      __dirname,
      "..",
      newsletter.pdf_url.replace(/^\//, "")
    );

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await newsletter.destroy();

    res.json({
      success: true,
      message: "Newsletter deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting newsletter",
      error: error.message,
    });
  }
};