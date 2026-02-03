# API Endpoints Design

## Base URL
```
http://localhost:3000/api
```

---

## FARMER ENDPOINTS

### 1. Get All Farmers
```
GET /farmers
```
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "farmer_id": 1,
      "first_name": "John",
      "last_name": "Doe",
      "phone": "555-0101",
      "email": "john@example.com",
      "farm_name": "Doe's Farm",
      "date_registered": "2026-01-15"
    }
  ]
}
```

---

### 2. Get Single Farmer Profile
```
GET /farmers/:farmer_id
```
**Response:**
```json
{
  "success": true,
  "data": {
    "farmer_id": 1,
    "first_name": "John",
    "last_name": "Doe",
    "phone": "555-0101",
    "email": "john@example.com",
    "address": "123 Farm Road",
    "city": "Springfield",
    "farm_name": "Doe's Farm",
    "farm_size": 50.5,
    "farm_type": "Crop",
    "date_registered": "2026-01-15",
    "last_visit": "2026-02-01"
  }
}
```

---

### 3. Create New Farmer
```
POST /farmers
Content-Type: application/json

{
  "first_name": "Jane",
  "last_name": "Johnson",
  "phone": "555-0103",
  "email": "jane@example.com",
  "address": "789 Green Valley",
  "farm_name": "Johnson Estate",
  "farm_size": 75,
  "farm_type": "Livestock"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Farmer created successfully",
  "data": {
    "farmer_id": 3,
    "first_name": "Jane",
    "last_name": "Johnson"
  }
}
```

---

### 4. Update Farmer
```
PUT /farmers/:farmer_id
Content-Type: application/json

{
  "phone": "555-0104",
  "email": "jane.johnson@example.com"
}
```

---

### 5. Search Farmers
```
GET /farmers/search?query=john
```
Search by name, phone, or email

---

## TRANSACTION ENDPOINTS

### 1. Get Transaction Types (Dropdown Options)
```
GET /transactions/types
```
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "type_id": 1,
      "type_name": "Loan Application",
      "description": "Farmer applying for loan"
    },
    {
      "type_id": 2,
      "type_name": "Loan Disbursement",
      "description": "Releasing loan amount"
    },
    {
      "type_id": 3,
      "type_name": "Loan Repayment",
      "description": "Farmer repaying loan"
    }
  ]
}
```

---

### 2. Record New Transaction
```
POST /transactions
Content-Type: application/json

{
  "farmer_id": 1,
  "type_id": 3,
  "amount": 5000,
  "description": "Monthly loan repayment",
  "notes": "Full payment received in cash"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Transaction recorded successfully",
  "data": {
    "transaction_id": 4,
    "farmer_id": 1,
    "type_id": 3,
    "transaction_date": "2026-02-03T14:30:00Z",
    "amount": 5000,
    "status": "Completed"
  }
}
```

---

### 3. Get Transaction History for Farmer
```
GET /farmers/:farmer_id/transactions
```
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "transaction_id": 1,
      "farmer_id": 1,
      "type_name": "Loan Application",
      "transaction_date": "2026-01-20T10:30:00Z",
      "amount": 50000,
      "status": "Completed",
      "notes": "Applied for agricultural loan"
    },
    {
      "transaction_id": 2,
      "farmer_id": 1,
      "type_name": "Loan Repayment",
      "transaction_date": "2026-02-01T14:15:00Z",
      "amount": 5000,
      "status": "Completed",
      "notes": "Partial repayment"
    }
  ]
}
```

---

### 4. Get All Transactions (With Filters)
```
GET /transactions?farmer_id=1&type_id=3&start_date=2026-01-01&end_date=2026-02-03
```

---

### 5. Get Single Transaction
```
GET /transactions/:transaction_id
```

---

### 6. Update Transaction
```
PUT /transactions/:transaction_id
Content-Type: application/json

{
  "status": "Completed",
  "notes": "Updated notes"
}
```

---

## DASHBOARD ENDPOINTS

### 1. Get Today's Visitors
```
GET /dashboard/todays-visitors
```
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "farmer_id": 1,
      "farmer_name": "John Doe",
      "visit_time": "2026-02-03T10:30:00Z",
      "last_transaction_type": "Loan Repayment"
    }
  ]
}
```

---

### 2. Get Statistics
```
GET /dashboard/statistics
```
**Response:**
```json
{
  "success": true,
  "data": {
    "total_farmers": 125,
    "transactions_today": 8,
    "transactions_this_month": 45,
    "loan_amount_disbursed": 500000
  }
}
```
