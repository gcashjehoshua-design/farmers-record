// Farmer.js - Data Model for Farmer
class Farmer {
  constructor(data) {
    this.farmer_id = data.farmer_id || null;
    this.first_name = data.first_name;
    this.last_name = data.last_name;
    this.email = data.email || '';
    this.phone = data.phone; // Required
    this.address = data.address || '';
    this.city = data.city || '';
    this.state = data.state || '';
    this.postal_code = data.postal_code || '';
    this.farm_name = data.farm_name || '';
    this.farm_size = data.farm_size || 0; // in hectares
    this.farm_type = data.farm_type || ''; // Crop, Livestock, Mixed
    this.date_registered = data.date_registered || new Date();
    this.last_visit = data.last_visit || null;
    this.notes = data.notes || '';
  }

  // Get full name
  getFullName() {
    return `${this.first_name} ${this.last_name}`;
  }

  // Validate required fields
  validate() {
    const errors = [];
    
    if (!this.first_name || this.first_name.trim() === '') {
      errors.push('First name is required');
    }
    if (!this.last_name || this.last_name.trim() === '') {
      errors.push('Last name is required');
    }
    if (!this.phone || this.phone.trim() === '') {
      errors.push('Phone number is required');
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  // Get farmer summary for display
  getSummary() {
    return {
      farmer_id: this.farmer_id,
      name: this.getFullName(),
      phone: this.phone,
      farm_name: this.farm_name,
      last_visit: this.last_visit
    };
  }
}

module.exports = Farmer;
