const express = require('express');
const router = express.Router();

const rbiController = require('../controllers/rbiController');
const authMiddleware = require('../middleware/authMiddleware');
const { rbiValidation, idParamValidation } = require('../middleware/validators');
const upload = require('../middleware/uploadRBI');

// ✅ ADD THIS
const { checkPermission } = require('../middleware/permissionMiddleware');


// ================= PROTECTED ROUTES =================

// Get all RBI data (VIEW)
router.get(
  '/',
  authMiddleware,
  checkPermission('rbi', 'view'),
  rbiController.getAllRBI
);


// ================= ADMIN ROUTES =================

// Create RBI
router.post(
  '/',
  authMiddleware,
  checkPermission('rbi', 'create'),
  upload.single('pdf'),
  rbiValidation,
  rbiController.createRBI
);


// Update RBI
router.put(
  '/:id',
  authMiddleware,
  checkPermission('rbi', 'update'),
  upload.single('pdf'),
  idParamValidation,
  rbiController.updateRBI
);


// Delete RBI
router.delete(
  '/:id',
  authMiddleware,
  checkPermission('rbi', 'delete'),
  idParamValidation,
  rbiController.deleteRBI
);


module.exports = router;