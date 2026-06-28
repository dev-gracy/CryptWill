/**
 * db.js — sql.js-based drop-in Prisma replacement
 * Fixes Critical Bug #1: Prisma was generated for Windows but server runs on Linux.
 * Pure-JS layer using sql.js (no native binaries). Prisma-compatible API.
 */
'use strict';

const SQL    = require('sql.js');
const fs     = require('fs');
const path   = require('path');
const crypto = require('crypto');

const DB_PATH = path.join(__dirname, '../../prisma/dev.db');

let _db    = null;
let _SQL   = null;
let _dirty = false;

function ensureSchema(db) {
  db.run(`
    CREATE TABLE IF NOT EXISTS "GuardianAccount" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "email" TEXT NOT NULL UNIQUE,
      "passwordHash" TEXT NOT NULL,
      "fullName" TEXT,
      "createdAt" TEXT NOT NULL,
      "updatedAt" TEXT NOT NULL
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS "LawyerTeamMember" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "fullName" TEXT NOT NULL,
      "email" TEXT NOT NULL,
      "role" TEXT NOT NULL DEFAULT 'LAWYER',
      "firmName" TEXT,
      "phone" TEXT,
      "barNumber" TEXT,
      "experience" TEXT,
      "notes" TEXT,
      "status" TEXT NOT NULL DEFAULT 'INVITED',
      "inviteToken" TEXT,
      "createdAt" TEXT NOT NULL,
      "updatedAt" TEXT NOT NULL,
      FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE
    )
  `);
  _dirty = true;

  const lawyerCols = rowsToObjects(db.exec(`PRAGMA table_info("LawyerTeamMember")`));
  if (lawyerCols.length && !lawyerCols.some(c => c.name === 'experience')) {
    db.run(`ALTER TABLE "LawyerTeamMember" ADD COLUMN "experience" TEXT`);
    _dirty = true;
  }
}

async function getDB() {
  if (_db) return _db;
  _SQL = await SQL();
  if (fs.existsSync(DB_PATH)) {
    const buf = fs.readFileSync(DB_PATH);
    _db = new _SQL.Database(buf);
  } else {
    _db = new _SQL.Database();
  }
  ensureSchema(_db);
  setInterval(() => { if (_dirty) { saveDB(); _dirty = false; } }, 3000);
  return _db;
}

function saveDB() {
  if (!_db) return;
  try {
    const data = _db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  } catch (e) {
    console.error('[DB] Save error:', e.message);
  }
}

function execWrite(sql, params = []) {
  _db.run(sql, params);
  _dirty = true;
}

const _colCache = {};
function getColumns(table) {
  if (_colCache[table]) return _colCache[table];
  const res = _db.exec(`PRAGMA table_info("${table}")`);
  if (!res.length) return [];
  _colCache[table] = res[0].values.map(r => ({ name: r[1], type: r[2] }));
  return _colCache[table];
}

function rowsToObjects(result) {
  if (!result || !result.length) return [];
  const cols = result[0].columns;
  return result[0].values.map(row => {
    const obj = {};
    cols.forEach((c, i) => { obj[c] = row[i]; });
    return obj;
  });
}

function parseValue(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === 'boolean') return val ? 1 : 0;
  if (val instanceof Date) return val.toISOString();
  return val;
}

