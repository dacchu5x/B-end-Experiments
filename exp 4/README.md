# BookNest — Connected Library Experiments

This project contains two connected web interfaces powered by one Express server.

## Experiment 4 — Student registration
Open `http://localhost:3000/experiment4/`.

- Register a student with name, USN, phone, department and semester.
- Add purchased books with quantity and price.
- Configure rack count, shelves per rack and opening style.
- Preview the bookshelf live. Click or drag the doors to open/close them.
- Save the registration to the shared Experiment 2 JSON file.

## Experiment 2 — Student management dashboard
Open `http://localhost:3000/experiment2/`.

- View all students registered through Experiment 4.
- See total, active, on-hold and inactive student counts.
- Search student records and filter by status.
- Edit student name, phone, department, semester and bookshelf settings.
- Change a student's status to Active, On Hold or Inactive.
- View the live contents of `Experiment-2/students.json`.

## How the connection works

Both pages use the same Express API. Experiment 4 sends a `POST /api/students` request. The server validates the details and saves the record in `Experiment-2/students.json`. Experiment 2 reads that same file and can update records through the edit and status controls.

The USN is unique: a duplicate USN is rejected.

## Run the project

1. Install Node.js (LTS).
2. Extract the ZIP.
3. Open the `Library_Bookshelf_Experiments` folder in VS Code or PowerShell.
4. Run:

   ```bash
   npm install
   npm start
   ```

5. Open:
   - Experiment 4: http://localhost:3000/experiment4/
   - Experiment 2: http://localhost:3000/experiment2/

Stop the server with `Ctrl + C`.

## Folder structure

```text
Library_Bookshelf_Experiments/
├── Experiment-2/
│   ├── index.html
│   ├── style.css
│   ├── app.js
│   └── students.json
├── Experiment-4/
│   ├── index.html
│   ├── style.css
│   ├── app.js
│   ├── cupboard3d.js
│   └── cupboard3d.css
├── server.js
├── package.json
└── Start Project.bat
```

## Notes

- Keep both Experiment folders and `server.js` in the same root folder.
- Do not open HTML files directly with `file://`; use the Express URLs so the API can work.
- The first `npm install` needs an internet connection to download Express.
- No MongoDB database is required; this exercise uses a JSON file for storage.
