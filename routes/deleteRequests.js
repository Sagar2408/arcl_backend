const express = require('express');
const router = express.Router();

const deleteRequestController = require('../controllers/deleteRequestController');
const authMiddleware = require('../middleware/authMiddleware');
const { superAdminOnly } = require('../middleware/permissionMiddleware');

// Get all delete requests
router.get(
  '/',
  authMiddleware,
  deleteRequestController.getAllRequests
);

// Create delete request (Admin / Executive only - backend already checks role)
router.post(
  '/',
  authMiddleware,
  deleteRequestController.createRequest
);

// Get delete permissions (🔥 IMPORTANT for frontend logic)
router.get(
  '/permissions',
  authMiddleware,
  deleteRequestController.getDeletePermissions
);

// Get pending request count
router.get(
  '/pending/count',
  authMiddleware,
  superAdminOnly,
  deleteRequestController.getPendingCount
);

// Approve delete request
router.put(
  '/:id/approve',
  authMiddleware,
  superAdminOnly,
  deleteRequestController.approveRequest
);

// Reject delete request
router.put(
  '/:id/reject',
  authMiddleware,
  superAdminOnly,
  deleteRequestController.rejectRequest
);

router.delete(
  '/direct/:section/:record_id',
  authMiddleware,
  superAdminOnly,
  deleteRequestController.directDelete
);


module.exports = router;