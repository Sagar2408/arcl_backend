const express = require('express');
const router = express.Router();

const dailyStatsController = require('../controllers/dailyStatsController');
const authMiddleware = require('../middleware/authMiddleware');
const { dailyStatsValidation, idParamValidation } = require('../middleware/validators');

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