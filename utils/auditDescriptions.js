const PERMISSION_LABELS = {
  can_view: 'View',
  can_create: 'Create',
  can_update: 'Update',
  can_delete: 'Delete'
};

const toPlainObject = (value) => value?.dataValues || value || {};

const formatValue = (value) => {
  if (value === null || value === undefined || value === '') {
    return 'empty';
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }

  return String(value);
};

const normalizePermission = (permission = {}) => {
  const source = toPlainObject(permission);

  return {
    section: source.section,
    can_view: Boolean(source.can_view),
    can_create: Boolean(source.can_create),
    can_update: Boolean(source.can_update),
    can_delete: Boolean(source.can_delete)
  };
};

exports.createDescription = (module, data = {}) => {
  if (module === 'circulars') {
    const title = data.title || 'Untitled';
    const fileName = data.fileName || 'N/A';
    const date = data.date || 'N/A';

    return `Created circular "${title}" (File: ${fileName}, Date: ${date})`;
  }

  if (module === 'users') {
    const username = data.username || 'user';
    const roleText = data.role ? ` with role ${data.role}` : '';

    return `Created user ${username}${roleText}`;
  }

  return `Created ${module || 'record'}`;
};

exports.updateDescription = (module, oldData = {}, newData = {}, options = {}) => {
  const {
    fields = Object.keys(newData || {}),
    labels = {},
    prefix = `Updated ${module}`,
    separator = ' | ',
    fallback = `Updated ${module}`
  } = options;

  const changes = [];

  for (const field of fields) {
    const oldValue = oldData?.[field];
    const newValue = newData?.[field];

    if (JSON.stringify(oldValue) === JSON.stringify(newValue)) {
      continue;
    }

    changes.push(`${labels[field] || field}: ${formatValue(oldValue)} -> ${formatValue(newValue)}`);
  }

  if (!changes.length) {
    return fallback;
  }

  return `${prefix} - ${changes.join(separator)}`;
};

exports.permissionDescription = (oldPerms = [], newPerms = [], username = 'user') => {
  const oldMap = new Map(oldPerms.map((permission) => {
    const normalized = normalizePermission(permission);
    return [normalized.section, normalized];
  }));

  const newMap = new Map(newPerms.map((permission) => {
    const normalized = normalizePermission(permission);
    return [normalized.section, normalized];
  }));

  const sections = Array.from(new Set([
    ...oldMap.keys(),
    ...newMap.keys()
  ])).filter(Boolean).sort();

  const changes = [];

  for (const section of sections) {
    const oldPermission = oldMap.get(section) || normalizePermission({ section });
    const newPermission = newMap.get(section) || normalizePermission({ section });

    for (const [key, label] of Object.entries(PERMISSION_LABELS)) {
      if (Boolean(oldPermission[key]) === Boolean(newPermission[key])) {
        continue;
      }

      changes.push(
        `${section} - ${label}: ${oldPermission[key] ? 'ON' : 'OFF'} -> ${newPermission[key] ? 'ON' : 'OFF'}`
      );
    }
  }

  if (!changes.length) {
    return null;
  }

  return `Updated permissions for ${username || 'user'} - ${changes.join(' | ')}`;
};
