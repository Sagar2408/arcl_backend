const express = require('express');
const router = express.Router();

const masterCircularController = require('../controllers/masterCircularController');
const authMiddleware = require('../middleware/authMiddleware');
const { circularValidation, idParamValidation } = require('../middleware/validators');
const upload = require('../middleware/uploadMasterCircular');

// ✅ ADD THIS
const { checkPermission } = require('../middleware/permissionMiddleware');


// ================= PROTECTED ROUTE =================

// Get all master circulars (view permission)
router.get(
  '/',
  authMiddleware,
  checkPermission('master_circulars', 'view'),
  masterCircularController.getAllMasterCirculars
);


// ================= ADMIN ROUTES =================

// Create master circular
router.post(
  '/',
  authMiddleware,
  checkPermission('master_circulars', 'create'),
  upload.single('pdf'),
  circularValidation,
  masterCircularController.createMasterCircular
);


// Update master circular
router.put(
  '/:id',
  authMiddleware,
  checkPermission('master_circulars', 'update'),
  upload.single('pdf'),
  idParamValidation,
  masterCircularController.updateMasterCircular
);


// Delete master circular
router.delete(
  '/:id',
  authMiddleware,
  checkPermission('master_circulars', 'delete'),
  idParamValidation,
  masterCircularController.deleteMasterCircular
);


module.exports = router;