function buildWhere(where, params) {
  if (!where || !Object.keys(where).length) return '1=1';
  const parts = [];
  for (const [key, val] of Object.entries(where)) {
    if (key === 'AND') { parts.push('(' + val.map(s => buildWhere(s, params)).join(' AND ') + ')'); continue; }
    if (key === 'OR')  { parts.push('(' + val.map(s => buildWhere(s, params)).join(' OR ')  + ')'); continue; }
    if (key === 'NOT') { parts.push('NOT (' + buildWhere(val, params) + ')'); continue; }
    if (val !== null && typeof val === 'object' && !(val instanceof Date)) {
      if ('in' in val) {
        if (!val.in || !val.in.length) { parts.push('1=0'); continue; }
        const ph = val.in.map(v => { params.push(parseValue(v)); return '?'; }).join(',');
        parts.push(`"${key}" IN (${ph})`);
      } else if ('notIn' in val) {
        if (!val.notIn || !val.notIn.length) { parts.push('1=1'); continue; }
        const ph = val.notIn.map(v => { params.push(parseValue(v)); return '?'; }).join(',');
        parts.push(`"${key}" NOT IN (${ph})`);
      } else if ('contains' in val) { params.push(`%${val.contains}%`); parts.push(`"${key}" LIKE ?`); }
      else if ('startsWith' in val) { params.push(`${val.startsWith}%`); parts.push(`"${key}" LIKE ?`); }
      else if ('gt'  in val) { params.push(parseValue(val.gt));  parts.push(`"${key}" > ?`); }
      else if ('gte' in val) { params.push(parseValue(val.gte)); parts.push(`"${key}" >= ?`); }
      else if ('lt'  in val) { params.push(parseValue(val.lt));  parts.push(`"${key}" < ?`); }
      else if ('lte' in val) { params.push(parseValue(val.lte)); parts.push(`"${key}" <= ?`); }
      else if ('not' in val) {
        if (val.not === null) { parts.push(`"${key}" IS NOT NULL`); }
        else { params.push(parseValue(val.not)); parts.push(`"${key}" != ?`); }
      } else {
        // Compound unique key e.g. { assetId_beneficiaryId: { assetId, beneficiaryId } }
        for (const [sk, sv] of Object.entries(val)) {
          params.push(parseValue(sv)); parts.push(`"${sk}" = ?`);
        }
      }
    } else if (val === null) {
      parts.push(`"${key}" IS NULL`);
    } else {
      params.push(parseValue(val)); parts.push(`"${key}" = ?`);
    }
  }
  return parts.length ? parts.join(' AND ') : '1=1';
}

function buildOrderBy(orderBy) {
  if (!orderBy) return '';
  const items = Array.isArray(orderBy) ? orderBy : [orderBy];
  const parts = items.map(item => {
    const [col, dir] = Object.entries(item)[0];
    return `"${col}" ${dir.toUpperCase()}`;
  });
  return parts.length ? `ORDER BY ${parts.join(', ')}` : '';
}

