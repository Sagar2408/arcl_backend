const { DailyStat } = require('../models');
const { Op } = require('sequelize');
const logAudit = require('../utils/auditLogger');
const {
  buildSnapshot,
  buildUpdateAuditDescription,
  buildDeleteDescription
} = require('../utils/controllerAuditHelper');

const MODULE_NAME = 'daily_stats';
const ENTITY_LABEL = 'daily statistic';
const SNAPSHOT_FIELDS = ['trade_date', 'no_of_trades', 'trade_value', 'fund_settlement_value'];

const buildCreateDailyDescription = (data) => {
  return `Created daily statistic for trade date "${data.trade_date}"`;
};

exports.createDailyStat = async (req, res) => {
  try {
    const { trade_date, no_of_trades, trade_value, fund_settlement_value } = req.body;

    const stat = await DailyStat.create({
      trade_date,
      no_of_trades,
      trade_value,
      fund_settlement_value
    });

    const newData = buildSnapshot(stat, SNAPSHOT_FIELDS, { includeFileName: false });

    await logAudit({
      req,
      action: 'CREATE',
      module: MODULE_NAME,
      recordId: stat.id,
      newData,
      description: buildCreateDailyDescription(newData)
    });

    res.status(201).json({
      success: true,
      message: 'Daily statistic created successfully',
      data: stat
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        message: 'Statistics for this trade date already exist'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating daily statistic',
      error: error.message
    });
  }
};

exports.getAllDailyStats = async (req, res) => {
  try {
    const { page = 1, limit = 10, start_date, end_date } = req.query;
    const offset = (page - 1) * limit;
    const whereClause = {};

    if (start_date && end_date) {
      whereClause.trade_date = {
        [Op.between]: [start_date, end_date]
      };
    }

    const { count, rows: stats } = await DailyStat.findAndCountAll({
      where: whereClause,
      order: [['trade_date', 'DESC']],
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
      message: 'Error fetching daily statistics',
      error: error.message
    });
  }
};

exports.updateDailyStat = async (req, res) => {
  try {
    const { id } = req.params;
    const { trade_date, no_of_trades, trade_value, fund_settlement_value } = req.body;

    const stat = await DailyStat.findByPk(id);
    if (!stat) {
      return res.status(404).json({
        success: false,
        message: 'Daily statistic not found'
      });
    }

    if (trade_date && trade_date !== stat.trade_date) {
      const existing = await DailyStat.findOne({ where: { trade_date } });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'Statistics for this trade date already exist'
        });
      }
    }

    const oldData = buildSnapshot(stat, SNAPSHOT_FIELDS, { includeFileName: false });

    await stat.update({
      trade_date: trade_date || stat.trade_date,
      no_of_trades: no_of_trades !== undefined ? no_of_trades : stat.no_of_trades,
      trade_value: trade_value !== undefined ? trade_value : stat.trade_value,
      fund_settlement_value: fund_settlement_value !== undefined ? fund_settlement_value : stat.fund_settlement_value
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
          trade_date: 'trade_date',
          no_of_trades: 'no_of_trades',
          trade_value: 'trade_value',
          fund_settlement_value: 'fund_settlement_value'
        },
        fallback: `Updated daily statistic "${newData.trade_date || oldData.trade_date || 'record'}"`
      })
    });

    res.json({
      success: true,
      message: 'Daily statistic updated successfully',
      data: stat
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating daily statistic',
      error: error.message
    });
  }
};

exports.deleteDailyStat = async (req, res) => {
  try {
    const { id } = req.params;

    const stat = await DailyStat.findByPk(id);
    if (!stat) {
      return res.status(404).json({
        success: false,
        message: 'Daily statistic not found'
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
        title: oldData.trade_date
      })
    });

    res.json({
      success: true,
      message: 'Daily statistic deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting daily statistic',
      error: error.message
    });
  }
};
