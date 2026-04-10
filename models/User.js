const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: {
      msg: 'Username already exists'
    },
    validate: {
      notEmpty: {
        msg: 'Username is required'
      },
      len: {
        args: [3, 50],
        msg: 'Username must be between 3 and 50 characters'
      }
    }
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: {
      msg: 'Email already exists'
    },
    validate: {
      isEmail: {
        msg: 'Please enter a valid email'
      },
      notEmpty: {
        msg: 'Email is required'
      }
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Password is required'
      },
      len: {
        args: [6, 255],
        msg: 'Password must be at least 6 characters'
      }
    }
  },

  role: {
    type: DataTypes.ENUM('super_admin', 'executive'),
    allowNull: false,
    defaultValue: 'executive'
  },

  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },

  last_login: {
    type: DataTypes.DATE,
    allowNull: true
  },
  reset_password_token: {
    type: DataTypes.STRING,
    allowNull: true
  },

  reset_password_expiry: {
    type: DataTypes.DATE,
    allowNull: true
  }

}, {
  tableName: 'users',

  timestamps: true,

  createdAt: 'created_at',
  updatedAt: 'updated_at',

  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

// Instance method to check password
User.prototype.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = User;