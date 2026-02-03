// js/add-farmer.js - Handle add farmer form

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('addFarmerForm');
  form.addEventListener('submit', submitAddFarmer);
});

async function submitAddFarmer(e) {
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

    const response = await createFarmer(formData);

    if (response.success) {
      // Show success notification
      showNotification('✓ Farmer added successfully!', 'success');
      
      // Hide the form
      document.getElementById('addFarmerForm').style.display = 'none';
      
      // Show success message
      const successMsg = document.getElementById('successMessage');
      document.getElementById('successDetails').textContent = 
        `Farmer ${formData.first_name}${formData.middle_name ? ' ' + formData.middle_name : ''} ${formData.last_name} has been added to the system.`;
      successMsg.classList.remove('hidden');
      
      // Navigate to farmer profile after 2 seconds to show the new farmer
      if (response.data && response.data.farmer_id) {
        setTimeout(() => {
          window.location.href = `farmer-profile.html?id=${response.data.farmer_id}`;
        }, 2000);
      } else {
        // Fallback: go to farmer directory if farmer_id not returned
        setTimeout(() => {
          window.location.href = 'farmer-directory.html';
        }, 2000);
      }
    }
  } catch (error) {
    showError(error.message);
  }
}

function showError(message) {
  document.getElementById('errorText').textContent = message;
  document.getElementById('errorMessage').classList.remove('hidden');
}

function closeError() {
  document.getElementById('errorMessage').classList.add('hidden');
}
