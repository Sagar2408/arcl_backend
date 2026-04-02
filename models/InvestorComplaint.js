const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const InvestorComplaint = sequelize.define('InvestorComplaint', {
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
      },
      len: {
        args: [1, 500],
        msg: 'Title must be between 1 and 500 characters'
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
  },

  category: {
    type: DataTypes.STRING,
    allowNull: false
  }

}, {
  tableName: 'investor_complaints',

  timestamps: true,

  createdAt: 'created_at',

  updatedAt: false,

  indexes: [
    {
      fields: ['date']
    },
    {
      fields: ['created_at']
    }
  ]
});

module.exports = InvestorComplaint;
