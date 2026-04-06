const express = require('express');
const router = express.Router();

const sebiController = require('../controllers/sebiController');
const authMiddleware = require('../middleware/auth');
const { sebiValidation, idParamValidation } = require('../middleware/validators');
const upload = require('../middleware/uploadSEBI');


// PUBLIC ROUTE
router.get('/', sebiController.getAllSEBI);


// ADMIN ROUTES

// Create SEBI
router.post(
  '/',
  authMiddleware,
  upload.single('pdf'),
  sebiValidation,
  sebiController.createSEBI
);


// Update SEBI
router.put(
  '/:id',
  authMiddleware,
  upload.single('pdf'),
  idParamValidation,
  sebiController.updateSEBI
);


// Delete SEBI
router.delete(
  '/:id',
  authMiddleware,
  idParamValidation,
  sebiController.deleteSEBI
);


module.exports = router;