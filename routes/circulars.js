const express = require('express');
const router = express.Router();

const circularController = require('../controllers/circularController');
const authMiddleware = require('../middleware/authMiddleware');
const { circularValidation, idParamValidation } = require('../middleware/validators');
const upload = require('../middleware/uploadCircular');


// PUBLIC ROUTE
router.get('/', circularController.getAllCirculars);


// ADMIN ROUTES

// Create circular
router.post(
  '/',
  authMiddleware,
  upload.single('pdf'),
  circularValidation,
  circularController.createCircular
);


// Update circular
router.put(
  '/:id',
  authMiddleware,
  upload.single('pdf'),
  idParamValidation,
  circularController.updateCircular
);


// Delete circular
router.delete(
  '/:id',
  authMiddleware,
  idParamValidation,
  circularController.deleteCircular
);


module.exports = router;