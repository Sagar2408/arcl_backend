const jwt = require('jsonwebtoken');
const { User, Permission } = require('../models');

const authMiddleware = async (req, res, next) => {
  try {
    // 1. Get token
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const token = authHeader.split(' ')[1];

    // 2. Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    // 3. Fetch user
    const user = await User.findByPk(decoded.id, {
      include: [{ model: Permission, as: 'permissions' }]
    });

    // 4. User not found
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // 5. ❗ Inactive user (MAIN FIX)
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated by admin'
      });
    }

    // 6. Attach user to request
    req.user = {
      id: user.id,
      username: user.username,
      role: user.role,
      permissions: user.permissions
    };

    next();

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Authentication error',
      error: error.message
    });
  }
};

module.exports = authMiddleware;