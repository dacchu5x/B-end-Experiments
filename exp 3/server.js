const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const DATA_FILE = path.join(__dirname, 'students.json');

app.use(express.json({ limit: '1mb' }));
app.use(express.static(PUBLIC_DIR));

function readStudents() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8').trim();
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    if (error.code === 'ENOENT') {
      fs.writeFileSync(DATA_FILE, '[]\n');
      return [];
    }
    throw error;
  }
}

function writeStudents(students) {
  // Atomic replacement helps prevent a partially written JSON file.
  const temp = DATA_FILE + '.tmp';
  fs.writeFileSync(temp, JSON.stringify(students, null, 2) + '\n');
  fs.renameSync(temp, DATA_FILE);
}

const fail = (res, message, status = 400) => res.status(status).json({ message });

app.get('/api/health', (_req, res) => res.json({
  status: 'ok',
  storage: 'Experiment 3 / students.json',
  experiment: 3
}));

app.get('/api/students', (_req, res) => {
  try {
    res.json(readStudents());
  } catch (error) {
    console.error('Could not read Experiment 3 student records:', error);
    fail(res, 'Could not read Experiment 3 student records.', 500);
  }
});

app.post('/api/students', (req, res) => {
  const body = req.body || {};
  const usn = String(body.usn || '').trim().toUpperCase();
  const studentName = String(body.studentName || '').trim();
  const department = String(body.department || '').trim();
  const semester = Number(body.semester);
  const phone = String(body.phone || '').trim();
  const racks = Number(body.racks);
  const shelves = Number(body.shelves);
  const openingStyle = String(body.openingStyle || '').trim();
  const books = Array.isArray(body.books) ? body.books : [];

  if (!usn || !studentName || !department || !phone || !openingStyle) {
    return fail(res, 'Please complete all required student and bookshelf fields.');
  }
  if (!Number.isInteger(semester) || semester < 1 || semester > 12) {
    return fail(res, 'Semester must be between 1 and 12.');
  }
  if (!/^[0-9+\-\s]{7,15}$/.test(phone)) {
    return fail(res, 'Enter a valid phone number.');
  }
  if (!Number.isInteger(racks) || racks < 1 || racks > 8) {
    return fail(res, 'Rack count must be between 1 and 8.');
  }
  if (!Number.isInteger(shelves) || shelves < 1 || shelves > 8) {
    return fail(res, 'Shelf count must be between 1 and 8.');
  }
  if (!['Side Opening', 'Top Opening', 'Sliding Doors', 'Open Shelves'].includes(openingStyle)) {
    return fail(res, 'Choose a valid bookshelf opening style.');
  }

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
    if (students.some(student => String(student.usn).toUpperCase() === usn)) {
      return fail(res, `A student with USN ${usn} is already saved.`, 409);
    }

    const record = {
      usn,
      studentName,
      department,
      semester,
      phone,
      booksPurchased: cleanBooks,
      bookshelf: { racks, shelves, openingStyle },
      createdAt: new Date().toISOString()
    };

    students.push(record);
    writeStudents(students);
    res.status(201).json({ message: 'Student saved to Experiment 3 successfully.', record });
  } catch (error) {
    console.error('Could not save Experiment 3 student record:', error);
    fail(res, 'Could not save the student to Experiment 3 JSON storage.', 500);
  }
});

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Experiment 3 is running at http://localhost:${PORT}`);
  console.log(`Student records are stored in: ${DATA_FILE}`);
});
