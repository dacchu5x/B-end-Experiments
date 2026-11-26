const path = require('path');
const fs = require('fs');

function resolveModule(name) {
  try {
    return require(name);
  } catch (e) {
    const candidates = [
      path.join(__dirname, 'node_modules', name),
      path.join(__dirname, '..', 'exp 3', 'node_modules', name),
      path.join(__dirname, '..', 'ex 3', 'node_modules', name)
    ];
    for (const cand of candidates) {
      try {
        return require(cand);
      } catch (err) {}
    }
    throw e;
  }
}

const express = resolveModule('express');
const cors = resolveModule('cors');


const app = express();
const PORT = process.env.PORT || 3001;
const DATA_FILE = path.join(__dirname, 'data', 'library-customers.json');

function syncToAlterJson(action, customerId, customerData = {}, details = {}) {
  try {
    const alterPath = path.join(__dirname, '..', 'exp 3', 'data', 'alter.json');
    if (!fs.existsSync(alterPath)) return;
    const raw = fs.readFileSync(alterPath, 'utf-8').trim();
    if (!raw) return;
    const alter = JSON.parse(raw);
    const cleanId = String(customerId || '').trim();

    alter.customerUpdates = alter.customerUpdates || {};
    if (action === 'CUSTOMER_DELETED') {
      if (cleanId && alter.customerUpdates[cleanId]) {
        delete alter.customerUpdates[cleanId];
      }
    } else if (cleanId) {
      const prev = alter.customerUpdates[cleanId] || {};
      alter.customerUpdates[cleanId] = {
        customerId: cleanId,
        name: customerData.name || customerData.customerName || prev.name || '',
        phone: customerData.phone || customerData.phoneNumber || prev.phone || '',
        email: customerData.email || customerData.customerEmail || prev.email || '',
        roomWidth: customerData.roomWidth !== undefined ? Number(customerData.roomWidth) : prev.roomWidth,
        roomHeight: customerData.roomHeight !== undefined ? Number(customerData.roomHeight) : prev.roomHeight,
        roomDepth: customerData.roomDepth !== undefined ? Number(customerData.roomDepth) : prev.roomDepth,
        cupboards: customerData.cupboards !== undefined ? Number(customerData.cupboards) : prev.cupboards,
        shelves: customerData.shelves !== undefined ? Number(customerData.shelves) : prev.shelves,
        doorStyle: customerData.doorStyle || prev.doorStyle,
        doorsOpen: customerData.doorsOpen !== undefined ? customerData.doorsOpen : prev.doorsOpen,
        updatedAt: new Date().toISOString(),
        updatedBy: 'customer'
      };
    }

    const dataSnapshot = customerData && typeof customerData === 'object' ? {
      ...(customerData.name ? { name: customerData.name } : {}),
      ...(customerData.email ? { email: customerData.email } : {}),
      ...(customerData.phone || customerData.phoneNumber ? { phone: customerData.phone || customerData.phoneNumber } : {}),
      ...(customerData.roomWidth !== undefined ? { roomWidth: customerData.roomWidth } : {}),
      ...(customerData.roomHeight !== undefined ? { roomHeight: customerData.roomHeight } : {}),
      ...(customerData.roomDepth !== undefined ? { roomDepth: customerData.roomDepth } : {}),
      ...(customerData.cupboards !== undefined ? { cupboards: customerData.cupboards } : {}),
      ...(customerData.shelves !== undefined ? { shelves: customerData.shelves } : {}),
      ...(customerData.doorStyle ? { doorStyle: customerData.doorStyle } : {})
    } : undefined;

    alter.activityLog = alter.activityLog || [];
    alter.activityLog.push({
      timestamp: new Date().toISOString(),
      action,
      customerId: cleanId || null,
      customerName: customerData.name || customerData.customerName || undefined,
      ...(typeof details === 'string' ? { details } : details),
      ...(action !== 'CUSTOMER_OPEN' && dataSnapshot && Object.keys(dataSnapshot).length > 0 ? { data: dataSnapshot } : {})
    });
    if (alter.activityLog.length > 500) {
      alter.activityLog = alter.activityLog.slice(-500);
    }
    const tempFile = `${alterPath}.tmp-${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(alter, null, 2), 'utf-8');
    fs.renameSync(tempFile, alterPath);
  } catch (e) {}
}

// Phone validation module
let PhoneValidation = null;
try {
  PhoneValidation = require('./phoneValidation.js');
} catch (e) {
  PhoneValidation = null;
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve static frontend
app.use(express.static(__dirname));

// ──────────────────────────────────────────────
// Check required data files (NO SILENT CREATION of empty database)
// ──────────────────────────────────────────────
function checkDataFiles() {
  if (!fs.existsSync(DATA_FILE)) {
    console.error(`[ERROR] Main customer data file is MISSING at: ${DATA_FILE}`);
    console.error('[ERROR] Automatic creation of empty array [] is disabled to prevent data loss.');
    console.error('[ERROR] Please ensure library-customers.json exists in EXP 2/data/.');
  } else {
    console.log(`[INFO] Customer database verified at: ${DATA_FILE}`);
  }
}
checkDataFiles();

// ──────────────────────────────────────────────
// Helper: Read & Write customer data
// ──────────────────────────────────────────────
function readCustomers() {
  if (!fs.existsSync(DATA_FILE)) {
    const err = new Error(`Customer data file is missing at: ${DATA_FILE}. It must not be silently created with empty array [].`);
    err.code = 'DATA_FILE_MISSING';
    err.filePath = DATA_FILE;
    throw err;
  }

  let raw = '';
  try {
    raw = fs.readFileSync(DATA_FILE, 'utf-8').trim();
  } catch (readErr) {
    const err = new Error(`Could not read customer data file at ${DATA_FILE}: ${readErr.message}`);
    err.code = 'DATA_FILE_READ_ERROR';
    err.filePath = DATA_FILE;
    throw err;
  }

  if (!raw) {
    const err = new Error(`Customer data file at ${DATA_FILE} is empty.`);
    err.code = 'DATA_FILE_EMPTY';
    err.filePath = DATA_FILE;
    throw err;
  }

  let customers;
  try {
    customers = JSON.parse(raw);
  } catch (parseErr) {
    const err = new Error(`Customer data file at ${DATA_FILE} contains invalid JSON: ${parseErr.message}`);
    err.code = 'DATA_FILE_CORRUPT';
    err.filePath = DATA_FILE;
    // Create backup of corrupt file without overwriting
    try {
      fs.writeFileSync(`${DATA_FILE}.corrupt-${Date.now()}.bak`, raw, 'utf-8');
    } catch (_) {}
    throw err;
  }

  if (!Array.isArray(customers)) {
    const err = new Error(`Customer data file root at ${DATA_FILE} is not a JSON array.`);
    err.code = 'DATA_FILE_INVALID_FORMAT';
    err.filePath = DATA_FILE;
    throw err;
  }

  return customers;
}

function writeCustomers(data) {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const tempFile = `${DATA_FILE}.tmp-${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DATA_FILE);

    // Keep user.json (Experiment 2 report requirement) in sync with customer data
    try {
      const userFile = path.join(dir, 'user.json');
      const tempUserFile = `${userFile}.tmp-${Date.now()}`;
      fs.writeFileSync(tempUserFile, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tempUserFile, userFile);
    } catch (uErr) {}

    return true;
  } catch (err) {
    console.error('Error writing customers file:', err.message);
    return false;
  }
}

