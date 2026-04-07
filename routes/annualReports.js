const express = require('express');
const router = express.Router();

const annualReportController = require('../controllers/annualReportController');
const authMiddleware = require('../middleware/authMiddleware');
const { annualReportValidation, idParamValidation } = require('../middleware/validators');
const upload = require('../middleware/uploadAnnualReport');

// ✅ ADD THIS
const { checkPermission } = require('../middleware/permissionMiddleware');


// ================= PROTECTED ROUTES =================

// Get all annual reports (VIEW)
router.get(
  '/',
  authMiddleware,
  checkPermission('annual_reports', 'view'),
  annualReportController.getAllAnnualReports
);


// ================= ADMIN ROUTES =================

// Create annual report
router.post(
  '/',
  authMiddleware,
  checkPermission('annual_reports', 'create'),
  upload.single('pdf'),
  annualReportValidation,
  annualReportController.createAnnualReport
);


// Update annual report
router.put(
  '/:id',
  authMiddleware,
  checkPermission('annual_reports', 'update'),
  upload.single('pdf'),
  idParamValidation,
  annualReportController.updateAnnualReport
);


// Delete annual report
router.delete(
  '/:id',
  authMiddleware,
  checkPermission('annual_reports', 'delete'),
  idParamValidation,
  annualReportController.deleteAnnualReport
);


module.exports = router;