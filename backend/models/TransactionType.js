// TransactionType.js - Data Model for Transaction Types
class TransactionType {
  constructor(data) {
    this.type_id = data.type_id || null;
    this.type_name = data.type_name;
    this.description = data.description || '';
    this.created_date = data.created_date || new Date();
  }

  // Predefined transaction types for dropdown
  static TYPES = [
    {
      type_id: 1,
      type_name: 'Loan Application',
      description: 'Farmer applying for loan'
    },
    {
      type_id: 2,
      type_name: 'Loan Disbursement',
      description: 'Releasing loan amount'
    },
    {
      type_id: 3,
      type_name: 'Loan Repayment',
      description: 'Farmer repaying loan'
    },
    {
      type_id: 4,
      type_name: 'Equipment Request',
      description: 'Request for farming equipment'
    },
    {
      type_id: 5,
      type_name: 'Fertilizer Purchase',
      description: 'Buying fertilizer supplies'
    },
    {
      type_id: 6,
      type_name: 'Consultation',
      description: 'Meeting with agricultural advisor'
    },
    {
      type_id: 7,
      type_name: 'Training Session',
      description: 'Attending training workshop'
    },
    {
      type_id: 8,
      type_name: 'Report Submission',
      description: 'Submitting farm reports'
    }
  ];

  // Get all available transaction types
  static getAll() {
    return TransactionType.TYPES;
  }

  // Get single type by ID
  static getById(type_id) {
    return TransactionType.TYPES.find(t => t.type_id === type_id);
  }

  // Format for display in dropdown
  static getDropdownOptions() {
    return TransactionType.TYPES.map(t => ({
      id: t.type_id,
      label: t.type_name,
      value: t.type_id,
      description: t.description
    }));
  }
}

module.exports = TransactionType;
