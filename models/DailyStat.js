const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DailyStat = sequelize.define('DailyStat', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  trade_date: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: {
      args: true,
      msg: 'Statistics for this trade date already exist'
    },
    validate: {
      notEmpty: {
        msg: 'Trade date is required'
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
  },
  fund_settlement_value: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.00,
    validate: {
      isDecimal: {
        msg: 'Fund settlement value must be a valid decimal number'
      },
      min: {
        args: [0],
        msg: 'Fund settlement value cannot be negative'
      }
    }
  }
}, {
  tableName: 'daily_stats',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['trade_date'],
      unique: true
    }
  ]
});

module.exports = DailyStat;