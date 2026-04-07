const express = require('express');
const router = express.Router();
const deleteRequestController = require('../controllers/deleteRequestController');
const authMiddleware = require('../middleware/authMiddleware');
const { superAdminOnly } = require('../middleware/permissionMiddleware');

// All authenticated users
router.get('/', authMiddleware, deleteRequestController.getAllRequests);
router.post('/', authMiddleware, deleteRequestController.createRequest);

// Super Admin only
router.get('/pending/count', authMiddleware, superAdminOnly, deleteRequestController.getPendingCount);
router.put('/:id/approve', authMiddleware, superAdminOnly, deleteRequestController.approveRequest);
router.put('/:id/reject', authMiddleware, superAdminOnly, deleteRequestController.rejectRequest);

module.exports = router;