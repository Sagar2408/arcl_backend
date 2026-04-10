const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const { superAdminOnly } = require('../middleware/permissionMiddleware');


// ================= PUBLIC ROUTES =================

// Login
router.post('/login', userController.login);


// ================= AUTHENTICATED USER =================

// Get current user's permissions (used in frontend RBAC)
router.get('/my-permissions', authMiddleware, userController.getMyPermissions);


// ================= SUPER ADMIN ONLY =================

// Create user
router.post('/', authMiddleware, superAdminOnly, userController.createUser);

// Get all users
router.get('/', authMiddleware, superAdminOnly, userController.getAllUsers);

// Get user by ID
router.get('/:id', authMiddleware, superAdminOnly, userController.getUserById);

// Update user
router.put('/:id', authMiddleware, superAdminOnly, userController.updateUser);

// Delete user
router.delete('/:id', authMiddleware, superAdminOnly, userController.deleteUser);

router.post('/forgot-password', userController.forgotPassword);
router.post('/reset-password/:token', userController.resetPassword);


module.exports = router;