const express = require('express');
const router = express.Router();

const financialResultController = require('../controllers/financialResultController');
const authMiddleware = require('../middleware/auth');
const { financialResultValidation, idParamValidation } = require('../middleware/validators');
const upload = require('../middleware/uploadFinancialResult');


// PUBLIC ROUTE
router.get('/', financialResultController.getAllFinancialResults);


// ADMIN ROUTES

// Create financial result
router.post(
  '/',
  authMiddleware,
  upload.single('pdf'),
  financialResultValidation,
  financialResultController.createFinancialResult
);


// Update financial result
router.put(
  '/:id',
  authMiddleware,
  upload.single('pdf'),
  idParamValidation,
  financialResultController.updateFinancialResult
);


// Delete financial result
router.delete(
  '/:id',
  authMiddleware,
  idParamValidation,
  financialResultController.deleteFinancialResult
);


module.exports = router;