function isValidCustomerPhone(value, countryCode, country = '') {
  if (PhoneValidation) {
    const digits = String(value || '').replace(/\D/g, '');
    let iso = country;
    if (!iso && countryCode) {
      const cleanCode = countryCode.startsWith('+') ? countryCode : '+' + countryCode;
      const found = PhoneValidation.COUNTRIES.find(c => c.callingCode === cleanCode);
      if (found) iso = found.iso;
    }
    if (!iso) return false;
    const countryObj = PhoneValidation.getCountryByIso(iso);
    if (!countryObj) return false;
    if (countryCode && countryObj.callingCode !== (countryCode.startsWith('+') ? countryCode : '+' + countryCode)) {
      return false;
    }
    return PhoneValidation.validatePhone(digits, iso);
  }
  const digits = String(value || '').replace(/\D/g, '');
  return digits.length >= 4 && digits.length <= 15;
}

function isValidCustomerEmail(value) {
  return /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)*\.[A-Za-z]{2,}$/.test(value);
}

function validateCustomerData(customer) {
  if (typeof customer.name !== 'string' || customer.name.trim().length < 2) return 'Customer name must be at least 2 characters.';
  if (typeof customer.email !== 'string' || !isValidCustomerEmail(customer.email)) return 'Enter a valid email address (example: name@example.com).';
  if (!isValidCustomerPhone(customer.phone, customer.countryCode, customer.country)) {
    return 'Select a country and enter a valid phone number for that country.';
  }
  if (!Number.isFinite(Number(customer.roomWidth)) || Number(customer.roomWidth) < 900) return 'Width must be at least 900 mm.';
  if (!Number.isFinite(Number(customer.roomHeight)) || Number(customer.roomHeight) < 350 || Number(customer.roomHeight) > 3000) return 'Height must be between 350 and 3000 mm.';
  if (!Number.isFinite(Number(customer.roomDepth)) || Number(customer.roomDepth) < 200 || Number(customer.roomDepth) > 1000) return 'Depth must be between 200 and 1000 mm.';
  if (!Number.isInteger(Number(customer.cupboards)) || Number(customer.cupboards) < 1) return 'Cupboards must be at least 1.';
  if (!Number.isInteger(Number(customer.shelves)) || Number(customer.shelves) < 1 || Number(customer.shelves) > 10) return 'Shelves per unit must be between 1 and 10.';
  if (!['open', 'solid', 'sliding', 'toplift'].includes(customer.doorStyle)) return 'Choose a valid door style.';
  if (!customer.doorsOpen || typeof customer.doorsOpen !== 'object' || Array.isArray(customer.doorsOpen)) return 'Door configuration must be an object.';
  return null;
}

