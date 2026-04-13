const {
  DeleteRequest,
  User,
  sequelize,
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
} = require('../models');
const { Op } = require('sequelize');
const logAudit = require('../utils/auditLogger');
const { buildSnapshot, toPlainObject } = require('../utils/controllerAuditHelper');

const sectionAliases = {
  user: 'users',
  users: 'users',
  circulars: 'circulars',
  master_circulars: 'master_circulars',
  daily_stats: 'daily_stats',
  monthly_stats: 'monthly_stats',
  newsletter: 'newsletter',
  newsletters: 'newsletter',
  announcements: 'announcements',
  investor_complaints: 'investor_complaints',
  shareholding: 'shareholding_patterns',
  shareholding_patterns: 'shareholding_patterns',
  press_release: 'press_releases',
  press_releases: 'press_releases',
  shareholders_meeting: 'shareholders_meetings',
  shareholders_meetings: 'shareholders_meetings',
  sebi: 'sebi',
  rbi: 'rbi',
  financial_result: 'financial_results',
  financial_results: 'financial_results',
  annual_reports: 'annual_reports',
  annual_returns: 'annual_returns',
  newspaper_publication: 'newspaper_publications',
  newspaper_publications: 'newspaper_publications',
  financial_statements: 'financial_statements'
};

const modelMap = {
  users: User,
  circulars: Circular,
  master_circulars: MasterCircular,
  daily_stats: DailyStat,
  monthly_stats: MonthlyStat,
  newsletter: Newsletter,
  announcements: Announcement,
  investor_complaints: InvestorComplaint,
  shareholding_patterns: ShareholdingPattern,
  press_releases: PressRelease,
  shareholders_meetings: ShareholdersMeeting,
  sebi: SEBI,
  rbi: RBI,
  financial_results: FinancialResult,
  annual_reports: AnnualReport,
  annual_returns: AnnualReturn,
  newspaper_publications: NewspaperPublication,
  financial_statements: FinancialStatement
};

const sectionLabels = {
  users: 'user',
  circulars: 'circular',
  master_circulars: 'master circular',
  daily_stats: 'daily statistic',
  monthly_stats: 'monthly statistic',
  newsletter: 'newsletter',
  announcements: 'announcement',
  investor_complaints: 'investor complaint',
  shareholding_patterns: 'shareholding pattern',
  press_releases: 'press release',
  shareholders_meetings: 'shareholders meeting',
  sebi: 'SEBI circular',
  rbi: 'RBI circular',
  financial_results: 'financial result',
  annual_reports: 'annual report',
  annual_returns: 'annual return',
  newspaper_publications: 'newspaper publication',
  financial_statements: 'financial statement'
};

const requestFields = [
  'section',
  'record_id',
  'record_title',
  'reason',
  'status',
  'requested_by',
  'reviewed_by',
  'reviewed_at',
  'review_note'
];

const normalizeSection = (section) => sectionAliases[section] || section;

const getSectionVariants = (section) => {
  const normalizedSection = normalizeSection(section);

  return Object.keys(sectionAliases).filter((key) => sectionAliases[key] === normalizedSection);
};

const getSectionLabel = (section) => sectionLabels[normalizeSection(section)] || 'record';

const buildRequestSnapshot = (request) => {
  return buildSnapshot(request, requestFields, {
    includeFileName: false,
    extraData: {
      request_id: request.id
    }
  });
};

const buildRecordSnapshot = (record) => {
  const source = toPlainObject(record);
  const fields = Object.keys(source).filter((key) => ![
    'password',
    'reset_password_token',
    'reset_password_expiry'
  ].includes(key));

  return buildSnapshot(source, fields, {
    includeFileName: Object.prototype.hasOwnProperty.call(source, 'pdf_url')
  });
};

const getRecordTitle = (snapshot = {}, fallback = null) => {
  return snapshot.title
    || snapshot.username
    || snapshot.trade_date
    || snapshot.month
    || fallback
    || 'record';
};

// CREATE DELETE REQUEST
exports.createRequest = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { section, record_id, record_title, reason } = req.body;
    const normalizedSection = normalizeSection(section);
    const sectionVariants = getSectionVariants(normalizedSection);

    const existingRequest = await DeleteRequest.findOne({
      where: {
        section: { [Op.in]: sectionVariants },
        record_id,
        status: 'pending'
      },
      transaction
    });

    if (existingRequest) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Delete request already pending for this record'
      });
    }

    const request = await DeleteRequest.create({
      requested_by: req.user.id,
      section: normalizedSection,
      record_id,
      record_title,
      reason
    }, { transaction });

    const newData = buildRequestSnapshot(request);

    await logAudit({
      req,
      action: 'DELETE_REQUEST',
      module: normalizedSection,
      recordId: request.record_id,
      newData,
      description: `Delete request submitted for ${getSectionLabel(normalizedSection)} "${record_title || record_id}"`,
      transaction
    });

    await transaction.commit();

    res.status(201).json({
      success: true,
      message: 'Delete request submitted for approval',
      data: request
    });

  } catch (error) {
    await transaction.rollback();
    res.status(500).json({
      success: false,
      message: 'Error creating delete request',
      error: error.message
    });
  }
};

