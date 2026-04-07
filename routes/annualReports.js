const express = require('express');
const router = express.Router();

const annualReportController = require('../controllers/annualReportController');
const authMiddleware = require('../middleware/authMiddleware');
const { annualReportValidation, idParamValidation } = require('../middleware/validators');
const upload = require('../middleware/uploadAnnualReport');


// PUBLIC ROUTE
router.get('/', annualReportController.getAllAnnualReports);


// ADMIN ROUTES

// Create annual report
router.post(
  '/',
  authMiddleware,
  upload.single('pdf'),
  annualReportValidation,
  annualReportController.createAnnualReport
);


// Update annual report
router.put(
  '/:id',
  authMiddleware,
  upload.single('pdf'),
  idParamValidation,
  annualReportController.updateAnnualReport
);


// Delete annual report
router.delete(
  '/:id',
  authMiddleware,
  idParamValidation,
  annualReportController.deleteAnnualReport
);


module.exports = router;