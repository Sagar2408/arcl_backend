const express = require('express');
const router = express.Router();

const circularController = require('../controllers/circularController');
const authMiddleware = require('../middleware/authMiddleware');
const { circularValidation, idParamValidation } = require('../middleware/validators');
const upload = require('../middleware/uploadCircular');

// ✅ FIXED IMPORT (IMPORTANT)
const { checkPermission } = require('../middleware/permissionMiddleware');


// ================= PUBLIC / PROTECTED ROUTE =================

// Get all circulars (requires login + view permission)
router.get(
  '/',
  authMiddleware,
  checkPermission('circulars', 'view'),
  circularController.getAllCirculars
);


// ================= ADMIN ROUTES =================

// Create circular
router.post(
  '/',
  authMiddleware,
  checkPermission('circulars', 'create'),
  upload.single('pdf'),
  circularValidation,
  circularController.createCircular
);


// Update circular
router.put(
  '/:id',
  authMiddleware,
  checkPermission('circulars', 'update'),
  upload.single('pdf'),
  idParamValidation,
  circularController.updateCircular
);


// // Delete circular
// router.delete(
//   '/:id',
//   authMiddleware,
//   checkPermission('circulars', 'delete'),
//   idParamValidation,
//   circularController.deleteCircular
// );


module.exports = router;