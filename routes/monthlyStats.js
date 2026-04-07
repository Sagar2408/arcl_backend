const express = require('express');
const router = express.Router();

const monthlyStatsController = require('../controllers/monthlyStatsController');
const authMiddleware = require('../middleware/authMiddleware');
const { monthlyStatsValidation, idParamValidation } = require('../middleware/validators');

// ✅ ADD THIS
const { checkPermission } = require('../middleware/permissionMiddleware');


// ================= PROTECTED ROUTES =================

// Get all monthly stats (view permission)
router.get(
  '/',
  authMiddleware,
  checkPermission('monthly_stats', 'view'),
  monthlyStatsController.getAllMonthlyStats
);


// ================= ADMIN ROUTES =================

// Create monthly stat
router.post(
  '/',
  authMiddleware,
  checkPermission('monthly_stats', 'create'),
  monthlyStatsValidation,
  monthlyStatsController.createMonthlyStat
);


// Update monthly stat
router.put(
  '/:id',
  authMiddleware,
  checkPermission('monthly_stats', 'update'),
  idParamValidation,
  monthlyStatsController.updateMonthlyStat
);


// Delete monthly stat
router.delete(
  '/:id',
  authMiddleware,
  checkPermission('monthly_stats', 'delete'),
  idParamValidation,
  monthlyStatsController.deleteMonthlyStat
);


module.exports = router;