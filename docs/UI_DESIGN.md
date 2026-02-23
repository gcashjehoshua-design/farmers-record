# User Interface Design

## Page 1: Dashboard / Home Screen
**Purpose:** Welcome screen and quick access

```
┌─────────────────────────────────────────────┐
│  FARMERS RECORD SYSTEM                 🏠   │
├─────────────────────────────────────────────┤
│                                             │
│  Welcome, Admin!                            │
│                                             │
│  ┌──────────────────┬──────────────────┐   │
│  │ Total Farmers    │  Transactions    │   │
│  │     125          │  Today: 8        │   │
│  └──────────────────┴──────────────────┘   │
│                                             │
│  Quick Actions:                             │
│  ┌──────────────────┬──────────────────┐   │
│  │  Add New Farmer  │  Record Trans.   │   │
│  │      [+]         │       [+]        │   │
│  └──────────────────┴──────────────────┘   │
│                                             │
│  Navigation: [Farmers] [Transactions]      │
│                                             │
└─────────────────────────────────────────────┘
```

---

## Page 2: Farmer Management / Directory
**Purpose:** View and manage all farmer profiles

```
┌─────────────────────────────────────────────┐
│  FARMER DIRECTORY                      🔍   │
├─────────────────────────────────────────────┤
│                                             │
│  Search: [____________] [Search]            │
│                                             │
│  [Add New Farmer]                           │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ No. │ Name      │ Phone    │ Farm   │   │
│  ├─────────────────────────────────────┤   │
│  │  1  │ John Doe  │555-0101  │Doe'... │   │
│  │  2  │ Mary Smith│555-0102  │Smith..│   │
│  │  3  │ Jane J... │555-0103  │Johnso │   │
│  │  4  │ Mike B... │555-0104  │Baker  │   │
│  │  5  │ Sarah L...│555-0105  │Lawson │   │
│  │  6  │ David M...│555-0106  │Miller │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  [< Prev] Page 1 of 5 [Next >]              │
│                                             │
└─────────────────────────────────────────────┘
```

---

## Page 3: Farmer Profile / Details
**Purpose:** View complete farmer information and transaction history

```
┌─────────────────────────────────────────────┐
│  FARMER PROFILE                        [✎]  │
├─────────────────────────────────────────────┤
│                                             │
│  BASIC INFORMATION                          │
│  ├─ Name: John Doe                          │
│  ├─ Phone: 555-0101                         │
│  ├─ Email: john@example.com                 │
│  ├─ Address: 123 Farm Road, Springfield     │
│  └─ Registered: 2026-01-15                  │
│                                             │
│  FARM DETAILS                               │
│  ├─ Farm Name: Doe's Farm                   │
│  ├─ Farm Type: Crop                         │
│  ├─ Farm Size: 50.5 hectares                │
│  └─ Last Visit: 2026-02-01 2:30 PM          │
│                                             │
│  TRANSACTION HISTORY                        │
│  ┌──────────────────────────────────────┐   │
│  │ Date      │ Type           │ Amount  │   │
│  ├──────────────────────────────────────┤   │
│  │ 2026-02-01│ Loan Repayment │ 5000    │   │
│  │ 2026-01-20│ Loan Application│50000   │   │
│  │ 2026-01-15│ Consultation   │ ---     │   │
│  └──────────────────────────────────────┘   │
│                                             │
│  [Back]  [Edit Farmer]  [New Transaction]   │
│                                             │
└─────────────────────────────────────────────┘
```

---

## Page 4: Record New Transaction (MAIN WORKFLOW)
**Purpose:** Primary action - Record farmer visit and transaction

