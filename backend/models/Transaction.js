// Transaction.js - Data Model for Transaction
class Transaction {
  constructor(data) {
    this.transaction_id = data.transaction_id || null;
    this.farmer_id = data.farmer_id; // Required - Links to farmer
    this.type_id = data.type_id; // Required - Links to transaction type
    this.transaction_date = data.transaction_date || new Date();
    this.amount = data.amount || 0;
    this.description = data.description || '';
    this.status = data.status || 'Completed'; // Completed, Pending, Cancelled
    this.notes = data.notes || '';
    this.created_by = data.created_by || 'System';
  }

  // Validate required fields
  validate() {
    const errors = [];
    
    if (!this.farmer_id) {
      errors.push('Farmer must be selected');
    }
    if (!this.type_id) {
      errors.push('Transaction type must be selected');
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  // Format transaction for display
  format() {
    return {
      transaction_id: this.transaction_id,
      farmer_id: this.farmer_id,
      type_id: this.type_id,
      transaction_date: this.transaction_date.toISOString(),
      amount: this.amount,
      description: this.description,
      status: this.status,
      notes: this.notes,
      created_by: this.created_by
    };
  }

  // Check if financial transaction (has amount)
  isFinancial() {
    return this.amount > 0;
  }
}

module.exports = Transaction;
