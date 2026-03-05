const { DailyStat } = require('../models');
const { Op } = require('sequelize');

exports.createDailyStat = async (req, res) => {
  try {
    const { trade_date, no_of_trades, trade_value, fund_settlement_value } = req.body;
    
    const stat = await DailyStat.create({
      trade_date,
      no_of_trades,
      trade_value,
      fund_settlement_value
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
      // Note: Since trade_date is stored as string, we use string comparison
      // For proper date range queries, consider storing as DATE type
      whereClause.trade_date = {
        [Op.between]: [start_date, end_date]
      };
    }
    
    const { count, rows: stats } = await DailyStat.findAndCountAll({
      where: whereClause,
      order: [['trade_date', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({
      success: true,
      data: stats,
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
    
    // Check if new trade_date conflicts with existing record
    if (trade_date && trade_date !== stat.trade_date) {
      const existing = await DailyStat.findOne({ where: { trade_date } });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'Statistics for this trade date already exist'
        });
      }
    }
    
    await stat.update({
      trade_date: trade_date || stat.trade_date,
      no_of_trades: no_of_trades !== undefined ? no_of_trades : stat.no_of_trades,
      trade_value: trade_value !== undefined ? trade_value : stat.trade_value,
      fund_settlement_value: fund_settlement_value !== undefined ? fund_settlement_value : stat.fund_settlement_value
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
    
    await stat.destroy();
    
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