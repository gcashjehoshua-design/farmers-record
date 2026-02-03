# System Workflow & User Journeys

## Core Workflow: Recording a Farmer Transaction

```
┌──────────────────────────────────────────────────────┐
│  FARMER VISITS OFFICE                                │
│  Admin is ready to process the visit                 │
└─────────────────────────┬──────────────────────────┘
                          │
                          ▼
        ┌─────────────────────────────────┐
        │ Admin clicks: RECORD TRANSACTION │
        └────────────────┬────────────────┘
                         │
                         ▼
    ┌────────────────────────────────────────┐
    │ SEARCH & SELECT FARMER                 │
    │ Enter name or phone number             │
    │ System shows matching farmers          │
    └───────────────────┬────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │ FARMER SELECTED               │
        │ (e.g., John Doe)              │
        │ Loads farmer's basic info     │
        └─────────────┬─────────────────┘
                      │
                      ▼
    ┌──────────────────────────────────────┐
    │ SELECT TRANSACTION TYPE (Dropdown)   │
    │ • Loan Application                   │
    │ • Loan Disbursement                  │
    │ • Loan Repayment                     │
    │ • Equipment Request                  │
    │ • Fertilizer Purchase                │
    │ • Consultation                       │
    │ • Training Session                   │
    │ • Report Submission                  │
    └─────────┬──────────────────────────┘
              │
              ▼
    ┌────────────────────────────────┐
    │ ENTER DETAILS                  │
    │ - Amount (if applicable)       │
    │ - Description                  │
    │ - Notes                        │
    └─────────────┬──────────────────┘
                  │
                  ▼
        ┌─────────────────────┐
        │ SAVE TRANSACTION    │
        └──────────┬──────────┘
                   │
                   ▼
    ┌──────────────────────────────────────┐
    │ SUCCESS!                             │
    │ Transaction recorded with:           │
    │ ✓ Timestamp (auto)                   │
    │ ✓ Linked to John Doe (farmer_id=1)   │
    │ ✓ Transaction type selected          │
    │ ✓ Amount & notes saved               │
    │                                      │
    │ Transaction now appears in:          │
    │ - John Doe's transaction history     │
    │ - Today's transaction list           │
    │ - Reports & analytics                │
    └──────────────────────────────────────┘
```

---

## User Journey 1: Admin Recording a Visit

**Scenario:** Farmer visits office for loan repayment

1. **Identification** (Admin speaks with farmer)
   - "What is your name?" → "John Doe"
   - Admin opens system and searches for "John Doe"

2. **Selection** (System)
   - System shows "John Doe - 555-0101 - Doe's Farm"
   - Admin clicks to select

3. **Transaction Type** (Farmer explains purpose)
   - Farmer: "I came to make my loan repayment"
   - Admin selects "Loan Repayment" from dropdown

4. **Details Entry** (Transaction specifics)
   - Admin enters:
     - Amount: 5000
     - Notes: "Payment received in cash, receipt #123"

5. **Confirmation** (System)
   - Admin clicks "Save Transaction"
   - System confirms: "Transaction saved successfully"

6. **Completion** (Farmer leaves)
   - Transaction recorded automatically
   - John Doe's transaction history updated
   - Office has complete record of visit

---

## User Journey 2: Admin Viewing Farmer Profile

**Scenario:** Admin wants to review John's history before he leaves

1. **Search** → Enter "John Doe" or "555-0101"
2. **Select** → Click on farmer name from results
3. **View Profile** → See:
   - All contact information
   - Farm details
   - Last 10 transactions
   - Total loan amount
   - Visit frequency
4. **Take Action** → Can:
   - Edit farmer details
   - Add new transaction
   - Print transaction history
   - Export to report

---

## User Journey 3: Admin Generating Reports

**Scenario:** Monthly report of all transactions

1. **Navigate** → Go to "Transaction History" page
2. **Filter** →
   - Date range: Jan 1 - Jan 31
   - Transaction type: All or specific
   - Farmer: All or specific
3. **View** → See table of all matching transactions
4. **Export** → Download as Excel or print