function normalizePhoneFields(value, country = '', countryCode = '') {
  const rawPhone = String(value || '').trim();
  let iso = String(country || '').trim();
  let callingCode = String(countryCode || '').trim();
  let countryRecord = iso && PhoneValidation ? PhoneValidation.getCountryByIso(iso) : null;

  if (!countryRecord && callingCode && PhoneValidation) {
    const normalizedCode = callingCode.startsWith('+') ? callingCode : '+' + callingCode;
    countryRecord = normalizedCode === '+1'
      ? PhoneValidation.getCountryByIso('US')
      : PhoneValidation.COUNTRIES.find(item => item.callingCode === normalizedCode);
  }

  if (!countryRecord && rawPhone.startsWith('+') && PhoneValidation) {
    const matches = PhoneValidation.COUNTRIES.slice().sort((a, b) => b.callingCode.length - a.callingCode.length);
    countryRecord = matches.find(item => rawPhone.startsWith(item.callingCode));
    if (countryRecord && countryRecord.callingCode === '+1') countryRecord = PhoneValidation.getCountryByIso('US');
  }

  if (countryRecord) {
    iso = countryRecord.iso;
    callingCode = countryRecord.callingCode;
  }

  let digits = rawPhone.replace(/\D/g, '');
  if (rawPhone.startsWith('+') && callingCode) {
    const normalizedCode = callingCode.startsWith('+') ? callingCode : '+' + callingCode;
    if (rawPhone.startsWith(normalizedCode)) digits = rawPhone.slice(normalizedCode.length).replace(/\D/g, '');
  }

  return {
    country: iso,
    countryCode: callingCode,
    phone: digits,
    phoneNumber: digits,
    fullPhone: callingCode ? `${callingCode} ${digits}`.trim() : digits
  };
}

function getNextCustomerId(customList) {
  const customers = customList || readCustomers();
  const usedNumbers = new Set();
  (customers || []).forEach(c => {
    if (!c || !c.customerId) return;
    const match = String(c.customerId).match(/(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num >= 1001) {
        usedNumbers.add(num);
      }
    }
  });

  // Start customer numbering from 1001 and always find the lowest unused number
  let candidateNum = 1001;
  while (usedNumbers.has(candidateNum)) {
    candidateNum++;
  }

  let candidate = `CUST-${candidateNum}`;
  while ((customers || []).some(c => c && (
    String(c.customerId || '').toLowerCase() === candidate.toLowerCase() ||
    String(c.customerId || '') === String(candidateNum)
  ))) {
    candidateNum++;
    candidate = `CUST-${candidateNum}`;
  }
  return candidate;
}

function findCustomerIndex(customers, customerId) {
  return customers.findIndex(customer => String(customer.customerId || '').toLowerCase() === customerId.toLowerCase());
}

// ──────────────────────────────────────────────
// REST API Routes
// ──────────────────────────────────────────────

// GET /api/next-customer-id
app.get('/api/next-customer-id', (req, res, next) => {
  try {
    const nextId = getNextCustomerId();
    res.json({ success: true, nextId });
  } catch (err) {
    next(err);
  }
});

