const express = require('express');
const router = express.Router();

const investorComplaintController = require('../controllers/investorComplaintController');
const authMiddleware = require('../middleware/auth');
const { investorComplaintValidation, idParamValidation } = require('../middleware/validators');
const upload = require('../middleware/uploadInvestorComplaint');


// PUBLIC ROUTE
router.get('/', investorComplaintController.getAllInvestorComplaints);


// ADMIN ROUTES

// Create investor complaint
router.post(
  '/',
  authMiddleware,
  upload.single('pdf'),
  investorComplaintValidation,
  investorComplaintController.createInvestorComplaint
);


// Update investor complaint
router.put(
  '/:id',
  authMiddleware,
  upload.single('pdf'),
  idParamValidation,
  investorComplaintController.updateInvestorComplaint
);


// Delete investor complaint
router.delete(
  '/:id',
  authMiddleware,
  idParamValidation,
  investorComplaintController.deleteInvestorComplaint
);


module.exports = router;