// js/api-client.js - API communication layer

// Dynamically set API base URL based on current host
// This allows the same frontend to work on localhost and deployed on Railway
const API_BASE_URL = `${window.location.protocol}//${window.location.host}/api`;

// ============================================
// FARMER API CALLS
// ============================================

// Get all farmers
async function getAllFarmers(page = 1, limit = 10) {
  try {
    const response = await fetch(`${API_BASE_URL}/farmers?page=${page}&limit=${limit}`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch farmers');
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching farmers:', error);
    throw error;
  }
}

// Get single farmer with transactions
async function getFarmerById(farmerId) {
  try {
    const response = await fetch(`${API_BASE_URL}/farmers/${farmerId}`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch farmer');
    }
    
    return data.data;
  } catch (error) {
    console.error('Error fetching farmer:', error);
    throw error;
  }
}

// Search farmers
async function searchFarmers(query) {
  try {
    const response = await fetch(`${API_BASE_URL}/farmers/search/${encodeURIComponent(query)}`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to search farmers');
    }
    
    return data.data || [];
  } catch (error) {
    console.error('Error searching farmers:', error);
    throw error;
  }
}

// Create new farmer
async function createFarmer(farmerData) {
  try {
    const response = await fetch(`${API_BASE_URL}/farmers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(farmerData)
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to create farmer');
    }
    
    return data;
  } catch (error) {
    console.error('Error creating farmer:', error);
    throw error;
  }
}

// Update farmer
async function updateFarmer(farmerId, farmerData) {
  try {
    const response = await fetch(`${API_BASE_URL}/farmers/${farmerId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(farmerData)
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to update farmer');
    }
    
    return data;
  } catch (error) {
    console.error('Error updating farmer:', error);
    throw error;
  }
}

// ============================================
// TRANSACTION API CALLS
// ============================================

// Get transaction types
async function getTransactionTypes() {
  try {
    const response = await fetch(`${API_BASE_URL}/transactions/types`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch transaction types');
    }
    
    return data.data || [];
  } catch (error) {
    console.error('Error fetching transaction types:', error);
    throw error;
  }
}

// Record new transaction
async function recordTransaction(transactionData) {
  try {
    const response = await fetch(`${API_BASE_URL}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(transactionData)
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to record transaction');
    }
    
    return data;
  } catch (error) {
    console.error('Error recording transaction:', error);
    throw error;
  }
}

// Get transactions for a farmer
async function getFarmerTransactions(farmerId) {
  try {
    const response = await fetch(`${API_BASE_URL}/transactions/farmer/${farmerId}`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch transactions');
    }
    
    return data.data || [];
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }
}

// Get all transactions with filters
async function getAllTransactions(filters = {}) {
  try {
    const params = new URLSearchParams();
    
    if (filters.farmer_id) params.append('farmer_id', filters.farmer_id);
    if (filters.type_id) params.append('type_id', filters.type_id);
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);
    
    const queryString = params.toString();
    const url = `${API_BASE_URL}/transactions${queryString ? '?' + queryString : ''}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch transactions');
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Format date for display
function formatDate(dateString) {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Format currency
function formatCurrency(amount) {
  if (!amount || amount === 0) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'PHP'
  }).format(amount);
}

// Show notification
function showNotification(message, type = 'success') {
  const notificationId = 'notification-' + Date.now();
  const notificationHtml = `
    <div id="${notificationId}" class="message ${type}" style="position: fixed; top: 20px; right: 20px; z-index: 9999; max-width: 400px;">
      <p>${message}</p>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', notificationHtml);
  
  setTimeout(() => {
    const notif = document.getElementById(notificationId);
    if (notif) notif.remove();
  }, 3000);
}

// ============================================
// EXPORT FOR USE IN OTHER FILES
// ============================================

// Note: All functions above are globally available
