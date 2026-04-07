const express = require('express');
const router = express.Router();

const shareholdersMeetingController = require('../controllers/shareholdersMeetingController');
const authMiddleware = require('../middleware/authMiddleware');
const { shareholdersMeetingValidation, idParamValidation } = require('../middleware/validators');
const upload = require('../middleware/uploadShareholdersMeeting');

// ✅ ADD THIS
const { checkPermission } = require('../middleware/permissionMiddleware');


// ================= PROTECTED ROUTES =================

// Get all shareholders meetings (VIEW)
router.get(
  '/',
  authMiddleware,
  checkPermission('shareholders_meetings', 'view'),
  shareholdersMeetingController.getAllShareholdersMeetings
);


// ================= ADMIN ROUTES =================

// Create shareholders meeting
router.post(
  '/',
  authMiddleware,
  checkPermission('shareholders_meetings', 'create'),
  upload.single('pdf'),
  shareholdersMeetingValidation,
  shareholdersMeetingController.createShareholdersMeeting
);


// Update shareholders meeting
router.put(
  '/:id',
  authMiddleware,
  checkPermission('shareholders_meetings', 'update'),
  upload.single('pdf'),
  idParamValidation,
  shareholdersMeetingController.updateShareholdersMeeting
);


// Delete shareholders meeting
router.delete(
  '/:id',
  authMiddleware,
  checkPermission('shareholders_meetings', 'delete'),
  idParamValidation,
  shareholdersMeetingController.deleteShareholdersMeeting
);


module.exports = router;