// GET /api/customers
app.get('/api/customers', (req, res, next) => {
  try {
    const customers = readCustomers();
    res.json({ success: true, data: customers, count: customers.length });
  } catch (err) {
    next(err);
  }
});

// GET /api/customers/:id
app.get('/api/customers/:id', (req, res, next) => {
  try {
    const customers = readCustomers();
    const customer = customers.find(c => String(c.customerId || '').toLowerCase() === req.params.id.toLowerCase());
    if (!customer) {
      return res.status(404).json({ success: false, message: `Customer "${req.params.id}" not found.` });
    }
    syncToAlterJson('CUSTOMER_OPEN', customer.customerId, customer, { details: `Customer ${customer.customerId} opened configuration on website` });
    res.json({ success: true, data: customer });
  } catch (err) {
    next(err);
  }
});

// POST /api/customers — Create new customer with unique ID enforcement
app.post('/api/customers', (req, res, next) => {
  try {
    const { customerId, name, customerName, country, countryCode, phone, phoneNumber, email, customerEmail, roomWidth, roomHeight, roomDepth, cupboards, shelves, doorStyle, doorsOpen, allowUpdate } = req.body;

    if (!customerId || typeof customerId !== 'string' || !customerId.trim()) {
      return res.status(400).json({ success: false, message: 'Customer ID is required.' });
    }
    const cleanCustomerId = customerId.trim();
    const cleanName = (name || customerName || '').toString().trim();
    const rawPhone = (phone || phoneNumber || req.body.phone_number || '').toString();
    const rawEmail = (email || customerEmail || req.body.customer_email || '').toString();
    const phoneFields = normalizePhoneFields(rawPhone, country || req.body.countryIso || '', countryCode || '');
    const cleanEmail = rawEmail.trim();

    const customers = readCustomers();
    const existingIndex = findCustomerIndex(customers, cleanCustomerId);

    if (existingIndex !== -1 && allowUpdate !== true) {
      const suggestedId = getNextCustomerId(customers);
      return res.status(409).json({
        success: false,
        duplicate: true,
        suggestedId,
        message: `Customer ID "${cleanCustomerId}" already exists! Customer ID must always be different. Try "${suggestedId}".`
      });
    }

    const customerData = {
      ...(existingIndex !== -1 ? customers[existingIndex] : {}),
      customerId: cleanCustomerId,
      name: cleanName,
      ...phoneFields,
      email: cleanEmail,
      roomWidth: Number(roomWidth),
      roomHeight: Number(roomHeight),
      roomDepth: Number(roomDepth),
      cupboards: Number(cupboards),
      shelves: Number(shelves),
      doorStyle: doorStyle || 'solid',
      doorsOpen: doorsOpen || {},
      createdAt: existingIndex !== -1 ? (customers[existingIndex].createdAt || new Date().toISOString()) : new Date().toISOString(),
      ...(existingIndex !== -1 ? { updatedAt: new Date().toISOString() } : {})
    };

    const validationError = validateCustomerData(customerData);
    if (validationError) return res.status(400).json({ success: false, message: validationError });

    if (existingIndex !== -1 && allowUpdate === true) {
      customers[existingIndex] = customerData;
    } else {
      customers.push(customerData);
    }

    if (writeCustomers(customers)) {
      syncToAlterJson(existingIndex !== -1 ? 'CUSTOMER_UPDATE' : 'CUSTOMER_CREATE', cleanCustomerId, customerData, { details: existingIndex !== -1 ? `Customer ${cleanCustomerId} updated data on website` : `Customer ${cleanCustomerId} created on website` });
      res.status(existingIndex !== -1 ? 200 : 201).json({
        success: true,
        message: existingIndex !== -1 ? 'Customer updated successfully.' : 'Customer created successfully.',
        data: customerData
      });
    } else {
      res.status(500).json({ success: false, message: 'Failed to save customer data.' });
    }
  } catch (err) {
    next(err);
  }
});

