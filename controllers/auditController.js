const { AuditTrail, User, sequelize } = require('../models');
const { Op } = require('sequelize');


// ================= GET ALL AUDIT LOGS =================
exports.getAllLogs = async (req, res) => {
  try {
    let { 
      page = 1, 
      limit = 50, 
      user_id, 
      action, 
      section, 
      start_date, 
      end_date,
      search 
    } = req.query;

    // 🔒 limit protection
    limit = Math.min(parseInt(limit) || 50, 100);
    page = parseInt(page) || 1;

    const offset = (page - 1) * limit;
    const whereClause = {};

    if (user_id) whereClause.user_id = user_id;
    if (action) whereClause.action = action;
    if (section) whereClause.section = section;

    // 📅 date filter
    if (start_date || end_date) {
      whereClause.created_at = {};
      if (start_date && !isNaN(new Date(start_date))) {
        whereClause.created_at[Op.gte] = new Date(start_date);
      }
      if (end_date && !isNaN(new Date(end_date))) {
        whereClause.created_at[Op.lte] = new Date(end_date);
      }
    }

    // 🔍 search (NEW)
    if (search) {
      whereClause[Op.or] = [
        { description: { [Op.like]: `%${search}%` } },
        { action: { [Op.like]: `%${search}%` } },
        { section: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: logs } = await AuditTrail.findAndCountAll({
      where: whereClause,
      include: [{
        model: User,
        attributes: ['id', 'username', 'email', 'role'],
        required: false
      }],
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    res.json({
      success: true,
      data: logs,
      pagination: {
        total: count,
        page,
        pages: Math.ceil(count / limit),
        limit
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching audit logs',
      error: error.message
    });
  }
};


// ================= GET SINGLE LOG =================
exports.getLogById = async (req, res) => {
  try {
    const { id } = req.params;

    const log = await AuditTrail.findByPk(id, {
      include: [{
        model: User,
        attributes: ['id', 'username', 'role'],
        required: false
      }]
    });

    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Audit log not found'
      });
    }

    res.json({
      success: true,
      data: log
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching audit log',
      error: error.message
    });
  }
};


// ================= DELETE LOGS (DISABLED FOR COMPLIANCE) =================
exports.deleteOldLogs = async (req, res) => {
  return res.status(403).json({
    success: false,
    message: 'Audit logs cannot be deleted (compliance requirement)'
  });
};


// ================= GET STATISTICS =================
exports.getStatistics = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    const whereClause = {};

    if (start_date || end_date) {
      whereClause.created_at = {};
      if (start_date && !isNaN(new Date(start_date))) {
        whereClause.created_at[Op.gte] = new Date(start_date);
      }
      if (end_date && !isNaN(new Date(end_date))) {
        whereClause.created_at[Op.lte] = new Date(end_date);
      }
    }

    // 📊 action counts
    const actionCounts = await AuditTrail.findAll({
      where: whereClause,
      attributes: [
        'action',
        [sequelize.fn('COUNT', sequelize.col('action')), 'count']
      ],
      group: ['action'],
      raw: true
    });

    // 📊 section counts
    const sectionCounts = await AuditTrail.findAll({
      where: { ...whereClause, section: { [Op.not]: null } },
      attributes: [
        'section',
        [sequelize.fn('COUNT', sequelize.col('section')), 'count']
      ],
      group: ['section'],
      raw: true
    });

    // 📊 most active users
    const activeUsers = await AuditTrail.findAll({
      where: whereClause,
      attributes: [
        'user_id',
        [sequelize.fn('COUNT', sequelize.col('user_id')), 'count']
      ],
      include: [{
        model: User,
        attributes: ['username']
      }],
      group: ['user_id', 'User.id', 'User.username'],
      order: [[sequelize.fn('COUNT', sequelize.col('user_id')), 'DESC']],
      limit: 10
    });

    res.json({
      success: true,
      data: {
        action_counts: actionCounts,
        section_counts: sectionCounts,
        most_active_users: activeUsers
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
};