```
┌─────────────────────────────────────────────┐
│  RECORD TRANSACTION                         │
├─────────────────────────────────────────────┤
│                                             │
│  STEP 1: SELECT FARMER                      │
│  ┌──────────────────────────────────────┐   │
│  │ Search or Select Farmer:             │   │
│  │ [____________________________]        │   │
│  │ Suggestions:                         │   │
│  │ - John Doe (555-0101)                │   │
│  │ - Jane Johnson (555-0103)            │   │
│  │ - David Miller (555-0106)            │   │
│  └──────────────────────────────────────┘   │
│                                             │
│  STEP 2: SELECT TRANSACTION TYPE            │
│  ┌──────────────────────────────────────┐   │
│  │ Transaction Type:                    │   │
│  │ [Select Transaction ▼]               │   │
│  │                                      │   │
│  │ Available Options:                   │   │
│  │ • Loan Application                   │   │
│  │ • Loan Disbursement                  │   │
│  │ • Loan Repayment                     │   │
│  │ • Equipment Request                  │   │
│  │ • Fertilizer Purchase                │   │
│  │ • Consultation                       │   │
│  │ • Training Session                   │   │
│  │ • Report Submission                  │   │
│  └──────────────────────────────────────┘   │
│                                             │
│  STEP 3: ENTER TRANSACTION DETAILS          │
│  ┌──────────────────────────────────────┐   │
│  │ Amount (if applicable):              │   │
│  │ [____________________________]        │   │
│  │                                      │   │
│  │ Description:                         │   │
│  │ [____________________________]        │   │
│  │ [____________________________]        │   │
│  │                                      │   │
│  │ Notes:                               │   │
│  │ [____________________________]        │   │
│  │ [____________________________]        │   │
│  └──────────────────────────────────────┘   │
│                                             │
│  [Cancel]  [Clear]  [Save Transaction]     │
│                                             │
└─────────────────────────────────────────────┘
```

---

## Page 5: Transaction History / Report
**Purpose:** View all transactions with filters

```
┌─────────────────────────────────────────────┐
│  TRANSACTION HISTORY                   🔍   │
├─────────────────────────────────────────────┤
│                                             │
│  Filters:                                   │
│  Farmer: [Select ▼]  Type: [Select ▼]      │
│  Date From: [____] To: [____]  [Filter]     │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ID │ Farmer Name│Type   │Date  │Amt  │   │
│  ├─────────────────────────────────────┤   │
│  │1  │ John Doe   │Repay  │02-01 │5000 │   │
│  │2  │ Mary Smith │Disb...│01-25 │10000│   │
│  │3  │ John Doe   │Apply  │01-20 │50000│   │
│  │4  │ Jane John..│Consult│01-15 │---  │   │
│  │5  │ David Mi...│Fer...│01-10 │3500 │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  [< Prev] Page 1 of 3 [Next >]              │
│  [Export to Excel]  [Print Report]          │
│                                             │
└─────────────────────────────────────────────┘
```

---

## Page 6: Add/Edit Farmer
**Purpose:** Create or modify farmer profile

```
┌─────────────────────────────────────────────┐
│  ADD NEW FARMER                         [✎]  │
├─────────────────────────────────────────────┤
│                                             │
│  PERSONAL INFORMATION                       │
│  First Name:  [___________]                 │
│  Last Name:   [___________]                 │
│  Email:       [___________]                 │
│  Phone:       [___________]   [Required]    │
│                                             │
│  ADDRESS INFORMATION                        │
│  Address:     [___________________________] │
│  City:        [___________]                 │
│  State:       [___________]                 │
│  Postal Code: [___________]                 │
│                                             │
│  FARM INFORMATION                           │
│  Farm Name:   [___________]                 │
│  Farm Type:   [Crop ▼]                      │
│  Farm Size:   [___________]  hectares       │
│                                             │
│  ADDITIONAL NOTES                           │
│  [_________________________]                 │
│  [_________________________]                 │
│                                             │
│  [Cancel]  [Clear]  [Save Farmer]           │
│                                             │
└─────────────────────────────────────────────┘
```

---

## Workflow: How It Works

### Scenario: Farmer John Doe visits the office

**Step 1:** Admin clicks "Record Transaction"
- Navigates to Record Transaction page

**Step 2:** Select Farmer
- Admin searches and selects "John Doe"
- System loads John's profile in background

**Step 3:** Choose Transaction Type
- Dropdown shows: Loan Application, Loan Disbursement, Loan Repayment, etc.
- Admin selects "Loan Repayment"

**Step 4:** Enter Transaction Details
- Amount: 5000
- Description: "Partial monthly payment"
- Notes: "Paid in cash, receipt issued"

**Step 5:** Save
- Transaction recorded with timestamp
- Transaction immediately appears in John Doe's transaction history
- Dashboard updates showing today's transaction count

**Step 6:** View History (Optional)
- Admin can click on John Doe's name
- See all his past transactions chronologically

---

## Key Features Summary

✅ **Farmer Profiles** - No photos, text-based details only
✅ **Quick Search** - Find farmers by name or phone
✅ **Fixed Transaction Types** - Dropdown with predefined options
✅ **Automatic Linking** - Each transaction automatically linked to farmer
✅ **Transaction History** - Complete timeline per farmer
✅ **Filters & Reports** - View transactions by date, farmer, type
✅ **User-Friendly** - Simple, intuitive interface for office staff
