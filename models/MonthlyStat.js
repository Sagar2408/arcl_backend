const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const MonthlyStat = sequelize.define('MonthlyStat', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  month: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: {
      args: true,
      msg: 'Statistics for this month already exist'
    },
    validate: {
      notEmpty: {
        msg: 'Month is required'
      }
    }
  },
  no_of_trades: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      isInt: {
        msg: 'Number of trades must be an integer'
      },
      min: {
        args: [0],
        msg: 'Number of trades cannot be negative'
      }
    }
  },
  trade_value: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.00,
    validate: {
      isDecimal: {
        msg: 'Trade value must be a valid decimal number'
      },
      min: {
        args: [0],
        msg: 'Trade value cannot be negative'
      }
    }
  }
}, {
  tableName: 'monthly_stats',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['month'],
      unique: true
    }
  ]
});

module.exports = MonthlyStat;