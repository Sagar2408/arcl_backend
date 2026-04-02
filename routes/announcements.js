const express = require('express');
const router = express.Router();

const announcementController = require('../controllers/announcementController');
const authMiddleware = require('../middleware/auth');
const { announcementValidation, idParamValidation } = require('../middleware/validators');
const upload = require('../middleware/uploadAnnouncement');


// PUBLIC ROUTE
router.get('/', announcementController.getAllAnnouncements);


// ADMIN ROUTES

// Create announcement
router.post(
  '/',
  authMiddleware,
  upload.single('pdf'),
  announcementValidation,
  announcementController.createAnnouncement
);


// Update announcement
router.put(
  '/:id',
  authMiddleware,
  upload.single('pdf'),
  idParamValidation,
  announcementController.updateAnnouncement
);


// Delete announcement
router.delete(
  '/:id',
  authMiddleware,
  idParamValidation,
  announcementController.deleteAnnouncement
);


module.exports = router;
