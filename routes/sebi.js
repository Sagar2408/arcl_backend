const express = require('express');
const router = express.Router();

const sebiController = require('../controllers/sebiController');
const authMiddleware = require('../middleware/authMiddleware');
const { sebiValidation, idParamValidation } = require('../middleware/validators');
const upload = require('../middleware/uploadSEBI');

// ✅ ADD THIS
const { checkPermission } = require('../middleware/permissionMiddleware');


// ================= PROTECTED ROUTES =================

// Get all SEBI data (VIEW)
router.get(
  '/',
  authMiddleware,
  checkPermission('sebi', 'view'),
  sebiController.getAllSEBI
);


// ================= ADMIN ROUTES =================

// Create SEBI
router.post(
  '/',
  authMiddleware,
  checkPermission('sebi', 'create'),
  upload.single('pdf'),
  sebiValidation,
  sebiController.createSEBI
);


// Update SEBI
router.put(
  '/:id',
  authMiddleware,
  checkPermission('sebi', 'update'),
  upload.single('pdf'),
  idParamValidation,
  sebiController.updateSEBI
);


// Delete SEBI
router.delete(
  '/:id',
  authMiddleware,
  checkPermission('sebi', 'delete'),
  idParamValidation,
  sebiController.deleteSEBI
);


module.exports = router;