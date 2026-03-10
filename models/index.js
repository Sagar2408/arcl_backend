const { sequelize } = require('../config/database');

const Admin = require('./Admin');
const Circular = require('./Circular');
const MasterCircular = require('./MasterCircular');   
const DailyStat = require('./DailyStat');
const MonthlyStat = require('./MonthlyStat');



const db = {
  sequelize,
  Sequelize: require('sequelize'),
  Admin,
  Circular,
  MasterCircular,   
  DailyStat,
  MonthlyStat
};

module.exports = db;