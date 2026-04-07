const express = require('express');
const router = express.Router();

const newspaperPublicationController = require('../controllers/newspaperPublicationController');
const authMiddleware = require('../middleware/authMiddleware');
const { newspaperPublicationValidation, idParamValidation } = require('../middleware/validators');
const upload = require('../middleware/uploadNewspaperPublication');

// ✅ ADD THIS
const { checkPermission } = require('../middleware/permissionMiddleware');


// ================= PROTECTED ROUTES =================

// Get all newspaper publications (VIEW)
router.get(
  '/',
  authMiddleware,
  checkPermission('newspaper_publications', 'view'),
  newspaperPublicationController.getAllNewspaperPublications
);


// ================= ADMIN ROUTES =================

// Create newspaper publication
router.post(
  '/',
  authMiddleware,
  checkPermission('newspaper_publications', 'create'),
  upload.single('pdf'),
  newspaperPublicationValidation,
  newspaperPublicationController.createNewspaperPublication
);


// Update newspaper publication
router.put(
  '/:id',
  authMiddleware,
  checkPermission('newspaper_publications', 'update'),
  upload.single('pdf'),
  idParamValidation,
  newspaperPublicationController.updateNewspaperPublication
);


// Delete newspaper publication
router.delete(
  '/:id',
  authMiddleware,
  checkPermission('newspaper_publications', 'delete'),
  idParamValidation,
  newspaperPublicationController.deleteNewspaperPublication
);


module.exports = router;