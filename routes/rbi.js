const express = require('express');
const router = express.Router();

const rbiController = require('../controllers/rbiController');
const authMiddleware = require('../middleware/auth');
const { rbiValidation, idParamValidation } = require('../middleware/validators');
const upload = require('../middleware/uploadRBI');


// PUBLIC ROUTE
router.get('/', rbiController.getAllRBI);


// ADMIN ROUTES

// Create RBI
router.post(
  '/',
  authMiddleware,
  upload.single('pdf'),
  rbiValidation,
  rbiController.createRBI
);


// Update RBI
router.put(
  '/:id',
  authMiddleware,
  upload.single('pdf'),
  idParamValidation,
  rbiController.updateRBI
);


// Delete RBI
router.delete(
  '/:id',
  authMiddleware,
  idParamValidation,
  rbiController.deleteRBI
);


module.exports = router;