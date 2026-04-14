const express = require('express');
const router = express.Router();

const dailyStatsController = require('../controllers/dailyStatsController');
const authMiddleware = require('../middleware/authMiddleware');
const { dailyStatsValidation, idParamValidation } = require('../middleware/validators');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
// ✅ ADD THIS
const { checkPermission } = require('../middleware/permissionMiddleware');


// ================= PROTECTED ROUTES =================

// Get all daily stats (view permission)
router.get(
  '/',
  authMiddleware,
  checkPermission('daily_stats', 'view'),
  dailyStatsController.getAllDailyStats
);


// ================= ADMIN ROUTES =================

// Create daily stat
router.post(
  '/',
  authMiddleware,
  checkPermission('daily_stats', 'create'),
  dailyStatsValidation,
  dailyStatsController.createDailyStat
);

// Bulk upload daily stats (Excel)
router.post(
  '/bulk-upload',
  authMiddleware,
  checkPermission('daily_stats', 'create'), // or 'update' if you want stricter control
  upload.single('file'),
  dailyStatsController.bulkUploadDailyStats
);

// Update daily stat
router.put(
  '/:id',
  authMiddleware,
  checkPermission('daily_stats', 'update'),
  idParamValidation,
  dailyStatsController.updateDailyStat
);


// Delete daily stat
router.delete(
  '/:id',
  authMiddleware,
  checkPermission('daily_stats', 'delete'),
  idParamValidation,
  dailyStatsController.deleteDailyStat
);


module.exports = router;