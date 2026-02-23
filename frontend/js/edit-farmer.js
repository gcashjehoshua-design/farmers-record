// js/edit-farmer.js - Handle edit farmer form

let currentFarmerId = null;

document.addEventListener('DOMContentLoaded', async () => {
  // Get farmer ID from URL params
  const params = new URLSearchParams(window.location.search);
  const farmerId = params.get('id');
  
  if (!farmerId) {
    showError('No farmer selected for editing');
    return;
  }
  
  currentFarmerId = parseInt(farmerId);
  await loadFarmerForEdit(currentFarmerId);
  
  const form = document.getElementById('editFarmerForm');
  form.addEventListener('submit', submitEditFarmer);
});

// Load farmer data into form
async function loadFarmerForEdit(farmerId) {
  try {
    const farmer = await getFarmerById(farmerId);
    
    // Populate form fields
    document.getElementById('firstName').value = farmer.first_name;
    document.getElementById('lastName').value = farmer.last_name;
    document.getElementById('middleName').value = farmer.middle_name || '';
    document.getElementById('phone').value = farmer.phone;
    document.getElementById('barangay').value = farmer.address || '';
    document.getElementById('postalCode').value = farmer.postal_code || '';
    document.getElementById('farmName').value = farmer.farm_name || '';
    document.getElementById('farmType').value = farmer.farm_type || '';
    document.getElementById('farmSize').value = farmer.farm_size || '';
    document.getElementById('notes').value = farmer.notes || '';
  } catch (error) {
    showError(`Failed to load farmer: ${error.message}`);
  }
}

// Submit edit form
async function submitEditFarmer(e) {
  e.preventDefault();
  
  try {
    const formData = {
      first_name: document.getElementById('firstName').value.trim(),
      middle_name: document.getElementById('middleName') ? document.getElementById('middleName').value.trim() : null,
      last_name: document.getElementById('lastName').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      address: document.getElementById('barangay') ? document.getElementById('barangay').value.trim() : null,
      postal_code: document.getElementById('postalCode').value.trim() || null,
      farm_name: document.getElementById('farmName').value.trim() || null,
      farm_size: parseFloat(document.getElementById('farmSize').value) || null,
      farm_type: document.getElementById('farmType').value || null,
      notes: document.getElementById('notes').value.trim() || null
    };

    // Validation
    if (!formData.first_name || !formData.last_name || !formData.phone) {
      showError('Please fill in First Name, Last Name, and Phone Number');
      return;
    }

    const response = await updateFarmer(currentFarmerId, formData);

    if (response.success) {
      // Show success notification
      showNotification('✓ Farmer updated successfully!', 'success');
      
      // Fetch the updated farmer data
      const updatedFarmer = await getFarmerById(currentFarmerId);
      
      // Update the display in real-time without reload
      updateFarmerDisplayData(updatedFarmer);
      
      // Hide the form
      document.getElementById('editFarmerForm').style.display = 'none';
      
      // Show success message
      const successMsg = document.getElementById('successMessage');
      document.getElementById('successDetails').textContent = 
        `Changes have been saved for ${formData.first_name}${formData.middle_name ? ' ' + formData.middle_name : ''} ${formData.last_name}.`;
      successMsg.classList.remove('hidden');
      
      // Auto-navigate back to profile after 2 seconds
      setTimeout(() => {
        window.location.href = `farmer-profile.html?id=${currentFarmerId}`;
      }, 2000);
    }
  } catch (error) {
    showError(error.message);
  }
}

// Update farmer display data on the page without reload
function updateFarmerDisplayData(farmer) {
  // Update basic info
  const full = `${farmer.first_name}${farmer.middle_name ? ' ' + farmer.middle_name : ''} ${farmer.last_name}`.replace(/\s+/g,' ').trim();
  
  // Update all visible elements if they exist
  const elements = {
    'fullName': full,
    'phone': farmer.phone || '—',
    'middleName': farmer.middle_name || '—',
    'address': farmer.address || '—',
    'farmName': farmer.farm_name || '—',
    'farmType': farmer.farm_type || '—',
    'farmSize': farmer.farm_size ? `${farmer.farm_size} hectares` : '—'
  };
  
  // Update each element if it exists on the page
  Object.keys(elements).forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = elements[id];
      // Add a subtle highlight animation
      element.style.backgroundColor = '#fff3cd';
      setTimeout(() => {
        element.style.backgroundColor = 'transparent';
      }, 500);
    }
  });
}

function showError(message) {
  document.getElementById('errorText').textContent = message;
  document.getElementById('errorMessage').classList.remove('hidden');
}

function closeError() {
  document.getElementById('errorMessage').classList.add('hidden');
}

function goBack() {
  window.history.back();
}
