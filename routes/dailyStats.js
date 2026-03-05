const express = require('express');
const router = express.Router();
const dailyStatsController = require('../controllers/dailyStatsController');
const authMiddleware = require('../middleware/auth');
const { dailyStatsValidation, idParamValidation } = require('../middleware/validators');

// Public routes
router.get('/', dailyStatsController.getAllDailyStats);

// Protected routes (Admin only)
router.post('/', authMiddleware, dailyStatsValidation, dailyStatsController.createDailyStat);
router.put('/:id', authMiddleware, idParamValidation, dailyStatsController.updateDailyStat);
router.delete('/:id', authMiddleware, idParamValidation, dailyStatsController.deleteDailyStat);

module.exports = router;