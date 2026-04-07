const express = require('express');
const router = express.Router();

const financialResultController = require('../controllers/financialResultController');
const authMiddleware = require('../middleware/authMiddleware');
const { financialResultValidation, idParamValidation } = require('../middleware/validators');
const upload = require('../middleware/uploadFinancialResult');

// ✅ ADD THIS
const { checkPermission } = require('../middleware/permissionMiddleware');


// ================= PROTECTED ROUTES =================

// Get all financial results (VIEW)
router.get(
  '/',
  authMiddleware,
  checkPermission('financial_results', 'view'),
  financialResultController.getAllFinancialResults
);


// ================= ADMIN ROUTES =================

// Create financial result
router.post(
  '/',
  authMiddleware,
  checkPermission('financial_results', 'create'),
  upload.single('pdf'),
  financialResultValidation,
  financialResultController.createFinancialResult
);


// Update financial result
router.put(
  '/:id',
  authMiddleware,
  checkPermission('financial_results', 'update'),
  upload.single('pdf'),
  idParamValidation,
  financialResultController.updateFinancialResult
);


// Delete financial result
router.delete(
  '/:id',
  authMiddleware,
  checkPermission('financial_results', 'delete'),
  idParamValidation,
  financialResultController.deleteFinancialResult
);


module.exports = router;