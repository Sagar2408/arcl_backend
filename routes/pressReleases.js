const express = require('express');
const router = express.Router();

const pressReleaseController = require('../controllers/pressReleaseController');
const authMiddleware = require('../middleware/authMiddleware');
const { pressReleaseValidation, idParamValidation } = require('../middleware/validators');
const upload = require('../middleware/uploadPressRelease');


// PUBLIC ROUTE
router.get('/', pressReleaseController.getAllPressReleases);


// ADMIN ROUTES

// Create press release
router.post(
  '/',
  authMiddleware,
  upload.single('pdf'),
  pressReleaseValidation,
  pressReleaseController.createPressRelease
);


// Update press release
router.put(
  '/:id',
  authMiddleware,
  upload.single('pdf'),
  idParamValidation,
  pressReleaseController.updatePressRelease
);


// Delete press release
router.delete(
  '/:id',
  authMiddleware,
  idParamValidation,
  pressReleaseController.deletePressRelease
);


module.exports = router;