const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const EXP2_DIR = path.join(__dirname, 'Experiment-2');
const EXP4_DIR = path.join(__dirname, 'Experiment-4');
const DATA_FILE = path.join(EXP2_DIR, 'students.json');
const STATUSES = ['Active', 'Inactive', 'On Hold'];

app.use(express.json({ limit: '1mb' }));
app.use('/experiment2', express.static(EXP2_DIR));
app.use('/experiment4', express.static(EXP4_DIR));

function readStudents() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8').trim();
    const students = raw ? JSON.parse(raw) : [];
    return students.map(student => ({
      ...student,
      status: STATUSES.includes(student.status) ? student.status : 'Active'
    }));
  } catch (error) {
    if (error.code === 'ENOENT') {
      fs.mkdirSync(EXP2_DIR, { recursive: true });
      fs.writeFileSync(DATA_FILE, '[]\n');
      return [];
    }
    throw error;
  }
}

function writeStudents(students) {
  const temp = DATA_FILE + '.tmp';
  fs.writeFileSync(temp, JSON.stringify(students, null, 2) + '\n');
  fs.renameSync(temp, DATA_FILE);
}

const fail = (res, message, status = 400) => res.status(status).json({ message });
const findStudentIndex = (students, usn) =>
  students.findIndex(student => String(student.usn).toUpperCase() === String(usn).toUpperCase());

function validateEditableFields(body) {
  const studentName = String(body.studentName || '').trim();
  const department = String(body.department || '').trim();
  const semester = Number(body.semester);
  const phone = String(body.phone || '').trim();
  const racks = Number(body.racks);
  const shelves = Number(body.shelves);
  const openingStyle = String(body.openingStyle || '').trim();

  if (!studentName || !department || !phone || !openingStyle) {
    return { error: 'Please complete all required fields.' };
  }
  if (!Number.isInteger(semester) || semester < 1 || semester > 12) {
    return { error: 'Semester must be between 1 and 12.' };
  }
  if (!/^[0-9+\-\s]{7,15}$/.test(phone)) {
    return { error: 'Enter a valid phone number.' };
  }
  if (!Number.isInteger(racks) || racks < 1 || racks > 8) {
    return { error: 'Rack count must be between 1 and 8.' };
  }
  if (!Number.isInteger(shelves) || shelves < 1 || shelves > 8) {
    return { error: 'Shelf count must be between 1 and 8.' };
  }
  if (!['Side Opening', 'Top Opening', 'Sliding Doors', 'Open Shelves'].includes(openingStyle)) {
    return { error: 'Choose a valid bookshelf opening style.' };
  }
  return {
    value: { studentName, department, semester, phone, racks, shelves, openingStyle }
  };
}

app.get('/', (_req, res) => res.redirect('/experiment4/'));

app.get('/api/students', (_req, res) => {
  try { res.json(readStudents()); }
  catch { fail(res, 'Could not read Experiment 2 student JSON file.', 500); }
});

app.post('/api/students', (req, res) => {
  const body = req.body || {};
  const usn = String(body.usn || '').trim().toUpperCase();
  const books = Array.isArray(body.books) ? body.books : [];
  const checked = validateEditableFields(body);

  if (!usn) return fail(res, 'USN is required.');
  if (checked.error) return fail(res, checked.error);

  const cleanBooks = books.map(book => ({
    bookName: String(book.bookName || '').trim(),
    quantity: Number(book.quantity || 1),
    price: Number(book.price || 0)
  })).filter(book => book.bookName);

  if (cleanBooks.some(book => !Number.isInteger(book.quantity) || book.quantity < 1 || !Number.isFinite(book.price) || book.price < 0)) {
    return fail(res, 'Check the quantity and price for each purchased book.');
  }

  try {
    const students = readStudents();
    if (findStudentIndex(students, usn) !== -1) {
      return fail(res, `A student with USN ${usn} is already saved.`, 409);
    }
    const now = new Date().toISOString();
    const record = {
      usn,
      ...checked.value,
      booksPurchased: cleanBooks,
      bookshelf: {
        racks: checked.value.racks,
        shelves: checked.value.shelves,
        openingStyle: checked.value.openingStyle
      },
      status: 'Active',
      createdAt: now,
      updatedAt: now
    };
    delete record.racks;
    delete record.shelves;
    delete record.openingStyle;
    students.push(record);
    writeStudents(students);
    res.status(201).json({ message: 'Student saved to Experiment 2 successfully.', record });
  } catch {
    fail(res, 'Could not save the student to Experiment 2 JSON storage.', 500);
  }
});

// Update a student's editable registration and bookshelf details.
app.put('/api/students/:usn', (req, res) => {
  try {
    const students = readStudents();
    const index = findStudentIndex(students, req.params.usn);
    if (index === -1) return fail(res, 'Student record not found.', 404);

    const checked = validateEditableFields(req.body || {});
    if (checked.error) return fail(res, checked.error);

    const current = students[index];
    students[index] = {
      ...current,
      studentName: checked.value.studentName,
      department: checked.value.department,
      semester: checked.value.semester,
      phone: checked.value.phone,
      bookshelf: {
        ...(current.bookshelf || {}),
        racks: checked.value.racks,
        shelves: checked.value.shelves,
        openingStyle: checked.value.openingStyle
      },
      updatedAt: new Date().toISOString()
    };
    writeStudents(students);
    res.json({ message: 'Student details updated successfully.', record: students[index] });
  } catch {
    fail(res, 'Could not update the student record.', 500);
  }
});

// Change only the student's status from the Experiment 2 dashboard.
app.patch('/api/students/:usn/status', (req, res) => {
  const status = String((req.body || {}).status || '');
  if (!STATUSES.includes(status)) return fail(res, 'Choose Active, Inactive or On Hold.');

  try {
    const students = readStudents();
    const index = findStudentIndex(students, req.params.usn);
    if (index === -1) return fail(res, 'Student record not found.', 404);
    students[index] = { ...students[index], status, updatedAt: new Date().toISOString() };
    writeStudents(students);
    res.json({ message: 'Student status updated.', record: students[index] });
  } catch {
    fail(res, 'Could not update student status.', 500);
  }
});

app.get('/api/health', (_req, res) => res.json({
  status: 'ok',
  storage: 'Experiment-2/students.json',
  registration: 'Experiment-4'
}));

app.listen(PORT, () => {
  console.log(`Library Bookshelf Experiments running at http://localhost:${PORT}`);
  console.log(`Experiment 4 registration: http://localhost:${PORT}/experiment4/`);
  console.log(`Experiment 2 records:      http://localhost:${PORT}/experiment2/`);
  console.log(`Shared storage file: ${DATA_FILE}`);
});
