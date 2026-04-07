const express = require('express');
const router = express.Router();

const auditController = require('../controllers/auditController');
const authMiddleware = require('../middleware/authMiddleware');
const { superAdminOnly } = require('../middleware/permissionMiddleware');


// ================= SUPER ADMIN ONLY =================

router.get('/', authMiddleware, superAdminOnly, auditController.getAllLogs);

router.get('/statistics', authMiddleware, superAdminOnly, auditController.getStatistics);

router.get('/:id', authMiddleware, superAdminOnly, auditController.getLogById);

router.post('/cleanup', authMiddleware, superAdminOnly, auditController.deleteOldLogs);


module.exports = router;