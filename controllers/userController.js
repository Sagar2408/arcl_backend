const { User, Permission, AuditTrail, sequelize } = require('../models');
const { Op } = require('sequelize');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const transporter = require('../config/mail');

// All available sections in the system
const ALL_SECTIONS = [
  'circulars',
  'master_circulars',
  'daily_stats',
  'monthly_stats',
  'newsletter',
  'announcements',
  'shareholders_meetings',
  'press_releases',
  'investor_complaints',
  'sebi',
  'rbi',
  'financial_results',
  'annual_reports',
  'annual_returns',
  'financial_statements',
  'newspaper_publications',
];

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      username: user.username, 
      role: user.role 
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// LOGIN
exports.login = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const email = req.body.email;
    const password = req.body.password;

    // Guard: ensure email is present before querying
    if (!email || !password) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const user = await User.findOne({ 
      where: { email: email, is_active: true },
      include: [{ model: Permission, as: 'permissions' }]
    });

    if (!user) {
      await transaction.rollback();
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await transaction.rollback();
      
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    await user.update({ last_login: new Date() }, { transaction });

    // Log successful login
    await AuditTrail.create({
      user_id: user.id,
      action: 'LOGIN',
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    }, { transaction });

    await transaction.commit();

    const token = generateToken(user);

    // Format permissions for frontend
    const permissions = {};
    if (user.role === 'super_admin') {
      // Super admin has all permissions
      ALL_SECTIONS.forEach(section => {
        permissions[section] = {
          can_view: true,
          can_create: true,
          can_update: true,
          can_delete: true
        };
      });
    } else {
      // Executive gets assigned permissions
      user.permissions.forEach(perm => {
        permissions[perm.section] = {
          can_view: perm.can_view,
          can_create: perm.can_create,
          can_update: perm.can_update,
          can_delete: perm.can_delete
        };
      });
    }

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        permissions,
        token
      }
    });

  } catch (error) {
    await transaction.rollback();
    res.status(500).json({
      success: false,
      message: 'Error during login',
      error: error.message
    });
  }
};

// CREATE USER (Super Admin only)
exports.createUser = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { username, email, password, role, permissions } = req.body;

    // Check if user exists by email
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Check if email exists
    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password,
      role
    }, { transaction });

    // Create permissions for executive
    if (role === 'executive' && permissions && permissions.length > 0) {
      const permissionData = permissions.map(p => ({
        user_id: user.id,
        section: p.section,
        can_view: p.can_view ?? true,
        can_create: p.can_create ?? false,
        can_update: p.can_update ?? false,
        can_delete: p.can_delete ?? false
      }));

      await Permission.bulkCreate(permissionData, { transaction });
    }

    // Log action
    await AuditTrail.create({
      user_id: req.user.id,
      action: 'CREATE',
      section: 'users',
      record_id: user.id,
      new_data: { username, email, role },
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    }, { transaction });

    await transaction.commit();

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    await transaction.rollback();
    res.status(500).json({
      success: false,
      message: 'Error creating user',
      error: error.message
    });
  }
};

// GET ALL USERS (Super Admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      where: { id: { [Op.ne]: req.user.id } }, // Exclude current user
      include: [{ model: Permission, as: 'permissions' }],
      attributes: { exclude: ['password'] },
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: users
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
};

// GET USER BY ID
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      include: [{ model: Permission, as: 'permissions' }],
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
};

// UPDATE USER
exports.updateUser = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { username, email, password, is_active, permissions } = req.body;

    const user = await User.findByPk(id, {
      include: [{ model: Permission, as: 'permissions' }],
      transaction
    });

    if (!user) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const oldData = { 
      username: user.username, 
      email: user.email,
      is_active: user.is_active 
    };

    // Update user fields
    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (password) updateData.password = password;
    if (typeof is_active === 'boolean') updateData.is_active = is_active;

    await user.update(updateData, { transaction });

    // Update permissions if provided
    if (user.role === 'executive' && permissions) {
      // Delete existing permissions
      await Permission.destroy({
        where: { user_id: id },
        transaction
      });

      // Create new permissions
      const permissionData = permissions.map(p => ({
        user_id: id,
        section: p.section,
        can_view: p.can_view ?? true,
        can_create: p.can_create ?? false,
        can_update: p.can_update ?? false,
        can_delete: p.can_delete ?? false
      }));

      await Permission.bulkCreate(permissionData, { transaction });
    }

    // Log action
    await AuditTrail.create({
      user_id: req.user.id,
      action: 'UPDATE',
      section: 'users',
      record_id: id,
      old_data: oldData,
      new_data: updateData,
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: 'User updated successfully'
    });

  } catch (error) {
    await transaction.rollback();
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: error.message
    });
  }
};

// DELETE USER (Super Admin only)
exports.deleteUser = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deleting own account
    if (parseInt(id) === req.user.id) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    await user.destroy({ transaction });

    // Log action
    await AuditTrail.create({
      user_id: req.user.id,
      action: 'DELETE_APPROVE',
      section: 'users',
      record_id: id,
      old_data: { username: user.username, email: user.email, role: user.role },
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    await transaction.rollback();
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message
    });
  }
};

// GET MY PERMISSIONS (Current user)
exports.getMyPermissions = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [{ model: Permission, as: 'permissions' }]
    });

    const permissions = {};
    
    if (user.role === 'super_admin') {
      ALL_SECTIONS.forEach(section => {
        permissions[section] = {
          can_view: true,
          can_create: true,
          can_update: true,
          can_delete: true
        };
      });
    } else {
      user.permissions.forEach(perm => {
        permissions[perm.section] = {
          can_view: perm.can_view,
          can_create: perm.can_create,
          can_update: perm.can_update,
          can_delete: perm.can_delete
        };
      });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        permissions
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching permissions',
      error: error.message
    });
  }
};

// FORGOT PASSWORD
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email presence
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Find user by email
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate secure reset token
    const token = crypto.randomBytes(32).toString('hex');

    // Hash the token before saving
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Set token and expiry (10 minutes from now)
    user.reset_password_token = hashedToken;
    user.reset_password_expiry = Date.now() + 10 * 60 * 1000;

    await user.save();

    // Create reset link
    const resetLink = `http://localhost:3000/reset-password/${token}`;

    // Send reset email
    await transporter.sendMail({
      to: user.email,
      subject: 'Password Reset Request',
      html: `
        <h3>Password Reset Request</h3>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <a href="${resetLink}">Reset Password</a>
        <p>This link will expire in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `
    });

    res.json({
      success: true,
      message: 'Reset link sent to email'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error sending reset link',
      error: error.message
    });
  }
};

// RESET PASSWORD
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    // Validate inputs
    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required'
      });
    }

    // Hash incoming token to match with DB
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with valid token and expiry
    const user = await User.findOne({
      where: {
        reset_password_token: hashedToken,
        reset_password_expiry: {
          [Op.gt]: Date.now()
        }
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    // Update password (model hooks should handle hashing)
    user.password = newPassword;
    user.reset_password_token = null;
    user.reset_password_expiry = null;

    await user.save();

    res.json({
      success: true,
      message: 'Password reset successful'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error resetting password',
      error: error.message
    });
  }
};