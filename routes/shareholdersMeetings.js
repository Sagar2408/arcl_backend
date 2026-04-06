const express = require('express');
const router = express.Router();

const shareholdersMeetingController = require('../controllers/shareholdersMeetingController');
const authMiddleware = require('../middleware/auth');
const { shareholdersMeetingValidation, idParamValidation } = require('../middleware/validators');
const upload = require('../middleware/uploadShareholdersMeeting');


// PUBLIC ROUTE
router.get('/', shareholdersMeetingController.getAllShareholdersMeetings);


// ADMIN ROUTES

// Create shareholders meeting
router.post(
  '/',
  authMiddleware,
  upload.single('pdf'),
  shareholdersMeetingValidation,
  shareholdersMeetingController.createShareholdersMeeting
);


// Update shareholders meeting
router.put(
  '/:id',
  authMiddleware,
  upload.single('pdf'),
  idParamValidation,
  shareholdersMeetingController.updateShareholdersMeeting
);


// Delete shareholders meeting
router.delete(
  '/:id',
  authMiddleware,
  idParamValidation,
  shareholdersMeetingController.deleteShareholdersMeeting
);


module.exports = router;