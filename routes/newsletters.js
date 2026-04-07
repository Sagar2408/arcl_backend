const express = require("express");
const router = express.Router();

const {
  createNewsletter,
  getAllNewsletters,
  updateNewsletter,
  deleteNewsletter,
} = require("../controllers/newsletterController");

// ✅ Middlewares
const authMiddleware = require("../middleware/authMiddleware");
const { checkPermission } = require("../middleware/permissionMiddleware");
const upload = require("../middleware/uploadNewsletter");


// ================= PROTECTED ROUTES =================

// 📥 Get All Newsletters (VIEW)
router.get(
  "/",
  authMiddleware,
  checkPermission("newsletter", "view"),
  getAllNewsletters
);


// ➕ Create Newsletter
router.post(
  "/",
  authMiddleware,
  checkPermission("newsletter", "create"),
  upload.single("pdf"),
  createNewsletter
);


// ✏️ Update Newsletter
router.put(
  "/:id",
  authMiddleware,
  checkPermission("newsletter", "update"),
  upload.single("pdf"),
  updateNewsletter
);


// ❌ Delete Newsletter
router.delete(
  "/:id",
  authMiddleware,
  checkPermission("newsletter", "delete"),
  deleteNewsletter
);


module.exports = router;