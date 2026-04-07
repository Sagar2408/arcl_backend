const { AuditTrail } = require('../models');

// All available sections
const ALL_SECTIONS = [
  'circulars', 'master_circulars', 'daily_stats', 'monthly_stats',
  'newsletter', 'announcements', 'shareholders_meetings', 'press_releases',
  'investor_complaints', 'sebi', 'rbi', 'financial_results',
  'annual_reports', 'annual_returns', 'financial_statements', 'newspaper_publications'
];

// Check if user has permission for specific action
const checkPermission = (section, action) => {
  return async (req, res, next) => {
    try {
      const { role, permissions } = req.user;

      // Super admin has all permissions
      if (role === 'super_admin') {
        return next();
      }

      // Find permission for this section
      const userPermission = permissions.find(p => p.section === section);

      if (!userPermission) {
        return res.status(403).json({
          success: false,
          message: `Access denied. No permissions for ${section}.`
        });
      }

      // Check specific action
      const actionMap = {
        'view': 'can_view',
        'create': 'can_create',
        'update': 'can_update',
        'delete': 'can_delete'
      };

      const permissionField = actionMap[action];

      if (!userPermission[permissionField]) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Cannot ${action} in ${section}.`
        });
      }

      // Log view actions (optional, can be disabled for performance)
      if (action === 'view' && process.env.LOG_VIEW_ACTIONS === 'true') {
        await AuditTrail.create({
          user_id: req.user.id,
          action: 'VIEW',
          section,
          ip_address: req.ip,
          user_agent: req.headers['user-agent']
        });
      }

      next();

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Permission check failed',
        error: error.message
      });
    }
  };
};

// Super admin only middleware
const superAdminOnly = (req, res, next) => {
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Super admin only.'
    });
  }
  next();
};

module.exports = {
  checkPermission,
  superAdminOnly,
  ALL_SECTIONS
};