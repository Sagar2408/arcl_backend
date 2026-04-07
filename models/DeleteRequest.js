const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DeleteRequest = sequelize.define('DeleteRequest', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  requested_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },

  section: {
    type: DataTypes.STRING(50),
    allowNull: false
  },

  record_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },

  record_title: {
    type: DataTypes.STRING(500),
    allowNull: true
  },

  reason: {
    type: DataTypes.TEXT,
    allowNull: false
  },

  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending'
  },

  reviewed_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },

  reviewed_at: {
    type: DataTypes.DATE,
    allowNull: true
  },

  review_note: {
    type: DataTypes.TEXT,
    allowNull: true
  }

}, {
  tableName: 'delete_requests',

  timestamps: true,

  createdAt: 'requested_at',
  updatedAt: 'updated_at',

  indexes: [
    {
      fields: ['requested_by']
    },
    {
      fields: ['status']
    },
    {
      fields: ['section', 'record_id']
    }
  ]
});

module.exports = DeleteRequest;