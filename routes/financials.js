const express = require('express');
const router = express.Router();

const financialController = require('../controllers/financialController');
const authMiddleware = require('../middleware/auth');
const { financialValidation, idParamValidation } = require('../middleware/validators');
const upload = require('../middleware/uploadFinancial');


// PUBLIC ROUTE
router.get('/', financialController.getAllFinancials);


// ADMIN ROUTES

// Create financial record
router.post(
  '/',
  authMiddleware,
  upload.single('pdf'),
  financialValidation,
  financialController.createFinancial
);


// Update financial record
router.put(
  '/:id',
  authMiddleware,
  upload.single('pdf'),
  idParamValidation,
  financialController.updateFinancial
);


// Delete financial record
router.delete(
  '/:id',
  authMiddleware,
  idParamValidation,
  financialController.deleteFinancial
);


module.exports = router;
