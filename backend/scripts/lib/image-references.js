// scripts/lib/image-references.js -- finds and rewrites image URLs stored in the database.
//
// Uploaded images are referenced as ".../files/<name>" inside many kinds of columns (single
// text columns, text lists such as Business.gallery, JSON). Instead of hard-coding which
// columns hold images, this looks at EVERY text, list and JSON column, so a reference cannot
// be missed, and works only with the "/files/<name>" part so the host name does not matter.

const FILE_PATTERN = /\/files\/([A-Za-z0-9._-]+)/g;
// Columns that hold secrets or tokens, never image URLs: skip them.
const SKIP_FIELDS = new Set(['passwordHash', 'resetToken', 'verifyToken']);

const delegateName = (modelName) => modelName.charAt(0).toLowerCase() + modelName.slice(1);

/** Models that have an id, with the columns that could contain an image URL. */
function candidateModels(models) {
  return models
    .map((model) => ({
      name: model.name,
      idField: model.fields.find((f) => f.isId)?.name,
      fields: model.fields
        .filter((f) => f.kind === 'scalar' && (f.type === 'String' || f.type === 'Json') && !f.isId && !SKIP_FIELDS.has(f.name))
        .map((f) => f.name),
    }))
    .filter((model) => model.idField && model.fields.length);
}

/** Reads every candidate column of every row, once. */
async function loadRows(prisma, models) {
  const loaded = [];
  for (const model of candidateModels(models)) {
    const select = { [model.idField]: true };
    for (const field of model.fields) select[field] = true;
    const rows = await prisma[delegateName(model.name)].findMany({ select });
    loaded.push({ ...model, rows });
  }
  return loaded;
}

/** The set of upload file names (like "abc.png") that any column mentions. */
function referencedFiles(loaded) {
  const names = new Set();
  for (const model of loaded) {
    for (const row of model.rows) {
      for (const field of model.fields) {
        const value = row[field];
        if (value === null || value === undefined) continue;
        const text = typeof value === 'string' ? value : JSON.stringify(value);
        for (const match of text.matchAll(FILE_PATTERN)) names.add(match[1]);
      }
    }
  }
  return names;
}

/** Replaces old file names with new ones inside one stored value (string, list or JSON). */
function rewriteValue(value, replacements) {
  const swap = (text) => {
    let out = text;
    for (const [from, to] of replacements) out = out.split(from).join(to);
    return out;
  };
  if (typeof value === 'string') return swap(value);
  if (Array.isArray(value) && value.every((item) => typeof item === 'string')) return value.map(swap);
  if (value && typeof value === 'object') return JSON.parse(swap(JSON.stringify(value)));
  return value;
}

/**
 * What would change? replacements = [["/files/a.png", "/files/a.webp"], ...].
 * Returns the row updates, plus how many rows change in each column (for the report).
 */
function planChanges(loaded, replacements) {
  const updates = [];
  const perColumn = {};
  for (const model of loaded) {
    for (const row of model.rows) {
      const data = {};
      for (const field of model.fields) {
        const before = row[field];
        if (before === null || before === undefined) continue;
        const after = rewriteValue(before, replacements);
        if (JSON.stringify(after) !== JSON.stringify(before)) {
          data[field] = after;
          const key = `${model.name}.${field}`;
          perColumn[key] = (perColumn[key] || 0) + 1;
        }
      }
      if (Object.keys(data).length) {
        updates.push({ model: model.name, idField: model.idField, id: row[model.idField], data });
      }
    }
  }
  return { updates, perColumn };
}

/** Writes all the row updates in ONE transaction: either every row changes or none does. */
async function applyChanges(prisma, updates) {
  if (!updates.length) return;
  await prisma.$transaction(
    updates.map((u) => prisma[delegateName(u.model)].update({ where: { [u.idField]: u.id }, data: u.data })),
  );
}

module.exports = { candidateModels, loadRows, referencedFiles, rewriteValue, planChanges, applyChanges };
