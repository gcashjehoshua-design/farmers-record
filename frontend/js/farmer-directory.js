// js/farmer-directory.js - Handle farmer listing and search

let currentPage = 1;
const pageSize = 10;
let isSearching = false;

document.addEventListener('DOMContentLoaded', async () => {
  await loadFarmers(currentPage);
  setupSearchListener();
});

// Load farmers
async function loadFarmers(page = 1) {
  try {
    isSearching = false;
    const response = await getAllFarmers(page, pageSize);
    const farmers = response.data;
    const pagination = response.pagination;
    
    // Update pagination info
    currentPage = page;
    document.getElementById('pageInfo').textContent = `Page ${page} of ${pagination.pages}`;
    document.getElementById('totalFarmers').textContent = pagination.total;
    document.getElementById('showingCount').textContent = farmers.length;
    document.getElementById('totalCount').textContent = pagination.total;
    
    // Update prev/next buttons
    document.getElementById('prevBtn').disabled = page === 1;
    document.getElementById('nextBtn').disabled = page === pagination.pages;
    
    // Populate table
    const tbody = document.getElementById('farmersTableBody');
    
    if (farmers.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="loading">No farmers found</td></tr>';
      return;
    }
    
    tbody.innerHTML = farmers
      .map((farmer, index) => `
        <tr>
          <td>${(page - 1) * pageSize + index + 1}</td>
          <td><strong>${farmer.first_name} ${farmer.last_name}</strong></td>
          <td>${farmer.phone}</td>
          <td>${farmer.farm_name || '—'}</td>
          <td>${formatDate(farmer.date_registered)}</td>
          <td>${farmer.last_visit ? formatDate(farmer.last_visit) : '—'}</td>
          <td>
            <button onclick="viewFarmer(${farmer.farmer_id})" class="btn-primary" style="padding: 10px 15px; font-size: 14px; min-width: auto;">👁️ View</button>
          </td>
        </tr>
      `)
      .join('');
  } catch (error) {
    showNotification(`Error: ${error.message}`, 'error');
    const tbody = document.getElementById('farmersTableBody');
    tbody.innerHTML = '<tr><td colspan="7" class="loading">Error loading farmers</td></tr>';
  }
}

// Search farmers
async function performSearch() {
  const query = document.getElementById('farmerSearch').value.trim();
  
  if (!query) {
    currentPage = 1;
    await loadFarmers(1);
    return;
  }
  
  try {
    isSearching = true;
    const farmers = await searchFarmers(query);
    
    const tbody = document.getElementById('farmersTableBody');
    if (farmers.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="loading">No farmers found matching "' + query + '"</td></tr>';
      document.getElementById('pageInfo').textContent = `Results: 0`;
      document.getElementById('prevBtn').disabled = true;
      document.getElementById('nextBtn').disabled = true;
      return;
    }
    
    tbody.innerHTML = farmers
      .map((farmer, index) => `
        <tr>
          <td>${index + 1}</td>
          <td><strong>${farmer.first_name} ${farmer.last_name}</strong></td>
          <td>${farmer.phone}</td>
          <td>${farmer.farm_name || '—'}</td>
          <td>${formatDate(farmer.date_registered)}</td>
          <td>${farmer.last_visit ? formatDate(farmer.last_visit) : '—'}</td>
          <td>
            <button onclick="viewFarmer(${farmer.farmer_id})" class="btn-primary" style="padding: 10px 15px; font-size: 14px; min-width: auto;">👁️ View</button>
          </td>
        </tr>
      `)
      .join('');
      
    document.getElementById('pageInfo').textContent = `Results: ${farmers.length}`;
    document.getElementById('prevBtn').disabled = true;
    document.getElementById('nextBtn').disabled = true;
  } catch (error) {
    showNotification(`Error: ${error.message}`, 'error');
  }
}

// Setup search listener
function setupSearchListener() {
  const searchInput = document.getElementById('farmerSearch');
  const searchBtn = document.querySelector('button[onclick="searchFarmers()"]');
  
  // Enter key search
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  });
  
  // Clear search on empty input
  searchInput.addEventListener('input', (e) => {
    if (e.target.value.trim() === '') {
      currentPage = 1;
      loadFarmers(1);
    }
  });
}

// Wrapper for search button click
function searchFarmers() {
  performSearch();
}

// View farmer profile
function viewFarmer(farmerId) {
  window.location.href = `farmer-profile.html?id=${farmerId}`;
}

// Pagination
function nextPage() {
  if (!isSearching) {
    loadFarmers(currentPage + 1);
  }
}

function previousPage() {
  if (!isSearching && currentPage > 1) {
    loadFarmers(currentPage - 1);
  }
}
