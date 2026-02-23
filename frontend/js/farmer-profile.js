// js/farmer-profile.js - Handle farmer profile display

let currentFarmerId = null;

document.addEventListener('DOMContentLoaded', async () => {
  // Get farmer ID from URL params
  const params = new URLSearchParams(window.location.search);
  const farmerId = params.get('id');
  
  if (!farmerId) {
    showNotification('❌ No farmer selected', 'error');
    setTimeout(() => {
      window.location.href = 'farmer-directory.html';
    }, 2000);
    return;
  }
  
  currentFarmerId = parseInt(farmerId);
  await loadFarmerProfile(currentFarmerId);
  // Set record transaction link to include farmer id so form can prefill
  const recordBtn = document.getElementById('recordTransactionBtn');
  if (recordBtn) recordBtn.href = `record-transaction.html?farmer_id=${currentFarmerId}`;
});

// Load farmer profile
async function loadFarmerProfile(farmerId) {
  try {
    const farmer = await getFarmerById(farmerId);
    
    // Populate basic info
    const full = `${farmer.first_name}${farmer.middle_name ? ' ' + farmer.middle_name : ''} ${farmer.last_name}`.replace(/\s+/g,' ').trim();
    document.getElementById('fullName').textContent = full;
    document.getElementById('phone').textContent = farmer.phone || '—';
    document.getElementById('middleName').textContent = farmer.middle_name || '—';
    document.getElementById('address').textContent = farmer.address || '—';
    document.getElementById('dateRegistered').textContent = formatDate(farmer.date_registered);
    document.getElementById('lastVisit').textContent = farmer.last_visit ? formatDate(farmer.last_visit) : '🆕 No visits yet';
    
    // Populate farm info
    document.getElementById('farmName').textContent = farmer.farm_name || '—';
    document.getElementById('farmType').textContent = farmer.farm_type || '—';
    document.getElementById('farmSize').textContent = farmer.farm_size ? `${farmer.farm_size} hectares` : '—';
    
    // Populate transaction history
    populateTransactionHistory(farmer.transactions || []);
  } catch (error) {
    console.error('Error loading farmer:', error);
    showNotification(`❌ Error: ${error.message}`, 'error');
    setTimeout(() => {
      window.location.href = 'farmer-directory.html';
    }, 2000);
  }
}

// Populate transaction history table - make rows clickable to show details
function populateTransactionHistory(transactions) {
  const tbody = document.getElementById('transactionHistory');
  
  if (transactions.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="loading">No transactions recorded yet</td></tr>';
    return;
  }
  
  tbody.innerHTML = transactions
    .map(tx => `
      <tr style="cursor: pointer;" onclick="showTransactionModal(${tx.transaction_id}, '${tx.type_name.replace(/'/g, "\\'")}', '${formatDate(tx.transaction_date)}', '${(tx.description || '').replace(/'/g, "\\'")}', '${(tx.notes || '').replace(/'/g, "\\'")}', '${formatCurrency(tx.amount)}', '${tx.status}')">
        <td>${formatDate(tx.transaction_date)}</td>
        <td><strong>${tx.type_name}</strong></td>
        <td>${tx.amount && tx.amount > 0 ? formatCurrency(tx.amount) : '—'}</td>
        <td><span class="status-badge status-${tx.status.toLowerCase()}">✓ ${tx.status}</span></td>
        <td>${tx.notes || '—'}</td>
      </tr>
    `)
    .join('');
}

// Show transaction detail modal
function showTransactionModal(txId, txType, txDate, description, notes, amount, status) {
  const modal = document.getElementById('transactionModal');
  const detailsDiv = document.getElementById('modalTransactionDetails');
  
  detailsDiv.innerHTML = `
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p><strong>Transaction ID:</strong> #${txId}</p>
      <p><strong>Type:</strong> ${txType}</p>
      <p><strong>Date & Time:</strong> ${txDate}</p>
      <p><strong>Amount:</strong> ${amount}</p>
      <p><strong>Status:</strong> <span class="status-badge status-${status.toLowerCase()}">✓ ${status}</span></p>
      ${description ? `<p><strong>Description:</strong><br>${description}</p>` : ''}
      ${notes ? `<p><strong>Notes:</strong><br>${notes}</p>` : ''}
    </div>
  `;
  
  modal.classList.add('show');
}

// Close transaction modal
function closeTransactionModal() {
  const modal = document.getElementById('transactionModal');
  modal.classList.remove('show');
}

// Edit farmer
function editFarmer() {
  window.location.href = `edit-farmer.html?id=${currentFarmerId}`;
}
