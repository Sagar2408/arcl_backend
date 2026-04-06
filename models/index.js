const { sequelize } = require('../config/database');

const Admin = require('./Admin');
const Circular = require('./Circular');
const MasterCircular = require('./MasterCircular');   
const DailyStat = require('./DailyStat');
const MonthlyStat = require('./MonthlyStat');
const Newsletter = require('./newsletter');
const Announcement = require('./Announcement');
const InvestorComplaint = require('./InvestorComplaint');
const ShareholdingPattern = require('./ShareholdingPattern');
const Financial = require('./Financial');
const PressRelease = require('./PressRelease');
const ShareholdersMeeting = require('./ShareholdersMeeting');

const db = {
  sequelize,
  Sequelize: require('sequelize'),
  Admin,
  Circular,
  MasterCircular,   
  DailyStat,
  MonthlyStat,
  Newsletter,
  Announcement,
  InvestorComplaint,
  ShareholdingPattern,
  Financial,
  PressRelease,
  ShareholdersMeeting
};

module.exports = db;