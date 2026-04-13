const path = require('path');
const { updateDescription } = require('./auditDescriptions');

const toPlainObject = (value = {}) => {
  if (value?.dataValues) {
    return { ...value.dataValues };
  }

  return { ...value };
};

const getFileNameFromUrl = (fileUrl) => {
  if (!fileUrl) {
    return null;
  }

  return path.basename(fileUrl);
};

const buildSnapshot = (record, fields = [], options = {}) => {
  const {
    fileField = 'pdf_url',
    includeFileName = true,
    extraData = {}
  } = options;
  const source = toPlainObject(record);
  const snapshot = {};
  const selectedFields = Array.isArray(fields) && fields.length ? fields : Object.keys(source);

  for (const field of selectedFields) {
    if (source[field] !== undefined) {
      snapshot[field] = source[field];
    }
  }

  if (includeFileName && fileField && source[fileField] !== undefined) {
    snapshot.fileName = getFileNameFromUrl(source[fileField]);
  }

  return {
    ...snapshot,
    ...extraData
  };
};

const buildCreateDescription = ({
  entityLabel,
  data = {},
  titleField = 'title',
  fileField = 'pdf_url',
  dateField = 'date',
  extraParts = []
}) => {
  const title = data[titleField] || 'record';
  const fileName = data.fileName || getFileNameFromUrl(data[fileField]);
  const date = data[dateField];
  const details = [];

  if (fileName) {
    details.push(`File: ${fileName}`);
  }

  if (date) {
    details.push(`Date: ${date}`);
  }

  extraParts.filter(Boolean).forEach((part) => details.push(part));

  if (!details.length) {
    return `Created ${entityLabel} "${title}"`;
  }

  return `Created ${entityLabel} "${title}" (${details.join(', ')})`;
};

const buildUpdateAuditDescription = ({
  entityLabel,
  oldData = {},
  newData = {},
  fields = [],
  labels = {},
  fileChanged = false,
  fallback
}) => {
  const description = updateDescription(entityLabel, oldData, newData, {
    fields,
    labels,
    prefix: `Updated ${entityLabel}`,
    separator: ', ',
    fallback: null
  });
  const parts = [];

  if (description) {
    parts.push(description);
  }

  if (fileChanged) {
    parts.push('file updated');
  }

  return parts.join(', ') || fallback || `Updated ${entityLabel}`;
};

const buildDeleteDescription = ({ entityLabel, title }) => {
  return `Deleted ${entityLabel} "${title || 'record'}"`;
};

module.exports = {
  toPlainObject,
  getFileNameFromUrl,
  buildSnapshot,
  buildCreateDescription,
  buildUpdateAuditDescription,
  buildDeleteDescription
};
