const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload folder exists
const uploadPath = path.join(__dirname, '../uploads/investor_complaints');

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

// Storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPath);
  },

  filename: function (req, file, cb) {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

// File filter (only PDF)
const fileFilter = (req, file, cb) => {

  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }

};

const upload = multer({
  storage,
  fileFilter
});

module.exports = upload;