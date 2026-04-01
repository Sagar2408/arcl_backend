const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Newsletter = sequelize.define('Newsletter', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  title: {
    type: DataTypes.STRING(500),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Title is required'
      }
    }
  },

  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Date is required'
      }
    }
  },

  pdf_url: {
    type: DataTypes.STRING(500),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'PDF file is required'
      }
    }
  }

}, {
  tableName: 'newsletters',

  timestamps: true,

  createdAt: 'created_at',

  updatedAt: false
});

module.exports = Newsletter;