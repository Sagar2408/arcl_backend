const { AuditTrail, User, sequelize } = require('../models');
const { Op } = require('sequelize');

// GET ALL AUDIT LOGS (Super Admin only)
exports.getAllLogs = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      user_id, 
      action, 
      section, 
      start_date, 
      end_date,
      search 
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {};

    if (user_id) whereClause.user_id = user_id;
    if (action) whereClause.action = action;
    if (section) whereClause.section = section;
    
    if (start_date || end_date) {
      whereClause.created_at = {};
      if (start_date) whereClause.created_at[Op.gte] = new Date(start_date);
      if (end_date) whereClause.created_at[Op.lte] = new Date(end_date);
    }

    const { count, rows: logs } = await AuditTrail.findAndCountAll({
      where: whereClause,
      include: [{
        model: User,
        attributes: ['id', 'username', 'role']
      }],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: logs,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit),
        limit: parseInt(limit)
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

// GET AUDIT LOG BY ID
exports.getLogById = async (req, res) => {
  try {
    const { id } = req.params;

    const log = await AuditTrail.findByPk(id, {
      include: [{
        model: User,
        attributes: ['id', 'username', 'role']
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

// DELETE OLD AUDIT LOGS (Super Admin only - data retention)
exports.deleteOldLogs = async (req, res) => {
  try {
    const { days = 365 } = req.body; // Default: delete logs older than 1 year
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await AuditTrail.destroy({
      where: {
        created_at: {
          [Op.lt]: cutoffDate
        }
      }
    });

    res.json({
      success: true,
      message: `${result} old audit logs deleted`,
      deleted_count: result
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting audit logs',
      error: error.message
    });
  }
};

// GET AUDIT STATISTICS
exports.getStatistics = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    const whereClause = {};
    if (start_date || end_date) {
      whereClause.created_at = {};
      if (start_date) whereClause.created_at[Op.gte] = new Date(start_date);
      if (end_date) whereClause.created_at[Op.lte] = new Date(end_date);
    }

    // Action counts
    const actionCounts = await AuditTrail.findAll({
      where: whereClause,
      attributes: [
        'action',
        [sequelize.fn('COUNT', sequelize.col('action')), 'count']
      ],
      group: ['action'],
      raw: true
    });

    // Section activity
    const sectionCounts = await AuditTrail.findAll({
      where: { ...whereClause, section: { [Op.not]: null } },
      attributes: [
        'section',
        [sequelize.fn('COUNT', sequelize.col('section')), 'count']
      ],
      group: ['section'],
      raw: true
    });

    // Most active users
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
      limit: 10,
      raw: true
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