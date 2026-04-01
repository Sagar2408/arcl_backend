const { Document } = require('../models');
const fs = require('fs');
const path = require('path');

// CREATE
exports.createDocument = async (req, res) => {
  try {
    const { title, date, category } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "PDF required" });
    }

    const pdf_url = `/uploads/documents/${req.file.filename}`;

    const doc = await Document.create({
      title,
      date,
      category,
      pdf_url
    });

    res.json({ success: true, data: doc });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};


// GET BY CATEGORY
exports.getDocuments = async (req, res) => {
  try {
    const { category } = req.query;

    const docs = await Document.findAll({
      where: { category },
      order: [['created_at', 'DESC']]
    });

    res.json({ success: true, data: docs });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};


// DELETE
exports.deleteDocument = async (req, res) => {
  const { id } = req.params;

  const doc = await Document.findByPk(id);

  if (!doc) return res.status(404).json({ message: "Not found" });

  const filePath = path.join(__dirname, '..', doc.pdf_url);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  await doc.destroy();

  res.json({ success: true });
};