const { User, Permission, sequelize } = require('../models');
const { Op } = require('sequelize');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const transporter = require('../config/mail');
const logAudit = require('../utils/auditLogger');
const {
  createDescription,
  updateDescription,
  permissionDescription
} = require('../utils/auditDescriptions');

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

const toPlainPermission = (permission = {}) => {
  const source = permission?.dataValues || permission;

  return {
    section: source.section,
    can_view: Boolean(source.can_view),
    can_create: Boolean(source.can_create),
    can_update: Boolean(source.can_update),
    can_delete: Boolean(source.can_delete)
  };
};

const normalizePermissions = (permissions = []) => {
  return permissions
    .map((permission) => toPlainPermission(permission))
    .filter((permission) => permission.section)
    .sort((a, b) => a.section.localeCompare(b.section));
};

const buildPermissionData = (permissions = [], userId) => {
  return permissions.map((permission) => ({
    user_id: userId,
    section: permission.section,
    can_view: permission.can_view ?? true,
    can_create: permission.can_create ?? false,
    can_update: permission.can_update ?? false,
    can_delete: permission.can_delete ?? false
  }));
};

const getStoredPermissions = async (userId, transaction) => {
  const permissions = await Permission.findAll({
    where: { user_id: userId },
    order: [['section', 'ASC']],
    transaction
  });

  return normalizePermissions(permissions.map((permission) => permission.dataValues));
};

const buildUserSnapshot = (user, permissions = []) => {
  const source = user?.dataValues || user || {};

  return {
    username: source.username,
    email: source.email,
    role: source.role,
    is_active: source.is_active,
    permissions: normalizePermissions(permissions)
  };
};

const buildUserDescriptionData = (snapshot = {}) => {
  return {
    username: snapshot.username,
    email: snapshot.email,
    status: snapshot.is_active ? 'Active' : 'Inactive'
  };
};

const combineDescriptions = (...parts) => {
  return parts
    .filter((part) => typeof part === 'string' && part.trim())
    .join(' | ');
};

const formatPermissionsForResponse = (role, permissionRows = []) => {
  const permissions = {};

  if (role === 'super_admin') {
    ALL_SECTIONS.forEach((section) => {
      permissions[section] = {
        can_view: true,
        can_create: true,
        can_update: true,
        can_delete: true
      };
    });

    return permissions;
  }

  permissionRows.forEach((permission) => {
    const source = permission?.dataValues || permission;

    permissions[source.section] = {
      can_view: source.can_view,
      can_create: source.can_create,
      can_update: source.can_update,
      can_delete: source.can_delete
    };
  });

  return permissions;
};

