const express = require('express');
const router = express.Router();

const investorComplaintController = require('../controllers/investorComplaintController');
const authMiddleware = require('../middleware/authMiddleware');
const { investorComplaintValidation, idParamValidation } = require('../middleware/validators');
const upload = require('../middleware/uploadInvestorComplaint');

// ✅ ADD THIS
const { checkPermission } = require('../middleware/permissionMiddleware');


// ================= PROTECTED ROUTES =================

// Get all investor complaints (VIEW)
router.get(
  '/',
  authMiddleware,
  checkPermission('investor_complaints', 'view'),
  investorComplaintController.getAllInvestorComplaints
);


// ================= ADMIN ROUTES =================

// Create investor complaint
router.post(
  '/',
  authMiddleware,
  checkPermission('investor_complaints', 'create'),
  upload.single('pdf'),
  investorComplaintValidation,
  investorComplaintController.createInvestorComplaint
);


// Update investor complaint
router.put(
  '/:id',
  authMiddleware,
  checkPermission('investor_complaints', 'update'),
  upload.single('pdf'),
  idParamValidation,
  investorComplaintController.updateInvestorComplaint
);


// Delete investor complaint
router.delete(
  '/:id',
  authMiddleware,
  checkPermission('investor_complaints', 'delete'),
  idParamValidation,
  investorComplaintController.deleteInvestorComplaint
);


module.exports = router;