// GET ALL REQUESTS
exports.getAllRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const whereClause = {};

    if (req.user.role === 'executive') {
      whereClause.requested_by = req.user.id;
    }

    if (status) {
      whereClause.status = status;
    }

    const { count, rows } = await DeleteRequest.findAndCountAll({
      where: whereClause,
      include: [
        { model: User, as: 'requester', attributes: ['id', 'username'] },
        { model: User, as: 'reviewer', attributes: ['id', 'username'] }
      ],
      order: [['requested_at', 'DESC']],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page, 10),
        pages: Math.ceil(count / limit),
        limit: parseInt(limit, 10)
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching delete requests',
      error: error.message
    });
  }
};

// GET PENDING COUNT
exports.getPendingCount = async (req, res) => {
  try {
    const count = await DeleteRequest.count({
      where: { status: 'pending' }
    });

    res.json({
      success: true,
      data: { pending_count: count }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching pending count',
      error: error.message
    });
  }
};

// APPROVE REQUEST
exports.approveRequest = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { review_note } = req.body;

    const request = await DeleteRequest.findByPk(id, {
      include: [{ model: User, as: 'requester' }],
      transaction
    });

    if (!request) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Delete request not found'
      });
    }

    if (request.status !== 'pending') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Request already processed'
      });
    }

    const normalizedSection = normalizeSection(request.section);
    const Model = modelMap[normalizedSection];

    if (!Model) {
      throw new Error(`Invalid section: ${request.section}`);
    }

    const record = await Model.findByPk(request.record_id, { transaction });

    if (!record) {
      throw new Error('Record not found');
    }

    const oldRequestData = buildRequestSnapshot(request);
    const recordData = buildRecordSnapshot(record);

    await record.destroy({ transaction });

    await request.update({
      section: normalizedSection,
      status: 'approved',
      reviewed_by: req.user.id,
      reviewed_at: new Date(),
      review_note
    }, { transaction });

    const newRequestData = buildRequestSnapshot(request);
    const recordTitle = getRecordTitle(recordData, request.record_title);

    await logAudit({
      req,
      action: 'DELETE_APPROVE',
      module: normalizedSection,
      recordId: request.record_id,
      oldData: {
        request: oldRequestData,
        record: recordData
      },
      newData: {
        request: newRequestData,
        approved_by: req.user.username,
        requested_by: request.requester?.username || null,
        deleted: true
      },
      description: `Approved delete request for ${getSectionLabel(normalizedSection)} "${recordTitle}"`,
      transaction
    });

    await transaction.commit();

    res.json({
      success: true,
      message: 'Delete request approved and record deleted successfully',
      data: request
    });

  } catch (error) {
    await transaction.rollback();
    res.status(500).json({
      success: false,
      message: 'Error approving request',
      error: error.message
    });
  }
};

// REJECT REQUEST
exports.rejectRequest = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { review_note } = req.body;

    const request = await DeleteRequest.findByPk(id, {
      include: [{ model: User, as: 'requester' }],
      transaction
    });

    if (!request) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Delete request not found'
      });
    }

    if (request.status !== 'pending') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Request already processed'
      });
    }

    const normalizedSection = normalizeSection(request.section);
    const oldData = buildRequestSnapshot(request);

    await request.update({
      section: normalizedSection,
      status: 'rejected',
      reviewed_by: req.user.id,
      reviewed_at: new Date(),
      review_note
    }, { transaction });

    const newData = buildRequestSnapshot(request);

    await logAudit({
      req,
      action: 'DELETE_REJECT',
      module: normalizedSection,
      recordId: request.record_id,
      oldData,
      newData: {
        ...newData,
        rejected_by: req.user.username,
        requested_by: request.requester?.username || null
      },
      description: `Rejected delete request for ${getSectionLabel(normalizedSection)} "${request.record_title || request.record_id}"`,
      transaction
    });

    await transaction.commit();

    res.json({
      success: true,
      message: 'Delete request rejected',
      data: request
    });

  } catch (error) {
    await transaction.rollback();
    res.status(500).json({
      success: false,
      message: 'Error rejecting request',
      error: error.message
    });
  }
};
