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
      const farmerId = response.data && response.data.farmer_id ? response.data.farmer_id : null;
      const farmerFullName = `${formData.first_name}${formData.middle_name ? ' ' + formData.middle_name : ''} ${formData.last_name}`;
      const memberSince = response.data && response.data.date_registered ? formatDate(response.data.date_registered) : null;
      
      document.getElementById('successDetails').innerHTML = `
        Farmer <strong>${farmerFullName}</strong> has been added to the system.${memberSince ? `<br><strong>Member Since:</strong> ${memberSince}` : ''}<br>
        <br>
        <small style="color: #666;">Redirecting to farmer profile in <span id="redirectCountdown">2</span> seconds...</small>
      `;
      successMsg.classList.remove('hidden');
      
      // Start countdown for auto-redirect
      let countdown = 2;
      const countdownInterval = setInterval(() => {
        countdown--;
        const countdownEl = document.getElementById('redirectCountdown');
        if (countdownEl) {
          countdownEl.textContent = countdown;
        }
        if (countdown <= 0) {
          clearInterval(countdownInterval);
        }
      }, 1000);
      
      // Store the farmer ID and timeout for potential cancellation
      window.currentFarmerId = farmerId;
      
      // Navigate to farmer profile after 2 seconds to show the new farmer
      if (farmerId) {
        window.redirectTimeout = setTimeout(() => {
          window.location.href = `farmer-profile.html?id=${farmerId}`;
        }, 2000);
      } else {
        // Fallback: go to farmer directory if farmer_id not returned
        window.redirectTimeout = setTimeout(() => {
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

// Reset form and show form again
function resetForm() {
  // Cancel pending redirect if user clicks "Add Another Farmer"
  if (window.redirectTimeout) {
    clearTimeout(window.redirectTimeout);
    window.redirectTimeout = null;
  }
  
  document.getElementById('addFarmerForm').reset();
  document.getElementById('addFarmerForm').style.display = 'block';
  document.getElementById('successMessage').classList.add('hidden');
  document.getElementById('successMessage').style.display = 'none';
}

// Navigate to farmer profile
function goToFarmerProfile(farmerId) {
  if (window.redirectTimeout) {
    clearTimeout(window.redirectTimeout);
    window.redirectTimeout = null;
  }
  if (farmerId) {
    window.location.href = `farmer-profile.html?id=${farmerId}`;
  } else {
    window.location.href = 'farmer-directory.html';
  }
}
