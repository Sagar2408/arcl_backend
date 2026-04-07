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
      'CREATE',
      'UPDATE',
      'DELETE_REQUEST',
      'DELETE_APPROVE',
      'DELETE_REJECT',
      'VIEW',
      'PERMISSION_GRANT',
      'PERMISSION_REVOKE'
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

  old_data: {
    type: DataTypes.JSON,
    allowNull: true
  },

  new_data: {
    type: DataTypes.JSON,
    allowNull: true
  },

  reason: {
    type: DataTypes.TEXT,
    allowNull: true
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