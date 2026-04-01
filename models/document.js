const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Document = sequelize.define('Document', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  title: {
    type: DataTypes.STRING(500),
    allowNull: false
  },

  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },

  pdf_url: {
    type: DataTypes.STRING(500),
    allowNull: false
  },

  category: {
    type: DataTypes.STRING(100), // 🔥 IMPORTANT
    allowNull: false
  }

}, {
  tableName: 'documents',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = Document;