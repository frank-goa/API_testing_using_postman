// scripts/generate_xlsx.js
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const collectionPath = path.join(__dirname, '..', 'API Practice Project (Full with Tests).postman_collection.json');
const outPath = path.join(__dirname, '..', 'Postman_Test_Cases_multisheet.xlsx');

function safeJoinExec(eventArray, listenName) {
  if (!Array.isArray(eventArray)) return undefined;
  const ev = eventArray.find(e => e.listen === listenName);
  if (!ev || !ev.script) return '';
  const exec = ev.script.exec || [];
  return exec.join('\n');
}

function collectItems(items, parentName) {
  const rows = [];

  items.forEach(item => {
    if (item.item && Array.isArray(item.item)) {
      // folder
      rows.push(...collectItems(item.item, item.name || parentName));
      return;
    }

    const name = item.name || '';
    const request = item.request || {};
    const method = request.method || '';
    let url = '';
    if (request.url) {
      if (typeof request.url === 'string') url = request.url;
      else if (request.url.raw) url = request.url.raw;
      else if (request.url.host) url = (request.url.protocol ? request.url.protocol + '://' : '') + (Array.isArray(request.url.host) ? request.url.host.join('.') : request.url.host) + (request.url.path ? '/' + request.url.path.join('/') : '');
    }

    const preReq = safeJoinExec(item.event, 'prerequest');
    const testScript = safeJoinExec(item.event, 'test');

    // Determine expected status from testScript heuristics
    let expectedStatus = '';
    const m = (testScript || '').match(/to.have.status\((\d{3})\)/);
    if (m) expectedStatus = Number(m[1]);

    const notes = [];
    if (url.includes('/auth')) notes.push('Auth');
    if (url.includes('/students')) notes.push('Students');
    if (name.toLowerCase().includes('error') || name.toLowerCase().includes('invalid') || name.toLowerCase().includes('not found')) notes.push('Error case');

    rows.push({
      Collection: parentName || '',
      Name: name,
      Method: method,
      URL: url,
      'Pre-request Script': preReq || '',
      'Test Script': testScript || '',
      'Expected Status': expectedStatus || '',
      Notes: notes.join('; ')
    });
  });

  return rows;
}

function main() {
  if (!fs.existsSync(collectionPath)) {
    console.error('Collection file not found at', collectionPath);
    process.exit(2);
  }

  const raw = fs.readFileSync(collectionPath, 'utf8');
  const coll = JSON.parse(raw);

  const items = coll.item || [];

  // Categorize into sheets
  const authRows = [];
  const studentsRows = [];
  const testsRows = [];
  const otherRows = [];

  const allRows = collectItems(items, coll.info && coll.info.name ? coll.info.name : 'Collection');

  allRows.forEach(r => {
    const url = (r.URL || '').toLowerCase();
    if (url.includes('/auth') || r.Name.toLowerCase().includes('auth')) {
      authRows.push(r);
    } else if (url.includes('/students') || r.Name.toLowerCase().includes('student')) {
      studentsRows.push(r);
    } else {
      testsRows.push(r);
    }
  });

  // Create workbook and sheets
  const wb = xlsx.utils.book_new();
  if (authRows.length) {
    const ws = xlsx.utils.json_to_sheet(authRows);
    xlsx.utils.book_append_sheet(wb, ws, 'Auth');
  }
  if (studentsRows.length) {
    const ws = xlsx.utils.json_to_sheet(studentsRows);
    xlsx.utils.book_append_sheet(wb, ws, 'Students');
  }
  if (testsRows.length) {
    const ws = xlsx.utils.json_to_sheet(testsRows);
    xlsx.utils.book_append_sheet(wb, ws, 'Tests');
  }

  // Save workbook
  xlsx.writeFile(wb, outPath);
  console.log('Wrote', outPath);
}

main();
