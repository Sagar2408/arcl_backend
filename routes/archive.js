const express = require('express');
const router = express.Router();

const {
  getArchives,
  getArchiveById,
  deleteArchive,
  restoreArchive
} = require('../controllers/archiveController');

// ✅ SAME AS YOUR WORKING FILE
const authMiddleware = require('../middleware/authMiddleware');

// ❌ DON'T destructure verifyToken

// apply middleware
router.use(authMiddleware);

// routes
router.get('/', getArchives);
router.get('/:id', getArchiveById);
router.post('/restore/:id', restoreArchive);
router.delete('/:id', deleteArchive);

module.exports = router;