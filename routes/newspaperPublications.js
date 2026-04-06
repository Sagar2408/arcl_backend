const express = require('express');
const router = express.Router();

const newspaperPublicationController = require('../controllers/newspaperPublicationController');
const authMiddleware = require('../middleware/auth');
const { newspaperPublicationValidation, idParamValidation } = require('../middleware/validators');
const upload = require('../middleware/uploadNewspaperPublication');


// PUBLIC ROUTE
router.get('/', newspaperPublicationController.getAllNewspaperPublications);


// ADMIN ROUTES

// Create newspaper publication
router.post(
  '/',
  authMiddleware,
  upload.single('pdf'),
  newspaperPublicationValidation,
  newspaperPublicationController.createNewspaperPublication
);


// Update newspaper publication
router.put(
  '/:id',
  authMiddleware,
  upload.single('pdf'),
  idParamValidation,
  newspaperPublicationController.updateNewspaperPublication
);


// Delete newspaper publication
router.delete(
  '/:id',
  authMiddleware,
  idParamValidation,
  newspaperPublicationController.deleteNewspaperPublication
);


module.exports = router;