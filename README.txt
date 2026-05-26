================================================
  AUTOMOBILE SPARE PARTS INVENTORY MANAGEMENT
  SYSTEM — VS Code Edition (No Database Needed)
================================================

REQUIREMENTS
------------
- Node.js (any version) → https://nodejs.org
- That's it. Nothing else.

NO PostgreSQL, NO SQLite, NO Visual Studio needed.
Data is stored in a simple file called data.json
that is already included and pre-loaded with 50 parts.

================================================
HOW TO RUN IN VS CODE
================================================

Step 1 — Open the folder in VS Code
    File → Open Folder → select the "standalone" folder

Step 2 — Open the integrated terminal
    Terminal → New Terminal  (or press Ctrl + ` )

Step 3 — Install dependencies (FIRST TIME ONLY)
    npm install

    Only installs "express" (pure JavaScript, no C++ needed)
    Takes about 10-15 seconds.

Step 4 — Start the server
    node server.js

Step 5 — Open your browser and go to:
    http://localhost:3000

================================================
STOPPING THE SERVER
================================================
    Press Ctrl + C in the terminal

STARTING AGAIN NEXT TIME
    node server.js        (no npm install needed again)

================================================
PROJECT STRUCTURE
================================================

standalone/
├── server.js        ← Express backend (all API routes)
├── package.json     ← Only 1 dependency: express
├── data.json        ← All 50 parts stored here (auto-updated)
└── public/
    ├── index.html   ← Full single-page app (all pages)
    ├── style.css    ← Industrial automotive theme
    └── script.js    ← Frontend logic (vanilla JS)

================================================
FEATURES
================================================

Dashboard
  - Total Parts count
  - Total Inventory Value (in Rupees)
  - Low Stock count (quantity <= 5)
  - Out of Stock count (quantity = 0)
  - Stock value by category (bar chart)
  - Vehicle type distribution (Bike/Car/Truck)
  - Low stock alert table

Inventory Table
  - All 50 parts displayed
  - Search by name, category, or ID
  - Filter by category and vehicle type
  - Low-stock rows highlighted in amber
  - Out-of-stock rows highlighted in red
  - Edit and Delete buttons per row

Add / Edit Part (full form)
  - Part Name, Category, Size/Spec
  - Vehicle Type, Quantity, Price
  - Full validation before saving

================================================
COMMANDS SUMMARY
================================================

  npm install      ← Run ONCE (first time only)
  node server.js   ← Run every time to start

  Browser: http://localhost:3000

================================================
