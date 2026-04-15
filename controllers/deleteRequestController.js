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

// Role constants for clarity and maintainability
const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  EXECUTIVE: 'executive',
  VIEWER: 'viewer'
};

// Permission levels for delete operations
const DELETE_PERMISSIONS = {
  DIRECT_DELETE: [ROLES.SUPER_ADMIN],      // Can delete without approval
  REQUEST_DELETE: [ROLES.ADMIN, ROLES.EXECUTIVE],  // Must go through approval flow
  NO_DELETE: [ROLES.VIEWER]                // Cannot delete at all
};

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

// ==================== HELPER FUNCTIONS ====================

/**
 * Check if user can perform direct delete (no approval needed)
 */
const canDirectDelete = (role) => DELETE_PERMISSIONS.DIRECT_DELETE.includes(role);

/**
 * Check if user can request delete (approval required)
 */
const canRequestDelete = (role) => DELETE_PERMISSIONS.REQUEST_DELETE.includes(role);

/**
 * Check if user can approve/reject delete requests
 */
const canApproveReject = (role) => role === ROLES.SUPER_ADMIN;

/**
 * Validate that reviewer is not the requester (prevent self-approval)
 */
const isSelfReview = (requesterId, reviewerId) => requesterId === reviewerId;

// ==================== CONTROLLER FUNCTIONS ====================

