const { DailyStat } = require('../models');
const { Op } = require('sequelize');
const XLSX = require("xlsx");
const fs = require("fs");
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

//Bulk upload feature

const excelDateToJSDate = (value) => {
  // Case 1: Excel serial number
  if (typeof value === "number") {
    const date = new Date((value - 25569) * 86400 * 1000);
    return date.toISOString().split("T")[0];
  }

  // Case 2: Already YYYY-MM-DD
  if (typeof value === "string" && value.includes("-")) {
    return value;
  }

  // Case 3: MM/DD/YYYY or DD/MM/YYYY
  if (typeof value === "string" && value.includes("/")) {
    const parts = value.split("/");

    if (parts.length === 3) {
      let [month, day, year] = parts;

      // handle DD/MM/YYYY case
      if (Number(month) > 12) {
        [day, month] = [month, day];
      }

      month = String(month).padStart(2, "0");
      day = String(day).padStart(2, "0");

      return `${year}-${month}-${day}`;
    }
  }

  return null; // invalid
};

exports.bulkUploadDailyStats = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded"
      });
    }

    const workbook = XLSX.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);

    if (!data.length) {
      return res.status(400).json({
        success: false,
        message: "Excel file is empty"
      });
    }

    let createdCount = 0;
    let updatedCount = 0;
    let skippedRows = [];
    const bulkRecords = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];

      const parsedDate = excelDateToJSDate(row.trade_date);

      // ❌ Skip invalid rows
      if (!parsedDate) {
        skippedRows.push({ row: i + 2, reason: "Invalid date format" });
        continue;
      }

      const payload = {
        trade_date: parsedDate,
        no_of_trades: Number(row.no_of_trades) || 0,
        trade_value: Number(row.trade_value) || 0,
        fund_settlement_value: Number(row.fund_settlement_value) || 0,
      };

      const existing = await DailyStat.findOne({
        where: { trade_date: payload.trade_date }
      });

      if (existing) {
        await existing.update(payload);
        updatedCount++;
        bulkRecords.push({
          trade_date: payload.trade_date,
          no_of_trades: payload.no_of_trades,
          trade_value: payload.trade_value,
          fund_settlement_value: payload.fund_settlement_value,
          action: "updated"
        });
      } else {
        await DailyStat.create(payload);
        createdCount++;
        bulkRecords.push({
          trade_date: payload.trade_date,
          no_of_trades: payload.no_of_trades,
          trade_value: payload.trade_value,
          fund_settlement_value: payload.fund_settlement_value,
          action: "created"
        });
      }
    }

    // Single audit log for bulk operation
    const totalRows = data.length;
    await logAudit({
      req,
      action: "BULK_UPLOAD",
      module: MODULE_NAME,
      newData: {
        total_rows: totalRows,
        created: createdCount,
        updated: updatedCount,
        skipped: skippedRows,
        records: bulkRecords.slice(0, 20),
        file_name: req.file.originalname
      },
      description: `Bulk uploaded ${totalRows} records (Created: ${createdCount}, Updated: ${updatedCount}, Skipped: ${skippedRows.length})`
    });

    // 🧹 delete uploaded file
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      message: "Bulk upload completed",
      created: createdCount,
      updated: updatedCount,
      skipped: skippedRows
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Bulk upload failed",
      error: error.message
    });
  }
};