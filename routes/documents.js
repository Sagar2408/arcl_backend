const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadNewsletter');

const {
  createDocument,
  getDocuments,
  deleteDocument
} = require('../controllers/documentController');

router.post("/", upload.single("pdf"), createDocument);
router.get("/", getDocuments);
router.delete("/:id", deleteDocument);

module.exports = router;