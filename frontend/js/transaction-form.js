// js/transaction-form.js - Handle transaction recording form

document.addEventListener('DOMContentLoaded', async () => {
  // Load transaction types on page load
  await loadTransactionTypes();
  
  // Setup form event listeners
  setupFormListeners();
  
  // Set up back button navigation based on farmer_id in URL
  const params = new URLSearchParams(window.location.search);
  const presetFarmerId = params.get('farmer_id');
  const backBtn = document.getElementById('backBtn');
  const cancelBtn = document.getElementById('cancelBtn');
  
  if (presetFarmerId) {
    const backUrl = `farmer-profile.html?id=${presetFarmerId}`;
    backBtn.href = backUrl;
    cancelBtn.onclick = (e) => { e.preventDefault(); window.location.href = backUrl; };
  } else {
    backBtn.href = 'index.html';
    cancelBtn.onclick = (e) => { e.preventDefault(); window.location.href = 'index.html'; };
  }
  
  // If navigated with a farmer_id in the URL, prefill the form with that farmer
  try {
    if (presetFarmerId) {
      const farmer = await getFarmerById(parseInt(presetFarmerId));
      if (farmer && farmer.farmer_id) {
        const name = `${farmer.first_name}${farmer.middle_name ? ' ' + farmer.middle_name : ''} ${farmer.last_name}`.replace(/\s+/g,' ').trim();
        selectFarmer(farmer.farmer_id, name, farmer.phone || '', farmer.farm_name || 'N/A');
      }
    }
  } catch (err) {
    console.error('Prefill farmer error:', err);
  }
});

// Load transaction types into dropdown
async function loadTransactionTypes() {
  try {
    const types = await getTransactionTypes();
    const typeSelect = document.getElementById('transactionType');
    
    // Clear existing options except the first one
    while (typeSelect.options.length > 1) {
      typeSelect.remove(1);
    }
    
    types.forEach(type => {
      const option = document.createElement('option');
      option.value = type.type_id;
      option.textContent = type.type_name;
      option.dataset.description = type.description || '';
      typeSelect.appendChild(option);
    });
  } catch (error) {
    console.error('Error loading transaction types:', error);
    showNotification('Failed to load transaction types', 'error');
  }
}

// Setup form event listeners
function setupFormListeners() {
  const farmerSearch = document.getElementById('farmerSearch');
  const transactionForm = document.getElementById('transactionForm');
  const transactionType = document.getElementById('transactionType');
  const addNewFarmerBtn = document.getElementById('addNewFarmerBtn');
  
  // Farmer search with suggestions
  farmerSearch.addEventListener('input', async (e) => {
    const query = e.target.value.trim();
    
    if (query.length < 1) {
      document.getElementById('farmerSuggestions').classList.remove('active');
      return;
    }
    
    try {
      const farmers = await searchFarmers(query);
      const suggestionsList = document.getElementById('farmerSuggestions');
      
      if (farmers.length === 0) {
        suggestionsList.innerHTML = '<div class="suggestion-item">❌ No farmers found</div>';
      } else {
        suggestionsList.innerHTML = farmers
          .map(farmer => `
            <div class="suggestion-item" onclick="selectFarmer(${farmer.farmer_id}, '${farmer.first_name} ${farmer.last_name}', '${farmer.phone}', '${farmer.farm_name || 'N/A'}')">
              <strong>👨‍🌾 ${farmer.first_name} ${farmer.last_name}</strong><br>
              <small>📞 Phone: ${farmer.phone}</small>
              ${farmer.farm_name ? `<br><small>🌾 Farm: ${farmer.farm_name}</small>` : ''}
            </div>
          `)
          .join('');
      }
      
      suggestionsList.classList.add('active');
    } catch (error) {
      console.error('Search error:', error);
    }
  });
  
  // Hide suggestions when clicking elsewhere
  document.addEventListener('click', (e) => {
    if (e.target.id !== 'farmerSearch') {
      document.getElementById('farmerSuggestions').classList.remove('active');
    }
  });
  
  // Show transaction type description
  transactionType.addEventListener('change', (e) => {
    const selectedOption = e.target.options[e.target.selectedIndex];
    const description = selectedOption.dataset.description || '';
    
    const descBox = document.getElementById('typeDescription');
    if (description) {
      descBox.innerHTML = `<p style="color: #27ae60; font-size: 18px;"><strong>ℹ️ Information:</strong> ${description}</p>`;
    } else {
      descBox.innerHTML = '';
    }
  });
  
  // Add new farmer button
  addNewFarmerBtn.addEventListener('click', () => {
    window.location.href = 'add-farmer.html';
  });
  
  // Form submission
  transactionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    await submitTransaction();
  });
}

// Select farmer from suggestions
function selectFarmer(farmerId, name, phone, farm) {
  document.getElementById('farmer_id').value = farmerId;
  document.getElementById('farmerSearch').value = name;
  
  const selectedDiv = document.getElementById('selectedFarmer');
  document.getElementById('farmerName').textContent = name;
  document.getElementById('farmerPhone').textContent = phone;
  document.getElementById('farmerFarm').textContent = farm || 'N/A';
  selectedDiv.classList.remove('hidden');
  
  document.getElementById('farmerSuggestions').classList.remove('active');
}

// Submit transaction form
async function submitTransaction() {
  try {
    const farmerId = document.getElementById('farmer_id').value.trim();
    const typeId = document.getElementById('transactionType').value.trim();
    
    // Validation
    if (!farmerId) {
      showNotification('⚠️ Please select a farmer', 'error');
      return;
    }
    
    if (!typeId) {
      showNotification('⚠️ Please select a transaction type', 'error');
      return;
    }
    
    const formData = {
      farmer_id: parseInt(farmerId),
      type_id: parseInt(typeId),
      amount: parseFloat(document.getElementById('amount').value) || 0,
      description: document.getElementById('description').value.trim() || '',
      notes: document.getElementById('notes').value.trim() || '',
      created_by: 'Admin'
    };
    
    const response = await recordTransaction(formData);
    
    if (response.success) {
      showNotification('✓ Transaction recorded successfully!', 'success');
      
      // Show success message
      document.getElementById('transactionForm').style.display = 'none';
      const successMsg = document.getElementById('successMessage');
      const farmerName = document.getElementById('farmerName').textContent;
      const transType = document.getElementById('transactionType').options[document.getElementById('transactionType').selectedIndex].text;
      document.getElementById('successDetails').innerHTML = `
        <strong>Farmer:</strong> ${farmerName}<br>
        <strong>Transaction:</strong> ${transType}
      `;
      successMsg.classList.remove('hidden');
      
      // Navigate back to farmer profile after 2 seconds to see the updated transaction history
      setTimeout(() => {
        window.location.href = `farmer-profile.html?id=${farmerId}`;
      }, 2000);
    }
  } catch (error) {
    showNotification(`❌ Error: ${error.message}`, 'error');
    console.error('Transaction submission error:', error);
  }
}

// Reset form and show form again
function resetForm() {
  document.getElementById('transactionForm').reset();
  document.getElementById('farmer_id').value = '';
  document.getElementById('farmerSearch').value = '';
  document.getElementById('selectedFarmer').classList.add('hidden');
  document.getElementById('typeDescription').innerHTML = '';
  document.getElementById('transactionForm').style.display = 'block';
  document.getElementById('successMessage').classList.add('hidden');
}
