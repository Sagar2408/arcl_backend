const { MonthlyStat } = require('../models');
const { Op } = require('sequelize');
const logAudit = require('../utils/auditLogger');
const {
  buildSnapshot,
  buildUpdateAuditDescription,
  buildDeleteDescription
} = require('../utils/controllerAuditHelper');

const MODULE_NAME = 'monthly_stats';
const ENTITY_LABEL = 'monthly statistic';
const SNAPSHOT_FIELDS = ['month', 'no_of_trades', 'trade_value'];

const buildCreateMonthlyDescription = (data) => {
  return `Created monthly statistic for month "${data.month}"`;
};

exports.createMonthlyStat = async (req, res) => {
  try {
    const { month, no_of_trades, trade_value } = req.body;

    const stat = await MonthlyStat.create({
      month,
      no_of_trades,
      trade_value
    });

    const newData = buildSnapshot(stat, SNAPSHOT_FIELDS, { includeFileName: false });

    await logAudit({
      req,
      action: 'CREATE',
      module: MODULE_NAME,
      recordId: stat.id,
      newData,
      description: buildCreateMonthlyDescription(newData)
    });

    res.status(201).json({
      success: true,
      message: 'Monthly statistic created successfully',
      data: stat
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        message: 'Statistics for this month already exist'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating monthly statistic',
      error: error.message
    });
  }
};

exports.getAllMonthlyStats = async (req, res) => {
  try {
    const { page = 1, limit = 10, year } = req.query;
    const offset = (page - 1) * limit;
    const whereClause = {};

    if (year) {
      whereClause.month = {
        [Op.like]: `%-${year}`
      };
    }

    const { count, rows: stats } = await MonthlyStat.findAndCountAll({
      where: whereClause,
      order: [['month', 'DESC']],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    });

    res.json({
      success: true,
      data: stats,
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
      message: 'Error fetching monthly statistics',
      error: error.message
    });
  }
};

exports.updateMonthlyStat = async (req, res) => {
  try {
    const { id } = req.params;
    const { month, no_of_trades, trade_value } = req.body;

    const stat = await MonthlyStat.findByPk(id);
    if (!stat) {
      return res.status(404).json({
        success: false,
        message: 'Monthly statistic not found'
      });
    }

    if (month && month !== stat.month) {
      const existing = await MonthlyStat.findOne({ where: { month } });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'Statistics for this month already exist'
        });
      }
    }

    const oldData = buildSnapshot(stat, SNAPSHOT_FIELDS, { includeFileName: false });

    await stat.update({
      month: month || stat.month,
      no_of_trades: no_of_trades !== undefined ? no_of_trades : stat.no_of_trades,
      trade_value: trade_value !== undefined ? trade_value : stat.trade_value
    });

    const newData = buildSnapshot(stat, SNAPSHOT_FIELDS, { includeFileName: false });

    await logAudit({
      req,
      action: 'UPDATE',
      module: MODULE_NAME,
      recordId: stat.id,
      oldData,
      newData,
      description: buildUpdateAuditDescription({
        entityLabel: ENTITY_LABEL,
        oldData,
        newData,
        fields: SNAPSHOT_FIELDS,
        labels: {
          month: 'month',
          no_of_trades: 'no_of_trades',
          trade_value: 'trade_value'
        },
        fallback: `Updated monthly statistic "${newData.month || oldData.month || 'record'}"`
      })
    });

    res.json({
      success: true,
      message: 'Monthly statistic updated successfully',
      data: stat
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating monthly statistic',
      error: error.message
    });
  }
};

exports.deleteMonthlyStat = async (req, res) => {
  try {
    const { id } = req.params;

    const stat = await MonthlyStat.findByPk(id);
    if (!stat) {
      return res.status(404).json({
        success: false,
        message: 'Monthly statistic not found'
      });
    }

    const oldData = buildSnapshot(stat, SNAPSHOT_FIELDS, { includeFileName: false });

    await stat.destroy();

    await logAudit({
      req,
      action: 'DELETE_APPROVE',
      module: MODULE_NAME,
      recordId: stat.id,
      oldData,
      description: buildDeleteDescription({
        entityLabel: ENTITY_LABEL,
        title: oldData.month
      })
    });

    res.json({
      success: true,
      message: 'Monthly statistic deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting monthly statistic',
      error: error.message
    });
  }
};