// PUT /api/customers/:id — Update existing customer
app.put('/api/customers/:id', (req, res, next) => {
  try {
    const customers = readCustomers();
    const index = findCustomerIndex(customers, req.params.id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: `Customer "${req.params.id}" not found.` });
    }

    const current = customers[index];
    const rawPhone = (req.body.phone || req.body.phoneNumber || req.body.phone_number || current.phoneNumber || current.phone || '').toString();
    const phoneFields = normalizePhoneFields(
      rawPhone,
      req.body.country || req.body.countryIso || current.country || '',
      req.body.countryCode || current.countryCode || ''
    );
    const updated = {
      ...current,
      ...req.body,
      customerId: current.customerId,
      name: (req.body.name || req.body.customerName || current.name || current.customerName || '').toString().trim(),
      ...phoneFields,
      email: (req.body.email || req.body.customerEmail || current.email || current.customerEmail || '').toString().trim(),
      roomWidth: Number(req.body.roomWidth ?? current.roomWidth),
      roomHeight: Number(req.body.roomHeight ?? current.roomHeight),
      roomDepth: Number(req.body.roomDepth ?? current.roomDepth),
      cupboards: Number(req.body.cupboards ?? current.cupboards),
      shelves: Number(req.body.shelves ?? current.shelves),
      doorStyle: req.body.doorStyle || current.doorStyle || 'solid',
      doorsOpen: req.body.doorsOpen ?? current.doorsOpen ?? {},
      updatedAt: new Date().toISOString()
    };
    const validationError = validateCustomerData(updated);
    if (validationError) return res.status(400).json({ success: false, message: validationError });
    customers[index] = updated;

    if (writeCustomers(customers)) {
      syncToAlterJson('CUSTOMER_UPDATE', current.customerId, updated, { details: `Customer ${current.customerId} updated data on website` });
      res.json({ success: true, message: 'Customer updated successfully.', data: updated });
    } else {
      res.status(500).json({ success: false, message: 'Failed to update customer data.' });
    }
  } catch (err) {
    next(err);
  }
});

// DELETE /api/customers/:id/design — Clear/delete ONLY the saved design, preserving the customer
app.delete('/api/customers/:id/design', (req, res, next) => {
  try {
    const customers = readCustomers();
    const index = findCustomerIndex(customers, req.params.id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: `Customer "${req.params.id}" not found.` });
    }
    const current = customers[index];
    const updated = {
      ...current,
      roomWidth: 900,
      roomHeight: 350,
      roomDepth: 200,
      cupboards: 1,
      shelves: 1,
      doorStyle: 'solid',
      doorsOpen: {},
      savedDesignDeleted: true,
      updatedAt: new Date().toISOString()
    };
    customers[index] = updated;
    if (writeCustomers(customers)) {
      syncToAlterJson('CUSTOMER_DESIGN_CLEARED', current.customerId, updated, { details: `Customer "${current.customerId}" design cleared on website` });
      res.json({ success: true, message: `Saved design cleared for customer "${current.customerId}". Customer profile preserved.`, data: updated });
    } else {
      res.status(500).json({ success: false, message: 'Failed to update customer data.' });
    }
  } catch (err) {
    next(err);
  }
});

// DELETE /api/customers/:id — Delete a customer
app.delete('/api/customers/:id', (req, res, next) => {
  try {
    const customers = readCustomers();
    const index = findCustomerIndex(customers, req.params.id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: `Customer "${req.params.id}" not found.` });
    }

    const removed = customers.splice(index, 1)[0];
    if (writeCustomers(customers)) {
      syncToAlterJson('CUSTOMER_DELETED', removed.customerId, removed, { details: `Customer "${removed.customerId}" deleted on website` });
      res.json({ success: true, message: `Customer "${req.params.id}" deleted.`, data: removed });
    } else {
      res.status(500).json({ success: false, message: 'Failed to delete customer data.' });
    }
  } catch (err) {
    next(err);
  }
});

// DELETE /api/customers — Delete ALL customers
app.delete('/api/customers', (req, res, next) => {
  try {
    const customers = readCustomers();
    const count = customers.length;
    if (count === 0) {
      return res.status(400).json({ success: false, message: 'No customer data to delete.' });
    }
    if (writeCustomers([])) {
      res.json({ success: true, message: `All ${count} customer(s) deleted.` });
    } else {
      res.status(500).json({ success: false, message: 'Failed to delete customer data.' });
    }
  } catch (err) {
    next(err);
  }
});