// CREATE DELETE REQUEST (Only for Admin/Executive)
exports.createRequest = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { section, record_id, record_title, reason } = req.body;
    const userRole = req.user.role;
    const userId = req.user.id;

    // SECURITY CHECK 1: Block SuperAdmin from creating delete requests
    if (canDirectDelete(userRole)) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: 'SuperAdmin cannot create delete requests. Use direct delete instead.',
        code: 'DIRECT_DELETE_AVAILABLE',
        suggestion: 'As a SuperAdmin, you can delete records directly without approval.'
      });
    }

    // SECURITY CHECK 2: Verify user has permission to request delete
    if (!canRequestDelete(userRole)) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to request record deletion',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    // Validate required fields
    if (!section || !record_id) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Section and record_id are required'
      });
    }

    const normalizedSection = normalizeSection(section);
    const sectionVariants = getSectionVariants(normalizedSection);

    // Check for existing pending request
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
      return res.status(409).json({
        success: false,
        message: 'A delete request is already pending for this record',
        code: 'PENDING_REQUEST_EXISTS',
        existingRequest: {
          id: existingRequest.id,
          requested_by: existingRequest.requested_by,
          requested_at: existingRequest.requested_at
        }
      });
    }

    // Verify record exists before creating request
    const Model = modelMap[normalizedSection];
    if (Model) {
      const record = await Model.findByPk(record_id, { transaction });
      if (!record) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'Record not found',
          code: 'RECORD_NOT_FOUND'
        });
      }
    }

    const request = await DeleteRequest.create({
      requested_by: userId,
      section: normalizedSection,
      record_id,
      record_title,
      reason: reason || 'No reason provided'
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
      data: request,
      nextSteps: 'Your request is pending SuperAdmin approval'
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Create delete request error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating delete request',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// DIRECT DELETE (SuperAdmin only - no approval needed)
exports.directDelete = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { section, record_id } = req.params;
    const { reason, archive = true } = req.body; // Default to archive instead of hard delete
    const userRole = req.user.role;
    const userId = req.user.id;

    // SECURITY CHECK: Only SuperAdmin can direct delete
    if (!canDirectDelete(userRole)) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: 'Only SuperAdmin can perform direct deletion',
        code: 'SUPER_ADMIN_ONLY',
        suggestion: 'Please use the delete request flow or contact your SuperAdmin'
      });
    }

    const normalizedSection = normalizeSection(section);
    const Model = modelMap[normalizedSection];

    if (!Model) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Invalid section: ${section}`,
        code: 'INVALID_SECTION'
      });
    }

    const record = await Model.findByPk(record_id, { transaction });

    if (!record) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Record not found',
        code: 'RECORD_NOT_FOUND'
      });
    }

    const recordData = buildRecordSnapshot(record);
    const recordTitle = getRecordTitle(recordData);

    // Archive instead of hard delete (recommended for audit trails)
    if (archive && Object.prototype.hasOwnProperty.call(record, 'is_deleted')) {
      // Soft delete if model supports it
      await record.update({
        is_deleted: true,
        deleted_at: new Date(),
        deleted_by: userId,
        deletion_reason: reason || 'Direct deletion by SuperAdmin'
      }, { transaction });
    } else {
      // Hard delete only if explicitly requested or no soft delete support
      await record.destroy({ transaction });
    }

    await logAudit({
      req,
      action: 'DIRECT_DELETE',
      module: normalizedSection,
      recordId: record_id,
      oldData: recordData,
      newData: {
        deleted: true,
        deleted_by: req.user.username,
        deletion_method: archive ? 'soft_delete' : 'hard_delete',
        reason: reason || 'No reason provided'
      },
      description: `SuperAdmin directly deleted ${getSectionLabel(normalizedSection)} "${recordTitle}"`,
      transaction
    });

    await transaction.commit();

    res.json({
      success: true,
      message: `Record "${recordTitle}" has been ${archive ? 'archived' : 'permanently deleted'}`,
      data: {
        section: normalizedSection,
        record_id,
        deletion_method: archive ? 'soft_delete' : 'hard_delete',
        deleted_by: req.user.username,
        deleted_at: new Date()
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Direct delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting record',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// GET ALL REQUESTS
exports.getAllRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const whereClause = {};

    // Role-based filtering
    if (req.user.role === ROLES.EXECUTIVE) {
      whereClause.requested_by = req.user.id;
    }
    // SuperAdmin and Admin can see all requests

    if (status) {
      whereClause.status = status;
    }

    const { count, rows } = await DeleteRequest.findAndCountAll({
      where: whereClause,
      include: [
        { model: User, as: 'requester', attributes: ['id', 'username', 'role'] },
        { model: User, as: 'reviewer', attributes: ['id', 'username', 'role'] }
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
    console.error('Get requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching delete requests',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// GET PENDING COUNT
exports.getPendingCount = async (req, res) => {
  try {
    // Only SuperAdmin and Admin need pending counts
    if (!canApproveReject(req.user.role) && req.user.role !== ROLES.ADMIN) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const count = await DeleteRequest.count({
      where: { status: 'pending' }
    });

    res.json({
      success: true,
      data: { pending_count: count }
    });

  } catch (error) {
    console.error('Get pending count error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending count',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// APPROVE REQUEST (SuperAdmin only)
exports.approveRequest = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { review_note } = req.body;
    const userRole = req.user.role;
    const userId = req.user.id;

    // SECURITY CHECK 1: Only SuperAdmin can approve
    if (!canApproveReject(userRole)) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: 'Only SuperAdmin can approve delete requests',
        code: 'SUPER_ADMIN_ONLY'
      });
    }

    const request = await DeleteRequest.findByPk(id, {
      include: [{ model: User, as: 'requester', attributes: ['id', 'username', 'role'] }],
      transaction
    });

    if (!request) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Delete request not found',
        code: 'REQUEST_NOT_FOUND'
      });
    }

    if (request.status !== 'pending') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Request has already been processed',
        code: 'ALREADY_PROCESSED',
        currentStatus: request.status
      });
    }

    // SECURITY CHECK 2: Prevent self-approval (even though SuperAdmin shouldn't create requests)
    if (isSelfReview(request.requested_by, userId)) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: 'You cannot approve your own delete request',
        code: 'SELF_APPROVAL_BLOCKED',
        note: 'This should not happen as SuperAdmin cannot create requests'
      });
    }

    const normalizedSection = normalizeSection(request.section);
    const Model = modelMap[normalizedSection];

    if (!Model) {
      throw new Error(`Invalid section: ${request.section}`);
    }

    const record = await Model.findByPk(request.record_id, { transaction });

    if (!record) {
      // Mark request as failed if record doesn't exist
      await request.update({
        status: 'failed',
        reviewed_by: userId,
        reviewed_at: new Date(),
        review_note: 'Record not found during approval'
      }, { transaction });

      await transaction.commit();
      return res.status(404).json({
        success: false,
        message: 'Record not found - request marked as failed',
        code: 'RECORD_NOT_FOUND'
      });
    }

    const oldRequestData = buildRequestSnapshot(request);
    const recordData = buildRecordSnapshot(record);

    // Soft delete the record
    if (Object.prototype.hasOwnProperty.call(record, 'is_deleted')) {
      await record.update({
        is_deleted: true,
        deleted_at: new Date(),
        deleted_by: request.requested_by, // Track who requested it
        deletion_approved_by: userId,     // Track who approved it
        deletion_reason: request.reason
      }, { transaction });
    } else {
      await record.destroy({ transaction });
    }

    await request.update({
      section: normalizedSection,
      status: 'approved',
      reviewed_by: userId,
      reviewed_at: new Date(),
      review_note: review_note || 'Approved'
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
        deleted: true,
        deletion_method: Object.prototype.hasOwnProperty.call(record, 'is_deleted') ? 'soft_delete' : 'hard_delete'
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
    console.error('Approve request error:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving request',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// REJECT REQUEST (SuperAdmin only)
exports.rejectRequest = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { review_note } = req.body;
    const userRole = req.user.role;
    const userId = req.user.id;

    // SECURITY CHECK: Only SuperAdmin can reject
    if (!canApproveReject(userRole)) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: 'Only SuperAdmin can reject delete requests',
        code: 'SUPER_ADMIN_ONLY'
      });
    }

    const request = await DeleteRequest.findByPk(id, {
      include: [{ model: User, as: 'requester', attributes: ['id', 'username', 'role'] }],
      transaction
    });

    if (!request) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Delete request not found',
        code: 'REQUEST_NOT_FOUND'
      });
    }

    if (request.status !== 'pending') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Request has already been processed',
        code: 'ALREADY_PROCESSED',
        currentStatus: request.status
      });
    }

    // SECURITY CHECK: Prevent self-review
    if (isSelfReview(request.requested_by, userId)) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: 'You cannot reject your own delete request',
        code: 'SELF_REVIEW_BLOCKED'
      });
    }

    const normalizedSection = normalizeSection(request.section);
    const oldData = buildRequestSnapshot(request);

    await request.update({
      section: normalizedSection,
      status: 'rejected',
      reviewed_by: userId,
      reviewed_at: new Date(),
      review_note: review_note || 'Rejected without comment'
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
    console.error('Reject request error:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting request',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// GET DELETE PERMISSIONS INFO (for frontend)
exports.getDeletePermissions = async (req, res) => {
  try {
    const userRole = req.user.role;

    res.json({
      success: true,
      data: {
        role: userRole,
        can_direct_delete: canDirectDelete(userRole),
        can_request_delete: canRequestDelete(userRole),
        can_approve_reject: canApproveReject(userRole),
        workflow: canDirectDelete(userRole) ? 'direct' : 'request_approval'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching permissions',
      error: error.message
    });
  }
};