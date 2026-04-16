const { sequelize } = require('../config/database');

const Circular = require('./Circular');
const MasterCircular = require('./MasterCircular');
const DailyStat = require('./DailyStat');
const MonthlyStat = require('./MonthlyStat');
const Newsletter = require('./newsletter');
const Announcement = require('./Announcement');
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
const User = require('./User');
const Permission = require('./Permission');
const AuditTrail = require('./AuditTrail');
const DeleteRequest = require('./DeleteRequest');
const Archive = require('./Archive');

// One User → Many Permissions
User.hasMany(Permission, {
  foreignKey: 'user_id',
  as: 'permissions'
});

// Each Permission belongs to one User
Permission.belongsTo(User, {
  foreignKey: 'user_id'
});

// (Optional but good practice)
// User → AuditTrail
User.hasMany(AuditTrail, {
  foreignKey: 'user_id'
});

AuditTrail.belongsTo(User, {
  foreignKey: 'user_id'
});

// User → DeleteRequest
User.hasMany(DeleteRequest, {
  foreignKey: 'requested_by'
});

// Requested by (Executive)
DeleteRequest.belongsTo(User, {
  foreignKey: 'requested_by',
  as: 'requester'
});

// Reviewed by (Admin)
DeleteRequest.belongsTo(User, {
  foreignKey: 'reviewed_by',
  as: 'reviewer'
});

// Reverse relation (optional but best)
User.hasMany(DeleteRequest, {
  foreignKey: 'requested_by',
  as: 'deleteRequests'
});

const db = {
  sequelize,
  Sequelize: require('sequelize'),
  User,
  Permission,
  AuditTrail,
  DeleteRequest,
  Circular,
  MasterCircular,
  DailyStat,
  MonthlyStat,
  Newsletter,
  Announcement,
  InvestorComplaint,
  PressRelease,
  ShareholdersMeeting,
  SEBI,
  RBI,
  FinancialResult,
  AnnualReport,
  AnnualReturn,
  NewspaperPublication,
  FinancialStatement,
  Archive
};

module.exports = db;