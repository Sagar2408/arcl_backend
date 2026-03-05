const { MonthlyStat } = require('../models');
const { Op } = require('sequelize');

exports.createMonthlyStat = async (req, res) => {
  try {
    const { month, no_of_trades, trade_value } = req.body;
    
    const stat = await MonthlyStat.create({
      month,
      no_of_trades,
      trade_value
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
    
    // Check if new month conflicts with existing record
    if (month && month !== stat.month) {
      const existing = await MonthlyStat.findOne({ where: { month } });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'Statistics for this month already exist'
        });
      }
    }
    
    await stat.update({
      month: month || stat.month,
      no_of_trades: no_of_trades !== undefined ? no_of_trades : stat.no_of_trades,
      trade_value: trade_value !== undefined ? trade_value : stat.trade_value
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
    
    await stat.destroy();
    
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