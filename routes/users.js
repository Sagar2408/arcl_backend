const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const { superAdminOnly } = require('../middleware/permissionMiddleware');

// Public routes
router.post('/login', userController.login);

// 🔥 ADD THIS LINE (IMPORTANT)
router.get("/my-permissions", authMiddleware, userController.getMyPermissions);
// Protected routes - Super Admin only
router.post('/', authMiddleware, superAdminOnly, userController.createUser);
router.get('/', authMiddleware, superAdminOnly, userController.getAllUsers);
router.get('/permissions/me', authMiddleware, userController.getMyPermissions);
router.get('/:id', authMiddleware, superAdminOnly, userController.getUserById);
router.put('/:id', authMiddleware, superAdminOnly, userController.updateUser);
router.delete('/:id', authMiddleware, superAdminOnly, userController.deleteUser);

module.exports = router;