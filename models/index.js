const { sequelize } = require('../config/database');
const Admin = require('./Admin');
const Circular = require('./Circular');
const DailyStat = require('./DailyStat');
const MonthlyStat = require('./MonthlyStat');

// Define associations (if any in future)
// Currently no associations needed for this schema

const db = {
  sequelize,
  Sequelize: require('sequelize'),
  Admin,
  Circular,
  DailyStat,
  MonthlyStat
};

module.exports = db;