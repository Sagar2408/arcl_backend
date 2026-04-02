const express = require('express');
const router = express.Router();

const shareholdingPatternController = require('../controllers/shareholdingPatternController');
const authMiddleware = require('../middleware/auth');
const { shareholdingPatternValidation, idParamValidation } = require('../middleware/validators');
const upload = require('../middleware/uploadShareholdingPattern');


// PUBLIC ROUTE
router.get('/', shareholdingPatternController.getAllShareholdingPatterns);


// ADMIN ROUTES

// Create shareholding pattern
router.post(
  '/',
  authMiddleware,
  upload.single('pdf'),
  shareholdingPatternValidation,
  shareholdingPatternController.createShareholdingPattern
);


// Update shareholding pattern
router.put(
  '/:id',
  authMiddleware,
  upload.single('pdf'),
  idParamValidation,
  shareholdingPatternController.updateShareholdingPattern
);


// Delete shareholding pattern
router.delete(
  '/:id',
  authMiddleware,
  idParamValidation,
  shareholdingPatternController.deleteShareholdingPattern
);


module.exports = router;
