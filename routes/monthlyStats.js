const express = require('express');
const router = express.Router();
const monthlyStatsController = require('../controllers/monthlyStatsController');
const authMiddleware = require('../middleware/auth');
const { monthlyStatsValidation, idParamValidation } = require('../middleware/validators');

// Public routes
router.get('/', monthlyStatsController.getAllMonthlyStats);

// Protected routes (Admin only)
router.post('/', authMiddleware, monthlyStatsValidation, monthlyStatsController.createMonthlyStat);
router.put('/:id', authMiddleware, idParamValidation, monthlyStatsController.updateMonthlyStat);
router.delete('/:id', authMiddleware, idParamValidation, monthlyStatsController.deleteMonthlyStat);

module.exports = router;