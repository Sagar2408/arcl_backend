const express = require('express');
const router = express.Router();

const announcementController = require('../controllers/announcementController');
const authMiddleware = require('../middleware/authMiddleware');
const { announcementValidation, idParamValidation } = require('../middleware/validators');
const upload = require('../middleware/uploadAnnouncement');

// ✅ ADD THIS
const { checkPermission } = require('../middleware/permissionMiddleware');


// ================= PROTECTED ROUTES =================

// Get all announcements (VIEW)
router.get(
  '/',
  authMiddleware,
  checkPermission('announcements', 'view'),
  announcementController.getAllAnnouncements
);


// ================= ADMIN ROUTES =================

// Create announcement
router.post(
  '/',
  authMiddleware,
  checkPermission('announcements', 'create'),
  upload.single('pdf'),
  announcementValidation,
  announcementController.createAnnouncement
);


// Update announcement
router.put(
  '/:id',
  authMiddleware,
  checkPermission('announcements', 'update'),
  upload.single('pdf'),
  idParamValidation,
  announcementController.updateAnnouncement
);


// Delete announcement
router.delete(
  '/:id',
  authMiddleware,
  checkPermission('announcements', 'delete'),
  idParamValidation,
  announcementController.deleteAnnouncement
);


module.exports = router;