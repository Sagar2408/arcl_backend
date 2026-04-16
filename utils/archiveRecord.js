const { Archive } = require('../models');

const archiveRecord = async ({
    record,
    module,
    deletedBy,
    requestedBy,
    transaction
}) => {
    try {
        console.log("📦 ARCHIVING:", module, record.id);

        await Archive.create({
            original_id: record.id,
            module,
            title: record.title || record.name || 'Untitled',
            file_url: record.pdf_url || null,
            data: record.toJSON(),

            deleted_by: deletedBy,
            requested_by: requestedBy,

            deleted_at: new Date(),

            // 🔥 FIX: safe created_at
            created_at: record.created_at || record.createdAt || new Date()

        }, { transaction });

    } catch (err) {
        console.error("❌ ARCHIVE ERROR:", err);
        throw err; // 🔥 VERY IMPORTANT → rollback transaction
    }
};

module.exports = archiveRecord;