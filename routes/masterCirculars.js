const express = require('express');
const router = express.Router();

const masterCircularController = require('../controllers/masterCircularController');

const authMiddleware = require('../middleware/auth');

const { circularValidation, idParamValidation } = require('../middleware/validators');

const upload = require('../middleware/uploadMasterCircular');


// PUBLIC ROUTE
router.get('/', masterCircularController.getAllMasterCirculars);


// ADMIN ROUTES

// Create master circular
router.post(
  '/',
  authMiddleware,
  upload.single('pdf'),
  circularValidation,
  masterCircularController.createMasterCircular
);


// Update master circular
router.put(
  '/:id',
  authMiddleware,
  upload.single('pdf'),
  idParamValidation,
  masterCircularController.updateMasterCircular
);


// Delete master circular
router.delete(
  '/:id',
  authMiddleware,
  idParamValidation,
  masterCircularController.deleteMasterCircular
);


module.exports = router;