---

## Data Flow Diagram

```
┌─────────────┐
│   OFFICE    │
│ (Admin User)│
└──────┬──────┘
       │
       │ "Record farmer visit"
       │
       ▼
┌──────────────────────────────────┐
│   WEB/DESKTOP APPLICATION        │
│ ┌────────────────────────────┐   │
│ │ Frontend (UI)              │   │
│ │ - Dashboard                │   │
│ │ - Farmer List              │   │
│ │ - Transaction Form         │   │
│ │ - History View             │   │
│ └────────┬───────────────────┘   │
│          │                        │
│ ┌────────▼───────────────────┐   │
│ │ Backend (API/Logic)        │   │
│ │ - Authentication           │   │
│ │ - Validation               │   │
│ │ - Business Logic           │   │
│ └────────┬───────────────────┘   │
└─────────┼──────────────────────┘
          │
          │ CRUD Operations
          │
          ▼
┌──────────────────────────────────┐
│   DATABASE                       │
│ ┌────────────────────────────┐   │
│ │ FARMERS TABLE              │   │
│ │ - farmer_id (Primary Key)  │   │
│ │ - name, phone, email       │   │
│ │ - farm details             │   │
│ └────────────────────────────┘   │
│                                  │
│ ┌────────────────────────────┐   │
│ │ TRANSACTION_TYPES TABLE    │   │
│ │ - type_id                  │   │
│ │ - type_name (Loan App...)  │   │
│ └────────────────────────────┘   │
│                                  │
│ ┌────────────────────────────┐   │
│ │ TRANSACTIONS TABLE         │   │
│ │ - transaction_id           │   │
│ │ - farmer_id (Foreign Key)  │   │
│ │ - type_id (Foreign Key)    │   │
│ │ - amount, date, notes      │   │
│ └────────────────────────────┘   │
└──────────────────────────────────┘
```

---

## Transaction Linking (Core Feature)

Every transaction is connected to a farmer through a relationship:

```
John Doe (Farmer)
├── farmer_id = 1
│
└── TRANSACTIONS
    ├── Transaction 1: Loan Application (Jan 20)
    │   └── farmer_id = 1, type_id = 1, amount = 50000
    │
    ├── Transaction 2: Loan Disbursement (Jan 22)
    │   └── farmer_id = 1, type_id = 2, amount = 50000
    │
    └── Transaction 3: Loan Repayment (Feb 1)
        └── farmer_id = 1, type_id = 3, amount = 5000
```

When you view John Doe's profile, you see all 3 transactions.
When you record a new transaction, you always specify which farmer.
System maintains data integrity through foreign keys.

---

## Key Principles

### ✓ Simple & Intuitive
- Dropdown for transaction types (no typing)
- Search-based farmer selection
- Minimal data entry required
- One-page transaction form

### ✓ Linked & Organized
- Every transaction linked to a farmer
- Complete transaction history per farmer
- Easy to trace farmer's interactions
- Reports organized by farmer or date

### ✓ Efficient for Office Use
- Quick recording (< 2 minutes per visit)
- Supports high volume of visitors
- No complex workflows
- Instant confirmation

### ✓ Data Integrity
- Database relationships maintain consistency
- Cannot record transaction without farmer
- Timestamp auto-generated
- Audit trail of who recorded what

---

## Common Scenarios

### Scenario A: New Farmer First Visit
1. Admin searches for farmer → Not found
2. Click "Add New Farmer"
3. Enter details (name, phone, farm name, etc.)
4. Save farmer
5. Immediately record first transaction
6. Done!

### Scenario B: Returning Farmer with Multiple Visits
1. Admin searches → Finds farmer (quick!)
2. System shows "Last visit: Feb 1"
3. Select transaction type for today's visit
4. Enter amount/notes
5. Save
6. Done! (All previous transactions visible in history)

### Scenario C: Admin pulls Historical Report
1. Go to "Transaction History"
2. Filter: Date range (January), Type (Loan Repayment), All farmers
3. System shows all loan repayments in January
4. Export to Excel for accounting/analysis
5. Done!