// LOGIN
exports.login = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { email, password } = req.body;

    // 1. Validate input
    if (!email || !password) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // 2. Find user (❗ removed is_active filter)
    const user = await User.findOne({
      where: { email },
      include: [{ model: Permission, as: 'permissions' }]
    });

    // 3. Check user exists
    if (!user) {
      await transaction.rollback();
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // 4. Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await transaction.rollback();
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // 5. ❗ CHECK ACTIVE STATUS (MAIN FIX)
    if (!user.is_active) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated by admin'
      });
    }

    // 6. Store previous login
    const previousLastLogin = user.last_login;

    // 7. Update last login
    await user.update(
      { last_login: new Date() },
      { transaction }
    );

    // 8. Audit log
    await logAudit({
      req,
      userId: user.id,
      action: 'LOGIN',
      module: 'users',
      recordId: user.id,
      oldData: previousLastLogin
        ? { last_login: previousLastLogin }
        : null,
      newData: {
        username: user.username,
        email: user.email,
        role: user.role,
        is_active: user.is_active,
        last_login: new Date()
      },
      description: `User ${user.username} logged in`,
      transaction
    });

    // 9. Commit transaction
    await transaction.commit();

    // 10. Generate token & permissions
    const token = generateToken(user);
    const permissions = formatPermissionsForResponse(
      user.role,
      user.permissions
    );

    // 11. Send response
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

    const existingUser = await User.findOne({ where: { email }, transaction });
    if (existingUser) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    const existingEmail = await User.findOne({ where: { email }, transaction });
    if (existingEmail) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    const user = await User.create({
      username,
      email,
      password,
      role
    }, { transaction });

    if (role === 'executive' && permissions && permissions.length > 0) {
      const permissionData = buildPermissionData(permissions, user.id);
      await Permission.bulkCreate(permissionData, { transaction });
    }

    const newPermissions = await getStoredPermissions(user.id, transaction);
    const newSnapshot = buildUserSnapshot(user, newPermissions);

    await logAudit({
      req,
      action: 'CREATE',
      module: 'users',
      recordId: user.id,
      oldData: null,
      newData: newSnapshot,
      description: createDescription('users', newSnapshot),
      transaction
    });

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
      where: { id: { [Op.ne]: req.user.id } },
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

    const oldPermissions = normalizePermissions(
      (user.permissions || []).map((permission) => permission.dataValues)
    );
    const oldSnapshot = buildUserSnapshot(user, oldPermissions);

    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (password) updateData.password = password;
    if (typeof is_active === 'boolean') updateData.is_active = is_active;

    await user.update(updateData, { transaction });

    let newPermissions = oldPermissions;

    if (user.role === 'executive' && permissions) {
      await Permission.destroy({
        where: { user_id: user.id },
        transaction
      });

      const permissionData = buildPermissionData(permissions, user.id);
      if (permissionData.length > 0) {
        await Permission.bulkCreate(permissionData, { transaction });
      }

      newPermissions = await getStoredPermissions(user.id, transaction);
    }

    const newSnapshot = buildUserSnapshot(user, newPermissions);
    const userDescription = updateDescription(
      'user',
      buildUserDescriptionData(oldSnapshot),
      buildUserDescriptionData(newSnapshot),
      {
        fields: ['username', 'email', 'status'],
        labels: {
          username: 'username',
          email: 'email',
          status: 'status'
        },
        prefix: 'Updated user',
        fallback: null
      }
    );
    const permissionsText = permissionDescription(oldPermissions, newPermissions, newSnapshot.username);
    const description = combineDescriptions(userDescription, permissionsText)
      || `Updated user "${newSnapshot.username || oldSnapshot.username || 'user'}"`;

    await logAudit({
      req,
      action: 'UPDATE',
      module: 'users',
      recordId: user.id,
      oldData: oldSnapshot,
      newData: newSnapshot,
      description,
      transaction
    });

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

    if (parseInt(id, 10) === req.user.id) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    const oldSnapshot = buildUserSnapshot(
      user.dataValues,
      (user.permissions || []).map((permission) => permission.dataValues)
    );

    await user.destroy({ transaction });

    await logAudit({
      req,
      action: 'DELETE_APPROVE',
      module: 'users',
      recordId: user.id,
      oldData: oldSnapshot,
      newData: null,
      description: `Deleted user ${oldSnapshot.username || 'user'}`,
      transaction
    });

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

    const permissions = formatPermissionsForResponse(user.role, user.permissions);

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

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const token = crypto.randomBytes(32).toString('hex');

    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    user.reset_password_token = hashedToken;
    user.reset_password_expiry = Date.now() + 10 * 60 * 1000;

    await user.save();

    const resetLink = `http://localhost:3000/reset-password/${token}`;

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

    await logAudit({
      req,
      userId: user.id,
      action: 'RESET_PASSWORD',
      module: 'users',
      recordId: user.id,
      oldData: null,
      newData: {
        username: user.username,
        email: user.email,
        reset_password_requested: true
      },
      description: `Password reset requested for user ${user.username}`
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

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required'
      });
    }

    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

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

    user.password = newPassword;
    user.reset_password_token = null;
    user.reset_password_expiry = null;

    await user.save();

    await logAudit({
      req,
      userId: user.id,
      action: 'RESET_PASSWORD',
      module: 'users',
      recordId: user.id,
      oldData: {
        username: user.username,
        email: user.email,
        reset_password_requested: true
      },
      newData: {
        username: user.username,
        email: user.email,
        reset_password_requested: false
      },
      description: `Password reset completed for user ${user.username}`
    });

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