const express = require('express');
const router = express.Router();

const financialStatementController = require('../controllers/financialStatementController');
const authMiddleware = require('../middleware/authMiddleware');
const { financialStatementValidation, idParamValidation } = require('../middleware/validators');
const upload = require('../middleware/uploadFinancialStatement');

// ✅ ADD THIS
const { checkPermission } = require('../middleware/permissionMiddleware');


// ================= PROTECTED ROUTES =================

// Get all financial statements (VIEW)
router.get(
  '/',
  authMiddleware,
  checkPermission('financial_statements', 'view'),
  financialStatementController.getAllFinancialStatements
);


// ================= ADMIN ROUTES =================

// Create financial statement
router.post(
  '/',
  authMiddleware,
  checkPermission('financial_statements', 'create'),
  upload.single('pdf'),
  financialStatementValidation,
  financialStatementController.createFinancialStatement
);


// Update financial statement
router.put(
  '/:id',
  authMiddleware,
  checkPermission('financial_statements', 'update'),
  upload.single('pdf'),
  idParamValidation,
  financialStatementController.updateFinancialStatement
);


// Delete financial statement
router.delete(
  '/:id',
  authMiddleware,
  checkPermission('financial_statements', 'delete'),
  idParamValidation,
  financialStatementController.deleteFinancialStatement
);


module.exports = router;