# Database Schema

## Tables Structure

### 1. FARMERS Table
Stores all farmer information and profiles.

```sql
CREATE TABLE farmers (
  farmer_id INT PRIMARY KEY AUTO_INCREMENT,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(100),
  phone VARCHAR(20) NOT NULL,
  address VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),
  farm_name VARCHAR(150),
  farm_size DECIMAL(10, 2),  -- in hectares or acres
  farm_type VARCHAR(100),  -- e.g., "Crop", "Livestock", "Mixed"
  date_registered DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_visit DATETIME,
  notes TEXT
);
```

**Sample Data:**
| farmer_id | first_name | last_name | phone | address | farm_name | date_registered |
|-----------|-----------|-----------|-------|---------|-----------|-----------------|
| 1 | John | Doe | 555-0101 | 123 Farm Road | Doe's Farm | 2026-01-15 |
| 2 | Mary | Smith | 555-0102 | 456 Country Lane | Smith Crops | 2026-01-20 |

---

### 2. TRANSACTION_TYPES Table
Predefined transaction types (dropdown options)

```sql
CREATE TABLE transaction_types (
  type_id INT PRIMARY KEY AUTO_INCREMENT,
  type_name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_date DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Sample Transaction Types:**
| type_id | type_name | description |
|---------|----------|-------------|
| 1 | Loan Application | Farmer applying for loan |
| 2 | Loan Disbursement | Releasing loan amount |
| 3 | Loan Repayment | Farmer repaying loan |
| 4 | Equipment Request | Request for farming equipment |
| 5 | Fertilizer Purchase | Buying fertilizer supplies |
| 6 | Consultation | Meeting with agricultural advisor |
| 7 | Training Session | Attending training workshop |
| 8 | Report Submission | Submitting farm reports |

---

### 3. TRANSACTIONS Table
Records all transactions for each farmer

```sql
CREATE TABLE transactions (
  transaction_id INT PRIMARY KEY AUTO_INCREMENT,
  farmer_id INT NOT NULL,
  type_id INT NOT NULL,
  transaction_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  amount DECIMAL(12, 2),  -- Optional: for financial transactions
  description TEXT,
  status VARCHAR(50) DEFAULT 'Completed',  -- Completed, Pending, Cancelled
  notes TEXT,
  created_by VARCHAR(100),  -- Admin who recorded the transaction
  FOREIGN KEY (farmer_id) REFERENCES farmers(farmer_id),
  FOREIGN KEY (type_id) REFERENCES transaction_types(type_id)
);
```

**Sample Data:**
| transaction_id | farmer_id | type_id | transaction_date | amount | status | created_by |
|---|---|---|---|---|---|---|
| 1 | 1 | 1 | 2026-01-20 10:30 | 50000 | Completed | Admin1 |
| 2 | 1 | 3 | 2026-02-01 14:15 | 5000 | Completed | Admin1 |
| 3 | 2 | 2 | 2026-01-25 09:00 | 100000 | Completed | Admin2 |

---

## Relationships

```
farmers (1) ----< (Many) transactions
transaction_types (1) ----< (Many) transactions
```

Each transaction is linked to:
- One farmer (farmer_id)
- One transaction type (type_id)

---

## Indexes for Performance

```sql
CREATE INDEX idx_farmer_id ON transactions(farmer_id);
CREATE INDEX idx_transaction_date ON transactions(transaction_date);
CREATE INDEX idx_type_id ON transactions(type_id);
CREATE INDEX idx_farmer_phone ON farmers(phone);
```
