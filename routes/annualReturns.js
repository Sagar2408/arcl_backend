const express = require('express');
const router = express.Router();

const annualReturnController = require('../controllers/annualReturnController');
const authMiddleware = require('../middleware/authMiddleware');
const { annualReturnValidation, idParamValidation } = require('../middleware/validators');
const upload = require('../middleware/uploadAnnualReturn');

// ✅ ADD THIS
const { checkPermission } = require('../middleware/permissionMiddleware');


// ================= PROTECTED ROUTES =================

// Get all annual returns (VIEW)
router.get(
  '/',
  authMiddleware,
  checkPermission('annual_returns', 'view'),
  annualReturnController.getAllAnnualReturns
);


// ================= ADMIN ROUTES =================

// Create annual return
router.post(
  '/',
  authMiddleware,
  checkPermission('annual_returns', 'create'),
  upload.single('pdf'),
  annualReturnValidation,
  annualReturnController.createAnnualReturn
);


// Update annual return
router.put(
  '/:id',
  authMiddleware,
  checkPermission('annual_returns', 'update'),
  upload.single('pdf'),
  idParamValidation,
  annualReturnController.updateAnnualReturn
);


// Delete annual return
router.delete(
  '/:id',
  authMiddleware,
  checkPermission('annual_returns', 'delete'),
  idParamValidation,
  annualReturnController.deleteAnnualReturn
);


module.exports = router;