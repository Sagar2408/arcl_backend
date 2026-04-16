const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Archive = sequelize.define('Archive', {
  original_id: DataTypes.INTEGER,
  module: DataTypes.STRING,
  title: DataTypes.STRING,
  file_url: DataTypes.TEXT,
  data: DataTypes.JSON,
  deleted_by: DataTypes.INTEGER,
  requested_by: DataTypes.INTEGER,
  deleted_at: DataTypes.DATE,
  created_at: DataTypes.DATE
}, {
  tableName: 'archives',
  timestamps: false
});

module.exports = Archive;