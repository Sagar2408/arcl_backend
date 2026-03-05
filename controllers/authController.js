const jwt = require('jsonwebtoken');
const { Admin } = require('../models');

const generateToken = (admin) => {
  return jwt.sign(
    { id: admin.id, username: admin.username },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const admin = await Admin.findByCredentials(username, password);
    const token = generateToken(admin);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        admin: {
          id: admin.id,
          username: admin.username
        },
        token
      }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message || 'Invalid credentials'
    });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const admin = await Admin.findByPk(req.admin.id, {
      attributes: ['id', 'username', 'created_at']
    });
    
    res.json({
      success: true,
      data: admin
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching profile',
      error: error.message
    });
  }
};

// Utility function to create initial admin (for setup)
exports.createInitialAdmin = async (username, password) => {
  try {
    const existingAdmin = await Admin.findOne({ where: { username } });
    if (existingAdmin) {
      console.log('Admin already exists');
      return;
    }
    
    await Admin.create({ username, password });
    console.log(`✅ Initial admin "${username}" created successfully`);
  } catch (error) {
    console.error('❌ Error creating initial admin:', error.message);
  }
};