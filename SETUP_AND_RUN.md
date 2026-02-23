# Setup & Run Guide - Farmers Record System

## Prerequisites

You need to have the following installed on your computer:

1. **Node.js** - Download from https://nodejs.org/ (v14 or higher)
   - This includes npm (Node Package Manager)

2. **Windows PowerShell** or **Command Prompt** - Already installed on Windows

---

## Step 1: Install Dependencies

Open PowerShell and navigate to the backend folder:

```powershell
cd "c:\Users\Jehoshua Pelingon\OneDrive\Desktop\FARMERS RECORD\backend"
npm install
```

This will download all required packages:
- express (web server)
- sqlite3 (database)
- cors (cross-origin requests)
- body-parser (form data handling)

**Expected output:**
```
added 50 packages in 5s
```

---

## Step 2: Initialize the Database

Still in the backend folder, run the initialization script:

```powershell
npm run init-db
```

**Expected output:**
```
Connected to SQLite database
✓ Database schema created successfully
✓ Transaction types inserted successfully
✓ Sample farmers inserted successfully
✓ Sample transactions inserted successfully

✅ Database initialization completed!
Sample farmers are ready for testing
```

This creates:
- All database tables
- 8 transaction types
- 3 sample farmers (John Doe, Mary Smith, David Miller)
- 4 sample transactions

---

## Step 3: Start the Server

Still in the backend folder, run:

```powershell
npm start
```

**Expected output:**
```
╔════════════════════════════════════════════════════════════╗
║   FARMERS RECORD SYSTEM - Backend Server                   ║
║   Server running on http://localhost:3000                  ║
║   ✓ Database: SQLite                                       ║
║   ✓ API: RESTful                                           ║
║   ✓ Frontend: Served at root                               ║
╚════════════════════════════════════════════════════════════╝

API Endpoints:
  GET  /api/farmers              - Get all farmers
  POST /api/farmers              - Create new farmer
  GET  /api/farmers/:id          - Get farmer details
  PUT  /api/farmers/:id          - Update farmer
  GET  /api/farmers/search/:q    - Search farmers

  GET  /api/transactions/types   - Get transaction types
  POST /api/transactions         - Record transaction
  GET  /api/transactions         - Get all transactions
  GET  /api/transactions/:id     - Get single transaction

Frontend:
  http://localhost:3000/

To view in browser, open: http://localhost:3000
```

✅ **Server is now running!**

---

## Step 4: Open in Browser

Open your web browser and go to:

```
http://localhost:3000
```

You should see the **Farmers Record System** dashboard with three options:
- 📝 Record Transaction
- 👥 Farmer Directory
- ➕ Add New Farmer

---

## Testing the System

### Test 1: View Sample Farmers
1. Click "👥 Farmer Directory"
2. You should see 3 sample farmers (John Doe, Mary Smith, David Miller)
3. Click "View" to see farmer details and transaction history

### Test 2: Record a Transaction
1. Click "📝 Record Transaction"
2. Search for "John Doe"
3. Select a transaction type from dropdown (e.g., "Loan Repayment")
4. Enter an amount (e.g., 5000)
5. Click "✓ Save Transaction"
6. You should see success message

### Test 3: View Updated Transaction History
1. Go to "👥 Farmer Directory"
2. Click "View" on John Doe
3. You should see the new transaction in his history

---

## Stopping the Server

In PowerShell, press:
```
Ctrl + C
```

This will stop the server.

---

## Database File Location

The SQLite database is stored at:
```
c:\Users\Jehoshua Pelingon\OneDrive\Desktop\FARMERS RECORD\backend\database\farmers_record.db
```

You can delete this file and run `npm run init-db` again to reset the database to sample data.

---

## Troubleshooting

### Issue: Port 3000 already in use
**Solution:** Change the port in `.env` file
```
PORT=3001
```

### Issue: npm command not found
**Solution:** Make sure Node.js is installed and restart PowerShell

### Issue: Database file not found
**Solution:** Make sure you ran `npm run init-db` first

### Issue: API calls failing
**Solution:** Make sure the server is running (`npm start`)

---

## Development Mode with Auto-Reload

To automatically restart the server when you make changes:

```powershell
npm run dev
```

(This requires nodemon, which was installed with dependencies)

---

## File Structure

```
FARMERS RECORD/
│
├── backend/
│   ├── package.json          ← Dependencies
│   ├── .env                  ← Configuration
│   ├── server.js             ← Main server
│   ├── config.js             ← Settings
│   ├── database/
│   │   ├── farmers_record.db ← Database file
│   │   ├── schema.sql        ← Table structure
│   │   ├── init.js           ← Setup script
│   │   └── db.js             ← Database connection
│   └── routes/
│       ├── farmers.js        ← Farmer API
│       └── transactions.js   ← Transaction API
│
└── frontend/
    ├── index.html            ← Home page
    ├── record-transaction.html
    ├── farmer-directory.html
    ├── farmer-profile.html
    ├── css/
    │   └── styles.css
    └── js/
        ├── api-client.js     ← API communication
        ├── transaction-form.js
        ├── farmer-directory.js
        └── farmer-profile.js
```

---

## Next Steps

1. ✅ Install Node.js
2. ✅ Run `npm install` in backend folder
3. ✅ Run `npm run init-db` to create database
4. ✅ Run `npm start` to start server
5. ✅ Open http://localhost:3000 in browser
6. ✅ Test all features

**Everything is ready to use!**
