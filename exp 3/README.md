# Experiment 3 — Student & Bookshelf Registration

This ZIP contains **only Experiment 3** as a standalone project.

## Features

- Student registration form (name, USN, phone, department and semester)
- Add and remove purchased-book rows with quantity and price
- Live interactive 3D bookshelf preview
- Configure rack count, shelves per rack and opening style
- Save records to this experiment’s own `students.json` file
- Duplicate USNs are rejected

## Run on Windows / macOS / Linux

1. Install Node.js (LTS).
2. Extract the ZIP and open the `exp 3` folder in VS Code or a terminal.
3. Run:

   ```bash
   npm install
   npm start
   ```

4. Open **http://localhost:3000** in your browser.

Student records are stored locally in `students.json` beside `server.js`. No separate database or companion project is required.
