const { Archive, User } = require('../models');

// GET ALL ARCHIVES
exports.getArchives = async (req, res) => {
  try {
    const { module } = req.query;

    const where = {};
    if (module) where.module = module.toLowerCase();

    const archives = await Archive.findAll({
      where,
      order: [['deleted_at', 'DESC']]
    });

    // ✅ Fetch users (use username)
    const users = await User.findAll({
      attributes: ["id", "username"]
    });

    // ✅ Map IDs → usernames
    const formatted = archives.map(item => {
      const deletedUser = users.find(u => u.id === item.deleted_by);
      const requestedUser = users.find(u => u.id === item.requested_by);

      return {
        ...item.toJSON(),
        deleted_by: deletedUser?.username || "—",
        requested_by: requestedUser?.username || "—"
      };
    });

    res.json({
      success: true,
      data: formatted
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching archives',
      error: error.message
    });
  }
};

// GET SINGLE ARCHIVE
exports.getArchiveById = async (req, res) => {
  try {
    const { id } = req.params;

    const archive = await Archive.findByPk(id);

    if (!archive) {
      return res.status(404).json({
        success: false,
        message: 'Archive not found'
      });
    }

    res.json({
      success: true,
      data: archive
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching archive',
      error: error.message
    });
  }
};

// DELETE FROM ARCHIVE (PERMANENT)
exports.deleteArchive = async (req, res) => {
  try {
    const { id } = req.params;

    const archive = await Archive.findByPk(id);

    if (!archive) {
      return res.status(404).json({
        success: false,
        message: 'Archive not found'
      });
    }

    await archive.destroy();

    res.json({
      success: true,
      message: 'Archive permanently deleted'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting archive',
      error: error.message
    });
  }
};

exports.restoreArchive = async (req, res) => {
  try {
    const { id } = req.params;

    const archive = await Archive.findByPk(id);

    if (!archive) {
      return res.status(404).json({
        success: false,
        message: 'Archive not found'
      });
    }

    // Model mapping
    const {
      Announcement,
      Circular,
      MasterCircular,
      Newsletter,
      PressRelease,
      InvestorComplaint,
      DailyStat,
      MonthlyStat,
      AnnualReport,
      AnnualReturn,
      FinancialResults,
      FinancialStatement,
      NewspaperPublication,
      SEBI,
      RBI
    } = require('../models');

    const modelMap = {
      announcements: Announcement,
      circulars: Circular,
      master_circulars: MasterCircular,
      newsletters: Newsletter,
      press_releases: PressRelease,
      investor_complaints: InvestorComplaint,
      daily_stats: DailyStat,
      monthly_stats: MonthlyStat,
      annual_reports: AnnualReport,
      annual_returns: AnnualReturn,
      financial_results: FinancialResults,
      financial_statements: FinancialStatement,
      newspaper_publications: NewspaperPublication,
      sebi: SEBI,
      rbi: RBI
    };

    const Model = modelMap[archive.module];

    if (!Model) {
      return res.status(400).json({
        success: false,
        message: 'Invalid module for restore'
      });
    }

    //  Restore record
    await Model.create(archive.data);

    // Remove from archive
    await archive.destroy();

    res.json({
      success: true,
      message: 'Record restored successfully'
    });

  } catch (error) {
    console.error('RESTORE ERROR:', error);

    res.status(500).json({
      success: false,
      message: 'Error restoring archive',
      error: error.message
    });
  }
};