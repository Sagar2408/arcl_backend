const express = require('express');
const router = express.Router();

const annualReturnController = require('../controllers/annualReturnController');
const authMiddleware = require('../middleware/auth');
const { annualReturnValidation, idParamValidation } = require('../middleware/validators');
const upload = require('../middleware/uploadAnnualReturn');


// PUBLIC ROUTE
router.get('/', annualReturnController.getAllAnnualReturns);


// ADMIN ROUTES

// Create annual return
router.post(
  '/',
  authMiddleware,
  upload.single('pdf'),
  annualReturnValidation,
  annualReturnController.createAnnualReturn
);


// Update annual return
router.put(
  '/:id',
  authMiddleware,
  upload.single('pdf'),
  idParamValidation,
  annualReturnController.updateAnnualReturn
);


// Delete annual return
router.delete(
  '/:id',
  authMiddleware,
  idParamValidation,
  annualReturnController.deleteAnnualReturn
);


module.exports = router;