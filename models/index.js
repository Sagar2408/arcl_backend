const { sequelize } = require('../config/database');

const Admin = require('./Admin');
const Circular = require('./Circular');
const MasterCircular = require('./MasterCircular');
const DailyStat = require('./DailyStat');
const MonthlyStat = require('./MonthlyStat');
const Newsletter = require('./newsletter');
const Announcement = require('./Announcement');
const ShareholdingPattern = require('./ShareholdingPattern');
const ShareholdersMeeting = require('./ShareholdersMeeting');
const PressRelease = require('./PressRelease');
const InvestorComplaint = require('./InvestorComplaint');
const SEBI = require('./SEBI');
const RBI = require('./RBI');
const FinancialResult = require('./FinancialResults');
const AnnualReport = require('./AnnualReport');
const AnnualReturn = require('./AnnualReturn');
const NewspaperPublication = require('./NewspaperPublication');
const FinancialStatement = require('./FinancialStatement');



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
  PressRelease,
  ShareholdersMeeting,
  SEBI,
  RBI,
  FinancialResult,
  AnnualReport,
  AnnualReturn,
  NewspaperPublication,
  FinancialStatement
};

module.exports = db;