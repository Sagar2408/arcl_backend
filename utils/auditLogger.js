const { AuditTrail } = require('../models');

const logAudit = async ({
  req,
  userId = null,
  action,
  module,
  recordId = null,
  oldData = null,
  newData = null,
  description = null,
  transaction = null
}) => {
  try {
    const payload = {
      user_id: userId ?? req?.user?.id ?? null,
      action,
      section: module,
      record_id: recordId,
      old_data: oldData,
      new_data: newData,
      description: typeof description === 'string' && description.trim() ? description.trim() : null,
      ip_address: req?.ip || null,
      user_agent: req?.headers?.['user-agent'] || null
    };

    const options = transaction ? { transaction } : {};

    await AuditTrail.create(payload, options);
  } catch (err) {
    console.error('Audit error:', err.message);
  }
};

module.exports = logAudit;
