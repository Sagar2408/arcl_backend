const { AuditTrail } = require('../models');

// Capture old data before update
const captureOldData = (modelName) => {
  return async (req, res, next) => {
    try {
      const { id } = req.params;
      
      if (id) {
        const model = require('../models')[modelName];
        const record = await model.findByPk(id);
        
        if (record) {
          req.oldData = record.toJSON();
        }
      }
      
      next();
    } catch (error) {
      next();
    }
  };
};

// Log action after completion
const logAction = (action, section) => {
  return async (req, res, next) => {
    // Store original json method
    const originalJson = res.json.bind(res);
    
    // Override res.json to capture response
    res.json = async (data) => {
      try {
        // Only log successful operations
        if (data.success) {
          const logData = {
            user_id: req.user?.id,
            action,
            section,
            ip_address: req.ip,
            user_agent: req.headers['user-agent']
          };

          // Add record ID from params or response
          if (req.params.id) {
            logData.record_id = parseInt(req.params.id);
          } else if (data.data?.id) {
            logData.record_id = data.data.id;
          }

          // Add data changes
          if (action === 'UPDATE' && req.oldData) {
            logData.old_data = req.oldData;
            logData.new_data = req.body;
          } else if (action === 'CREATE') {
            logData.new_data = data.data || req.body;
          }

          await AuditTrail.create(logData);
        }
      } catch (error) {
        console.error('Audit log error:', error);
      }

      // Call original json
      originalJson(data);
    };

    next();
  };
};

module.exports = {
  captureOldData,
  logAction
};