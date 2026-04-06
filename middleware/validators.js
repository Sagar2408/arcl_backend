const { body, param, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

const loginValidation = [
  body('username')
    .trim()
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters'),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  handleValidationErrors
];

const circularValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 500 }).withMessage('Title must not exceed 500 characters'),
  body('date')
    .trim()
    .notEmpty().withMessage('Date is required')
    .matches(/^\d{2}-[A-Za-z]{3}-\d{4}$/).withMessage('Date must be in format DD-MMM-YYYY (e.g., 04-Mar-2026)'),
  handleValidationErrors
];

const announcementValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 500 }).withMessage('Title must not exceed 500 characters'),
  body('date')
    .trim()
    .notEmpty().withMessage('Date is required')
    .matches(/^\d{2}-[A-Za-z]{3}-\d{4}$/).withMessage('Date must be in format DD-MMM-YYYY (e.g., 04-Mar-2026)'),
  handleValidationErrors
];

const investorComplaintValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 500 }).withMessage('Title must not exceed 500 characters'),
  body('date')
    .trim()
    .notEmpty().withMessage('Date is required')
    .matches(/^\d{2}-[A-Za-z]{3}-\d{4}$/).withMessage('Date must be in format DD-MMM-YYYY (e.g., 04-Mar-2026)'),
  handleValidationErrors
];

const shareholdingPatternValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 500 }).withMessage('Title must not exceed 500 characters'),
  body('date')
    .trim()
    .notEmpty().withMessage('Date is required')
    .matches(/^\d{2}-[A-Za-z]{3}-\d{4}$/).withMessage('Date must be in format DD-MMM-YYYY (e.g., 04-Mar-2026)'),
  handleValidationErrors
];

const financialValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 500 }).withMessage('Title must not exceed 500 characters'),
  body('date')
    .trim()
    .notEmpty().withMessage('Date is required')
    .matches(/^\d{2}-[A-Za-z]{3}-\d{4}$/).withMessage('Date must be in format DD-MMM-YYYY (e.g., 04-Mar-2026)'),
  handleValidationErrors
];

const pressReleaseValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 500 }).withMessage('Title must not exceed 500 characters'),
  body('date')
    .trim()
    .notEmpty().withMessage('Date is required')
    .matches(/^\d{2}-[A-Za-z]{3}-\d{4}$/).withMessage('Date must be in format DD-MMM-YYYY (e.g., 04-Mar-2026)'),
  handleValidationErrors
];

const dailyStatsValidation = [
  body('trade_date')
    .trim()
    .notEmpty().withMessage('Trade date is required')
    .matches(/^\d{2}-[A-Za-z]{3}-\d{4}$/).withMessage('Trade date must be in format DD-MMM-YYYY'),
  body('no_of_trades')
    .notEmpty().withMessage('Number of trades is required')
    .isInt({ min: 0 }).withMessage('Number of trades must be a non-negative integer'),
  body('trade_value')
    .notEmpty().withMessage('Trade value is required')
    .isDecimal({ decimal_digits: '0,2' }).withMessage('Trade value must be a valid decimal with up to 2 decimal places')
    .custom(value => parseFloat(value) >= 0).withMessage('Trade value cannot be negative'),
  body('fund_settlement_value')
    .notEmpty().withMessage('Fund settlement value is required')
    .isDecimal({ decimal_digits: '0,2' }).withMessage('Fund settlement value must be a valid decimal with up to 2 decimal places')
    .custom(value => parseFloat(value) >= 0).withMessage('Fund settlement value cannot be negative'),
  handleValidationErrors
];

const monthlyStatsValidation = [
  body('month')
    .trim()
    .notEmpty().withMessage('Month is required')
    .matches(/^[A-Za-z]{3}-\d{4}$/).withMessage('Month must be in format MMM-YYYY (e.g., Feb-2026)'),
  body('no_of_trades')
    .notEmpty().withMessage('Number of trades is required')
    .isInt({ min: 0 }).withMessage('Number of trades must be a non-negative integer'),
  body('trade_value')
    .notEmpty().withMessage('Trade value is required')
    .isDecimal({ decimal_digits: '0,2' }).withMessage('Trade value must be a valid decimal with up to 2 decimal places')
    .custom(value => parseFloat(value) >= 0).withMessage('Trade value cannot be negative'),
  handleValidationErrors
];

const shareholdersMeetingValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 500 }).withMessage('Title must not exceed 500 characters'),
  body('date')
    .trim()
    .notEmpty().withMessage('Date is required')
    .matches(/^\d{2}-[A-Za-z]{3}-\d{4}$/).withMessage('Date must be in format DD-MMM-YYYY (e.g., 04-Mar-2026)'),
  handleValidationErrors
];
const sebiValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 500 }).withMessage('Title must not exceed 500 characters'),
  body('date')
    .trim()
    .notEmpty().withMessage('Date is required')
    .matches(/^\d{2}-[A-Za-z]{3}-\d{4}$/).withMessage('Date must be in format DD-MMM-YYYY (e.g., 04-Mar-2026)'),
  handleValidationErrors
];

const rbiValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 500 }).withMessage('Title must not exceed 500 characters'),
  body('date')
    .trim()
    .notEmpty().withMessage('Date is required')
    .matches(/^\d{2}-[A-Za-z]{3}-\d{4}$/).withMessage('Date must be in format DD-MMM-YYYY (e.g., 04-Mar-2026)'),
  handleValidationErrors
];

const financialResultValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 500 }).withMessage('Title must not exceed 500 characters'),
  body('date')
    .trim()
    .notEmpty().withMessage('Date is required')
    .matches(/^\d{2}-[A-Za-z]{3}-\d{4}$/).withMessage('Date must be in format DD-MMM-YYYY (e.g., 04-Mar-2026)'),
  handleValidationErrors
];

const annualReportValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 500 }).withMessage('Title must not exceed 500 characters'),
  body('date')
    .trim()
    .notEmpty().withMessage('Date is required')
    .matches(/^\d{2}-[A-Za-z]{3}-\d{4}$/).withMessage('Date must be in format DD-MMM-YYYY (e.g., 04-Mar-2026)'),
  handleValidationErrors
];

const annualReturnValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 500 }).withMessage('Title must not exceed 500 characters'),
  body('date')
    .trim()
    .notEmpty().withMessage('Date is required')
    .matches(/^\d{2}-[A-Za-z]{3}-\d{4}$/).withMessage('Date must be in format DD-MMM-YYYY (e.g., 04-Mar-2026)'),
  handleValidationErrors
];

const newspaperPublicationValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 500 }).withMessage('Title must not exceed 500 characters'),
  body('date')
    .trim()
    .notEmpty().withMessage('Date is required')
    .matches(/^\d{2}-[A-Za-z]{3}-\d{4}$/).withMessage('Date must be in format DD-MMM-YYYY (e.g., 04-Mar-2026)'),
  handleValidationErrors
];

const financialStatementValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 500 }).withMessage('Title must not exceed 500 characters'),
  body('date')
    .trim()
    .notEmpty().withMessage('Date is required')
    .matches(/^\d{2}-[A-Za-z]{3}-\d{4}$/).withMessage('Date must be in format DD-MMM-YYYY (e.g., 04-Mar-2026)'),
  handleValidationErrors
];



const idParamValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID must be a positive integer'),
  handleValidationErrors
];

module.exports = {
  loginValidation,
  circularValidation,
  announcementValidation,
  investorComplaintValidation,
  shareholdingPatternValidation,
  financialValidation,
  pressReleaseValidation,
  dailyStatsValidation,
  monthlyStatsValidation,
  shareholdersMeetingValidation, 
  idParamValidation,
  sebiValidation,
  rbiValidation,
  financialResultValidation,
  annualReportValidation,
  annualReturnValidation,
  newspaperPublicationValidation,
  financialStatementValidation
};