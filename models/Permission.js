const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Permission = sequelize.define('Permission', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },

  section: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Section is required'
      }
    }
  },

  can_view: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },

  can_create: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },

  can_update: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },

  can_delete: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }

}, {
  tableName: 'permissions',

  timestamps: true,

  createdAt: 'created_at',
  updatedAt: 'updated_at',

  indexes: [
    {
      unique: true,
      fields: ['user_id', 'section']
    }
  ]
});

module.exports = Permission;