// POST /api/customers/import — Import customer records
app.post('/api/customers/import', (req, res, next) => {
  try {
    let importData = null;
    const assignNewIfDuplicate = req.body && (req.body.assignNewIfDuplicate === true || req.body.mode === 'new');
    const allowOverwrite = req.body && req.body.overwrite === true;

    if (Array.isArray(req.body)) {
      importData = req.body;
    } else if (req.body && Array.isArray(req.body.customers)) {
      importData = req.body.customers;
    } else if (req.body && typeof req.body === 'object') {
      const possibleId = req.body.customerId || req.body.customer_id || req.body.id;
      if (possibleId || req.body.roomWidth || req.body.width || req.body.cupboards) {
        importData = [req.body];
      }
    }

    if (!Array.isArray(importData)) {
      return res.status(400).json({ success: false, message: 'Invalid JSON format. Expected an array of customer objects.' });
    }

    const existing = readCustomers();
    const savedRecords = [];
    const seenIds = new Set();
    let imported = 0;

    importData.forEach((raw) => {
      if (!raw || typeof raw !== 'object') return;
      let cid = (raw.customerId || raw.customer_id || raw.id || '').toString().trim();
      if (!cid) cid = getNextCustomerId(existing);

      let cleanId = cid;
      let existingIndex = findCustomerIndex(existing, cleanId);

      if (existingIndex !== -1) {
        if (assignNewIfDuplicate) {
          cleanId = getNextCustomerId(existing);
          existingIndex = -1;
        } else if (!allowOverwrite) {
          return;
        }
      }

      const custName = (raw.name || raw.customerName || '').toString().trim();
      const rawPhone = (raw.phoneNumber || raw.phone || raw.mobile || '').toString().trim();
      const custEmail = (raw.email || raw.customerEmail || '').toString().trim();
      const phoneFields = normalizePhoneFields(rawPhone, raw.country || raw.countryIso || '', raw.countryCode || '');

      let record = {
        customerId: cleanId,
        name: custName,
        ...phoneFields,
        email: custEmail,
        roomWidth: Number(raw.roomWidth || raw.width) || 900,
        roomHeight: Number(raw.roomHeight || raw.height) || 350,
        roomDepth: Number(raw.roomDepth || raw.depth) || 200,
        cupboards: Math.max(1, Number(raw.cupboards || raw.cupboardCount) || 1),
        shelves: Math.max(1, Math.min(10, Number(raw.shelves || raw.shelfCount) || 1)),
        doorStyle: ['open', 'solid', 'sliding', 'toplift'].includes(String(raw.doorStyle).toLowerCase())
          ? String(raw.doorStyle).toLowerCase()
          : 'solid',
        doorsOpen: raw.doorsOpen || {},
        updatedAt: new Date().toISOString()
      };

      if (seenIds.has(cleanId.toLowerCase())) return;
      const validationError = validateCustomerData(record);
      if (validationError) return;

      if (existingIndex !== -1) {
        record = { ...existing[existingIndex], ...record };
        record.createdAt = existing[existingIndex].createdAt || new Date().toISOString();
        existing[existingIndex] = record;
      } else {
        record.createdAt = raw.createdAt || new Date().toISOString();
        existing.push(record);
      }
      seenIds.add(cleanId.toLowerCase());
      savedRecords.push(record);
      imported++;
    });

    if (imported === 0) {
      return res.status(400).json({ success: false, message: 'No valid customer records found in import payload.' });
    }

    if (writeCustomers(existing)) {
      res.json({ success: true, message: `Imported ${imported} customer(s) to library-customers.json.`, count: imported, data: savedRecords });
    } else {
      res.status(500).json({ success: false, message: 'Failed to save customer data.' });
    }
  } catch (err) {
    next(err);
  }
});

// Error handling middleware — NO silent recovery, reports clear path & error
app.use((err, req, res, next) => {
  console.error('[EXP 2 Server Error]:', err.message);
  if (res.headersSent) return next(err);
  if (err.code === 'DATA_FILE_MISSING') {
    return res.status(503).json({
      success: false,
      error: 'DATA_FILE_MISSING',
      message: `Customer database file is missing at: ${err.filePath}. Automatic recreation with empty array [] is disabled to prevent data loss. Please restore the file.`,
      path: err.filePath
    });
  }
  if (err.code === 'DATA_FILE_CORRUPT') {
    return res.status(500).json({
      success: false,
      error: 'DATA_FILE_CORRUPT',
      message: `Customer database file at ${err.filePath} is corrupted and contains invalid JSON. Original file has been backed up.`,
      path: err.filePath
    });
  }
  const statusCode = Number.isInteger(err.status) ? err.status : 500;
  res.status(statusCode).json({
    success: false,
    message: statusCode >= 500 ? (err.message || 'Unable to read or process customer data.') : 'Invalid request body.'
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`\n📚 EXP 2 Library Management Server running at:`);
  console.log(`   ➜ http://localhost:${PORT}`);
  console.log(`   ➜ Customer Data Source: ${DATA_FILE}\n`);
});
