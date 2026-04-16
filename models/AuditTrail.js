const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AuditTrail = sequelize.define('AuditTrail', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'SET NULL'
  },

  action: {
    type: DataTypes.ENUM(
      'LOGIN',
      'LOGOUT',

      // CRUD
      'CREATE',
      'UPDATE',

      // Delete flows
      'DELETE_REQUEST',
      'DELETE_APPROVE',
      'DELETE_REJECT',
      'DIRECT_DELETE',   // 🔥 ADD THIS

      // Other
      'VIEW',
      'PERMISSION_UPDATE',
      'RESET_PASSWORD'
    ),
    allowNull: false
  },

  section: {
    type: DataTypes.STRING(50),
    allowNull: true
  },

  record_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },

  // 🔥 OLD DATA (before change)
  old_data: {
    type: DataTypes.JSON,
    allowNull: true
  },

  // 🔥 NEW DATA (after change)
  new_data: {
    type: DataTypes.JSON,
    allowNull: true
  },

  // 🔥 MAIN FIELD YOU NEED
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },

  // Optional (for delete request reason etc.)
  reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },

  // Optional (success / failed)
  status: {
    type: DataTypes.ENUM('SUCCESS', 'FAILED'),
    defaultValue: 'SUCCESS'
  },

  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: true
  },

  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true
  }

}, {
  tableName: 'audit_trails',

  timestamps: true,

  createdAt: 'created_at',
  updatedAt: false,

  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['action']
    },
    {
      fields: ['section']
    },
    {
      fields: ['created_at']
    }
  ]
});

module.exports = AuditTrail;