function castRow(row) {
  const BOOL_COLS = new Set(['isActive','isVerified','isOnboarded','isEncrypted']);
  const out = {};
  for (const [k, v] of Object.entries(row)) {
    if (v === null || v === undefined) { out[k] = null; continue; }
    if (BOOL_COLS.has(k) || k.startsWith('is')) {
      out[k] = v === 1 || v === true || v === '1';
    } else if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v)) {
      out[k] = new Date(v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

function applySelect(row, select) {
  if (!select) return row;
  const out = {};
  for (const [k, v] of Object.entries(select)) {
    if (v && k in row) out[k] = row[k];
  }
  return out;
}

const RELATIONS = {
  User: {
    assets: { table:'Asset', fk:'userId', type:'many' },
    beneficiaries: { table:'Beneficiary', fk:'userId', type:'many' },
    guardians: { table:'Guardian', fk:'userId', type:'many' },
    contract: { table:'Contract', fk:'userId', type:'one', selfFk:'id' },
    vaultFiles: { table:'VaultFile', fk:'userId', type:'many' },
    notifications: { table:'Notification', fk:'userId', type:'many' },
    subscription: { table:'Subscription', fk:'userId', type:'one', selfFk:'id' },
    checkIns: { table:'CheckIn', fk:'userId', type:'many' },
    termsAcceptances: { table:'TermsAcceptance', fk:'userId', type:'many' },
    rulebook: { table:'UserRulebook', fk:'userId', type:'one', selfFk:'id' },
    lawyerTeam: { table:'LawyerTeamMember', fk:'userId', type:'many' },
  },
  Asset: {
    user: { table:'User', fk:'id', type:'one', selfFk:'userId' },
    assignments: { table:'AssetBeneficiaryAssignment', fk:'assetId', type:'many' },
    vaultFiles: { table:'VaultFile', fk:'assetId', type:'many' },
  },
  Beneficiary: {
    user: { table:'User', fk:'id', type:'one', selfFk:'userId' },
    assignments: { table:'AssetBeneficiaryAssignment', fk:'beneficiaryId', type:'many' },
    vaultFiles: { table:'VaultFile', fk:'assignedBeneficiaryId', type:'many' },
  },
  Guardian: {
    user: { table:'User', fk:'id', type:'one', selfFk:'userId' },
    votes: { table:'GuardianVote', fk:'guardianId', type:'many' },
  },
  GuardianVote: {
    contract: { table:'Contract', fk:'id', type:'one', selfFk:'contractId' },
    guardian: { table:'Guardian', fk:'id', type:'one', selfFk:'guardianId' },
  },
  Contract: {
    user: { table:'User', fk:'id', type:'one', selfFk:'userId' },
    checkIns: { table:'CheckIn', fk:'contractId', type:'many' },
    votes: { table:'GuardianVote', fk:'contractId', type:'many' },
  },
  CheckIn: {
    contract: { table:'Contract', fk:'id', type:'one', selfFk:'contractId' },
    user: { table:'User', fk:'id', type:'one', selfFk:'userId' },
  },
  VaultFile: {
    user: { table:'User', fk:'id', type:'one', selfFk:'userId' },
    asset: { table:'Asset', fk:'id', type:'one', selfFk:'assetId' },
    beneficiary: { table:'Beneficiary', fk:'id', type:'one', selfFk:'assignedBeneficiaryId' },
  },
  AssetBeneficiaryAssignment: {
    asset: { table:'Asset', fk:'id', type:'one', selfFk:'assetId' },
    beneficiary: { table:'Beneficiary', fk:'id', type:'one', selfFk:'beneficiaryId' },
  },
  Subscription: { user: { table:'User', fk:'id', type:'one', selfFk:'userId' } },
  Notification: { user: { table:'User', fk:'id', type:'one', selfFk:'userId' } },
  TermsAcceptance: { user: { table:'User', fk:'id', type:'one', selfFk:'userId' } },
  UserRulebook: { user: { table:'User', fk:'id', type:'one', selfFk:'userId' } },
  LawyerTeamMember: { user: { table:'User', fk:'id', type:'one', selfFk:'userId' } },
};

async function resolveIncludes(table, rows, include) {
  if (!include || !rows.length) return rows;
  const relDefs = RELATIONS[table] || {};
  for (const [relName, relOpts] of Object.entries(include)) {
    const relDef = relDefs[relName];
    if (!relDef) continue;
    const nested  = typeof relOpts === 'object' && relOpts !== true ? relOpts.include  : null;
    const wNested = typeof relOpts === 'object' && relOpts !== true ? relOpts.where    : null;
    const oNested = typeof relOpts === 'object' && relOpts !== true ? relOpts.orderBy  : null;
    const sNested = typeof relOpts === 'object' && relOpts !== true ? relOpts.select   : null;
    const tNested = typeof relOpts === 'object' && relOpts !== true ? relOpts.take     : null;
    const db = await getDB();

    if (relDef.type === 'many') {
      const parentIds = [...new Set(rows.map(r => r['id']).filter(Boolean))];
      if (!parentIds.length) { rows.forEach(r => { r[relName] = []; }); continue; }
      const params = [];
      let sql = `SELECT * FROM "${relDef.table}" WHERE "${relDef.fk}" IN (${parentIds.map(() => '?').join(',')})`;
      params.push(...parentIds.map(parseValue));
      if (wNested) { const wp = []; sql += ` AND (${buildWhere(wNested, wp)})`; params.push(...wp); }
      if (oNested) sql += ' ' + buildOrderBy(oNested);
      if (tNested) sql += ` LIMIT ${tNested}`;
      let childs = rowsToObjects(db.exec(sql, params)).map(castRow);
      if (nested)  childs = await resolveIncludes(relDef.table, childs, nested);
      if (sNested) childs = childs.map(r => applySelect(r, sNested));
      const byP = {};
      childs.forEach(r => { const pid = r[relDef.fk]; if (!byP[pid]) byP[pid]=[]; byP[pid].push(r); });
      rows.forEach(r => { r[relName] = byP[r['id']] || []; });
    } else {
      for (const row of rows) {
        const selfFk = relDef.selfFk;
        const fv = row[selfFk];
        if (fv === null || fv === undefined) { row[relName] = null; continue; }
        const lookupCol = relDef.fk;
        const res = db.exec(`SELECT * FROM "${relDef.table}" WHERE "${lookupCol}" = ? LIMIT 1`, [parseValue(fv)]);
        let rel = rowsToObjects(res).map(castRow)[0] || null;
        if (rel && nested)  [rel] = await resolveIncludes(relDef.table, [rel], nested);
        if (rel && sNested) rel = applySelect(rel, sNested);
        row[relName] = rel;
      }
    }
  }
  return rows;
}

function model(tableName) {
  return {
    async findMany({ where, include, orderBy, select, take, skip } = {}) {
      const db = await getDB();
      const params = [];
      let sql = `SELECT * FROM "${tableName}" WHERE ${buildWhere(where, params)} ${buildOrderBy(orderBy)}`;
      if (skip) sql += ` OFFSET ${parseInt(skip)}`;
      if (take) sql += ` LIMIT ${parseInt(take)}`;
      let rows = rowsToObjects(db.exec(sql, params)).map(castRow);
      if (include) rows = await resolveIncludes(tableName, rows, include);
      if (select)  rows = rows.map(r => applySelect(r, select));
      return rows;
    },

    async findUnique({ where, include, select } = {}) {
      const db = await getDB();
      const params = [];
      const res = db.exec(`SELECT * FROM "${tableName}" WHERE ${buildWhere(where, params)} LIMIT 1`, params);
      let rows = rowsToObjects(res).map(castRow);
      if (!rows.length) return null;
      if (include) rows = await resolveIncludes(tableName, rows, include);
      return select ? applySelect(rows[0], select) : rows[0];
    },

    async findFirst({ where, include, orderBy, select } = {}) {
      const db = await getDB();
      const params = [];
      const res = db.exec(`SELECT * FROM "${tableName}" WHERE ${buildWhere(where, params)} ${buildOrderBy(orderBy)} LIMIT 1`, params);
      let rows = rowsToObjects(res).map(castRow);
      if (!rows.length) return null;
      if (include) rows = await resolveIncludes(tableName, rows, include);
      return select ? applySelect(rows[0], select) : rows[0];
    },

    async create({ data, include, select } = {}) {
      const db = await getDB();
      const cols = getColumns(tableName).map(c => c.name);
      const insertData = { ...data };
      if (!insertData.id && cols.includes('id')) insertData.id = crypto.randomUUID();
      const now = new Date().toISOString();
      if (cols.includes('createdAt') && !insertData.createdAt) insertData.createdAt = now;
      if (cols.includes('updatedAt') && !insertData.updatedAt) insertData.updatedAt = now;

      const nestedCreates = {};
      for (const [k, v] of Object.entries(insertData)) {
        if (v && typeof v === 'object' && !(v instanceof Date) && 'create' in v) {
          nestedCreates[k] = v.create; delete insertData[k];
        }
      }

      const keys = Object.keys(insertData).filter(k => cols.includes(k));
      const vals = keys.map(k => parseValue(insertData[k]));
      if (!keys.length) throw new Error(`No valid columns for INSERT into ${tableName}`);
      execWrite(`INSERT INTO "${tableName}" (${keys.map(k=>`"${k}"`).join(',')}) VALUES (${keys.map(()=>'?').join(',')})`, vals);

      for (const [relName, cd] of Object.entries(nestedCreates)) {
        const relDef = (RELATIONS[tableName] || {})[relName];
        if (!relDef) continue;
        const items = Array.isArray(cd) ? cd : [cd];
        for (const item of items) await model(relDef.table).create({ data: { ...item, [relDef.fk]: insertData.id } });
      }

      let rows = rowsToObjects(db.exec(`SELECT * FROM "${tableName}" WHERE id = ?`, [insertData.id])).map(castRow);
      if (include) rows = await resolveIncludes(tableName, rows, include);
      return select ? applySelect(rows[0], select) : rows[0];
    },

    async update({ where, data, include, select } = {}) {
      const db = await getDB();
      const cols = getColumns(tableName).map(c => c.name);
      const updateData = { ...data };

      for (const k of Object.keys(updateData)) {
        const v = updateData[k];
        if (v && typeof v === 'object' && !(v instanceof Date)) {
          if ('set' in v) { updateData[k] = v.set; }
          else if ('increment' in v) { const cur = await this.findFirst({ where }); updateData[k] = (cur?.[k] || 0) + v.increment; }
          else if ('decrement' in v) { const cur = await this.findFirst({ where }); updateData[k] = (cur?.[k] || 0) - v.decrement; }
          else delete updateData[k];
        }
      }

      if (cols.includes('updatedAt')) updateData.updatedAt = new Date().toISOString();
      const keys = Object.keys(updateData).filter(k => cols.includes(k));
      if (!keys.length) return await this.findFirst({ where, include, select });

      const wParams = [];
      execWrite(`UPDATE "${tableName}" SET ${keys.map(k=>`"${k}" = ?`).join(', ')} WHERE ${buildWhere(where, wParams)}`,
        [...keys.map(k => parseValue(updateData[k])), ...wParams]);
      saveDB();
      return await this.findFirst({ where, include, select });
    },

    async updateMany({ where, data } = {}) {
      const db = await getDB();
      const cols = getColumns(tableName).map(c => c.name);
      const updateData = { ...data };
      if (cols.includes('updatedAt')) updateData.updatedAt = new Date().toISOString();
      const keys = Object.keys(updateData).filter(k => cols.includes(k));
      if (!keys.length) return { count: 0 };
      const wParams = [];
      execWrite(`UPDATE "${tableName}" SET ${keys.map(k=>`"${k}" = ?`).join(', ')} WHERE ${buildWhere(where, wParams)}`,
        [...keys.map(k => parseValue(updateData[k])), ...wParams]);
      saveDB();
      return { count: db.getRowsModified() };
    },

    async upsert({ where, create, update, include, select } = {}) {
      const existing = await this.findFirst({ where });
      if (existing) return await this.update({ where, data: update, include, select });
      return await this.create({ data: create, include, select });
    },

    async delete({ where } = {}) {
      const row = await this.findFirst({ where });
      if (!row) return null;
      const params = [];
      execWrite(`DELETE FROM "${tableName}" WHERE ${buildWhere(where, params)}`, params);
      saveDB();
      return row;
    },

    async deleteMany({ where } = {}) {
      const db = await getDB();
      const params = [];
      execWrite(`DELETE FROM "${tableName}" WHERE ${buildWhere(where, params)}`, params);
      saveDB();
      return { count: db.getRowsModified() };
    },

    async count({ where } = {}) {
      const db = await getDB();
      const params = [];
      const res = db.exec(`SELECT COUNT(*) FROM "${tableName}" WHERE ${buildWhere(where, params)}`, params);
      return res[0]?.values?.[0]?.[0] || 0;
    },
  };
}

// Eager init
getDB().then(() => console.log('[DB] sql.js ready:', DB_PATH)).catch(err => console.error('[DB] Init failed:', err.message));

const prisma = {
  user: model('User'),
  asset: model('Asset'),
  beneficiary: model('Beneficiary'),
  assetBeneficiaryAssignment: model('AssetBeneficiaryAssignment'),
  guardianAccount: model('GuardianAccount'),
  guardian: model('Guardian'),
  guardianVote: model('GuardianVote'),
  contract: model('Contract'),
  checkIn: model('CheckIn'),
  vaultFile: model('VaultFile'),
  subscription: model('Subscription'),
  notification: model('Notification'),
  termsAcceptance: model('TermsAcceptance'),
  userRulebook: model('UserRulebook'),
  lawyerTeamMember: model('LawyerTeamMember'),
  $disconnect: async () => { if (_dirty) saveDB(); },
  $connect: async () => { await getDB(); },
};

module.exports = prisma;
