const express = require("express");
const router = express.Router();

const {
  createNewsletter,
  getAllNewsletters,
  updateNewsletter,
  deleteNewsletter,
} = require("../controllers/newsletterController");

// ✅ Use separate upload middleware
const upload = require("../middleware/uploadNewsletter");

// ================= ROUTES =================

// ➕ Create Newsletter
router.post("/", upload.single("pdf"), createNewsletter);

// 📥 Get All Newsletters
router.get("/", getAllNewsletters);

// ✏️ Update Newsletter
router.put("/:id", upload.single("pdf"), updateNewsletter);

// ❌ Delete Newsletter
router.delete("/:id", deleteNewsletter);

module.exports = router;