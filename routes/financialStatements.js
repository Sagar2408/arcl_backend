const express = require('express');
const router = express.Router();

const financialStatementController = require('../controllers/financialStatementController');
const authMiddleware = require('../middleware/auth');
const { financialStatementValidation, idParamValidation } = require('../middleware/validators');
const upload = require('../middleware/uploadFinancialStatement');


// PUBLIC ROUTE
router.get('/', financialStatementController.getAllFinancialStatements);


// ADMIN ROUTES

// Create financial statement
router.post(
  '/',
  authMiddleware,
  upload.single('pdf'),
  financialStatementValidation,
  financialStatementController.createFinancialStatement
);


// Update financial statement
router.put(
  '/:id',
  authMiddleware,
  upload.single('pdf'),
  idParamValidation,
  financialStatementController.updateFinancialStatement
);


// Delete financial statement
router.delete(
  '/:id',
  authMiddleware,
  idParamValidation,
  financialStatementController.deleteFinancialStatement
);


module.exports = router;