const fs = require('fs');
const path = require('path');

const ngoSqlPath = path.join(__dirname, '..', 'sources and data', 'prajapulse_ngo_dataset_1000.sql');
const citSqlPath = path.join(__dirname, '..', 'sources and data', 'prajapulse_citizen_dataset_1000.sql');

const ngoSql = fs.readFileSync(ngoSqlPath, 'utf8');
const citSql = fs.readFileSync(citSqlPath, 'utf8');

function extractTableRows(sql, tableName) {
  const marker = 'INSERT INTO `' + tableName + '`';
  const start = sql.indexOf(marker);
  if (start === -1) return [];

  const valuesIdx = sql.indexOf('VALUES', start);
  if (valuesIdx === -1) return [];

  const semicolonIdx = sql.indexOf(';\n', valuesIdx);
  if (semicolonIdx === -1) return [];

  const valuesPart = sql.substring(valuesIdx + 6, semicolonIdx).trim();

  // Custom parser
  const rows = [];
  let inString = false;
  let strChar = '';
  let parenDepth = 0;
  let currentTuple = '';

  for (let i = 0; i < valuesPart.length; i++) {
    const c = valuesPart[i];
    if (inString) {
      if (c === '\\') {
        currentTuple += c + valuesPart[++i];
        continue;
      }
      if (c === strChar) {
        inString = false;
      }
      currentTuple += c;
    } else {
      if (c === "'" || c === '"') {
        inString = true;
        strChar = c;
        currentTuple += c;
      } else if (c === '(') {
        parenDepth++;
        if (parenDepth === 1) {
          currentTuple = '';
          continue;
        }
        currentTuple += c;
      } else if (c === ')') {
        parenDepth--;
        if (parenDepth === 0) {
          rows.push(parseTuple(currentTuple));
          currentTuple = '';
          continue;
        }
        currentTuple += c;
      } else {
        if (parenDepth > 0) {
          currentTuple += c;
        }
      }
    }
  }

  return rows;
}

function parseTuple(str) {
  const items = [];
  let inStr = false;
  let sChar = '';
  let cur = '';

  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    if (inStr) {
      if (c === '\\') {
        cur += str[++i];
        continue;
      }
      if (c === sChar) {
        inStr = false;
      } else {
        cur += c;
      }
    } else {
      if (c === "'" || c === '"') {
        inStr = true;
        sChar = c;
      } else if (c === ',') {
        items.push(cur.trim());
        cur = '';
      } else {
        cur += c;
      }
    }
  }
  items.push(cur.trim());
  return items;
}

const orgs = extractTableRows(ngoSql, 'organizations');
console.log('Organizations:', orgs.length, 'Sample:', orgs[0] ? orgs[0][1] : null);

const issues = extractTableRows(ngoSql, 'civic_issues');
console.log('Civic Issues:', issues.length, 'Sample:', issues[0] ? issues[0][1] : null);

const campaigns = extractTableRows(ngoSql, 'campaigns');
console.log('Campaigns:', campaigns.length, 'Sample:', campaigns[0] ? campaigns[0][2] : null);

const citizens = extractTableRows(citSql, 'citizen_profiles');
console.log('Citizens:', citizens.length, 'Sample:', citizens[0] ? citizens[0][1] : null);

const interactions = extractTableRows(citSql, 'issue_interactions');
console.log('Interactions:', interactions.length, 'Sample:', interactions[0] ? interactions[0][4] : null);

const cleanups = extractTableRows(citSql, 'cleanup_events');
console.log('Cleanup Events:', cleanups.length, 'Sample:', cleanups[0] ? cleanups[0][4] : null);
