const express = require('express');
const router = express.Router();

const pressReleaseController = require('../controllers/pressReleaseController');
const authMiddleware = require('../middleware/authMiddleware');
const { pressReleaseValidation, idParamValidation } = require('../middleware/validators');
const upload = require('../middleware/uploadPressRelease');

// ✅ ADD THIS
const { checkPermission } = require('../middleware/permissionMiddleware');


// ================= PROTECTED ROUTES =================

// Get all press releases (VIEW)
router.get(
  '/',
  authMiddleware,
  checkPermission('press_releases', 'view'),
  pressReleaseController.getAllPressReleases
);


// ================= ADMIN ROUTES =================

// Create press release
router.post(
  '/',
  authMiddleware,
  checkPermission('press_releases', 'create'),
  upload.single('pdf'),
  pressReleaseValidation,
  pressReleaseController.createPressRelease
);


// Update press release
router.put(
  '/:id',
  authMiddleware,
  checkPermission('press_releases', 'update'),
  upload.single('pdf'),
  idParamValidation,
  pressReleaseController.updatePressRelease
);


// Delete press release
router.delete(
  '/:id',
  authMiddleware,
  checkPermission('press_releases', 'delete'),
  idParamValidation,
  pressReleaseController.deletePressRelease
);


module.exports = router;