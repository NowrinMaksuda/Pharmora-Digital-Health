// admin-dashboard.js

// Theme Toggle
const themeToggle = document.getElementById('themeToggle');
const body = document.body;
const themeIcon = themeToggle.querySelector('i');
if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        body.setAttribute('data-theme', body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
        
        if (body.getAttribute('data-theme') === 'dark') {
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
        } else {
            themeIcon.classList.remove('fa-sun');
            themeIcon.classList.add('fa-moon');
        }
    });
}

// Sidebar Toggle
const sidebar = document.getElementById('sidebar');
const toggleSidebar = document.getElementById('toggleSidebar');
const mainContent = document.getElementById('mainContent');
if (toggleSidebar) {
    toggleSidebar.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        mainContent.classList.toggle('expanded');
    });
}

// Mobile Menu Toggle
if (window.innerWidth <= 992) {
    if (sidebar) sidebar.classList.add('collapsed');
    if (mainContent) mainContent.classList.add('expanded');
    
    if (toggleSidebar) {
        toggleSidebar.addEventListener('click', () => {
            sidebar.classList.toggle('mobile-open');
        });
    }
}

// Navigation - FIXED VERSION
const menuItems = document.querySelectorAll('.menu-item');
const sections = document.querySelectorAll('.dashboard-section');

// Handle menu item clicks
menuItems.forEach(item => {
    item.addEventListener('click', (e) => {
        // Get the href attribute for navigation
        const href = item.getAttribute('href');
        
        // If it's a real link (not just #), navigate to it
        if (href && href !== '#') {
            return; // Let the browser handle the navigation
        }
        
        // For sections within the same page (like dashboard)
        e.preventDefault();
        
        // Remove active class from all menu items and sections
        menuItems.forEach(i => i.classList.remove('active'));
        sections.forEach(s => s.classList.remove('active'));
        
        // Add active class to clicked menu item
        item.classList.add('active');
        
        // Show corresponding section
        const sectionId = item.getAttribute('data-section');
        const section = document.getElementById(sectionId);
        if (section) {
            section.classList.add('active');
            
            // Initialize charts for this section if needed
            initializeCharts(sectionId);
        }
        
        // Close mobile menu
        if (window.innerWidth <= 992) {
            sidebar.classList.remove('mobile-open');
        }
    });
});

// Notification Dropdown
const notificationIcon = document.getElementById('notificationIcon');
const notificationDropdown = document.getElementById('notificationDropdown');
if (notificationIcon) {
    notificationIcon.addEventListener('click', () => {
        notificationDropdown.classList.toggle('active');
    });
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    if (notificationIcon && !notificationIcon.contains(e.target) && notificationDropdown && !notificationDropdown.contains(e.target)) {
        notificationDropdown.classList.remove('active');
    }
});

// Admin Profile Dropdown
const adminProfile = document.getElementById('adminProfile');
const adminDropdown = document.getElementById('adminDropdown');
if (adminProfile) {
    adminProfile.addEventListener('click', () => {
        adminDropdown.classList.toggle('active');
    });
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    if (!adminProfile.contains(e.target) && !adminDropdown.contains(e.target)) {
        adminDropdown.classList.remove('active');
    }
});

// Toast Notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.textContent = message;
    toast.className = 'toast show';
    
    if (type === 'error') {
        toast.classList.add('error');
    } else if (type === 'warning') {
        toast.classList.add('warning');
    } else {
        toast.classList.add('success');
    }
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Refresh Orders
const refreshOrdersBtn = document.getElementById('refreshOrders');
if (refreshOrdersBtn) {
    refreshOrdersBtn.addEventListener('click', () => {
        showToast('Orders refreshed successfully!');
    });
}

// Profile Modal
const profileModal = document.getElementById('adminProfileModal');
const profileModalClose = document.getElementById('adminProfileModalClose');
const profileModalCancel = document.getElementById('adminProfileModalCancel');
const profileBtn = document.getElementById('profileBtn');
const saveProfileBtn = document.getElementById('saveAdminProfileBtn');
const profileForm = document.getElementById('adminProfileForm');
const adminProfileImage = document.getElementById('adminProfileImage');
const adminProfileImagePreview = document.getElementById('adminProfileImagePreview');

if (profileBtn) {
    profileBtn.addEventListener('click', (e) => {
        e.preventDefault();
        adminDropdown.classList.remove('active');
        profileModal.classList.add('active');
    });
}

if (profileModalClose) {
    profileModalClose.addEventListener('click', () => {
        profileModal.classList.remove('active');
    });
}

if (profileModalCancel) {
    profileModalCancel.addEventListener('click', () => {
        profileModal.classList.remove('active');
    });
}

if (adminProfileImage) {
    adminProfileImage.addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                adminProfileImagePreview.src = e.target.result;
            }
            reader.readAsDataURL(file);
        }
    });
}

if (saveProfileBtn) {
    saveProfileBtn.addEventListener('click', () => {
        // Validate form
        const name = document.getElementById('adminName').value;
        const email = document.getElementById('adminEmail').value;
        const phone = document.getElementById('adminPhone').value;
        
        if (!name || !email || !phone) {
            showToast('Please fill in all required fields', 'error');
            return;
        }
        
        // Submit form
        if (profileForm) {
            profileForm.submit();
        }
    });
}

// Logout
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (confirm('Are you sure you want to logout?')) {
            showToast('Logged out successfully!');
            // In a real application, this would redirect to the login page
            setTimeout(() => {
                window.location.href = '/login';
            }, 1000);
        }
    });
}

// User Modal
const userModal = document.getElementById('userModal');
const userModalTitle = document.getElementById('userModalTitle');
const userModalClose = document.getElementById('userModalClose');
const userModalCancel = document.getElementById('userModalCancel');
const addUserBtn = document.getElementById('addUserBtn');
const saveUserBtn = document.getElementById('saveUserBtn');
const userForm = document.getElementById('userForm');
const userImage = document.getElementById('userImage');
const userImagePreview = document.getElementById('userImagePreview');

if (addUserBtn) {
    addUserBtn.addEventListener('click', () => {
        userModalTitle.textContent = 'Add User';
        if (userForm) userForm.reset();
        userImagePreview.src = 'https://picsum.photos/seed/defaultuser/100/100.jpg';
        userModal.classList.add('active');
    });
}

if (userModalClose) {
    userModalClose.addEventListener('click', () => {
        userModal.classList.remove('active');
    });
}

if (userModalCancel) {
    userModalCancel.addEventListener('click', () => {
        userModal.classList.remove('active');
    });
}

if (userImage) {
    userImage.addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                userImagePreview.src = e.target.result;
            }
            reader.readAsDataURL(file);
        }
    });
}

if (saveUserBtn) {
    saveUserBtn.addEventListener('click', () => {
        // Validate form
        const name = document.getElementById('userName').value;
        const email = document.getElementById('userEmail').value;
        const phone = document.getElementById('userPhone').value;
        const password = document.getElementById('userPassword').value;
        
        if (!name || !email || !phone || !password) {
            showToast('Please fill in all required fields', 'error');
            return;
        }
        
        // Submit form
        if (userForm) {
            userForm.submit();
        }
    });
}

// User View Modal
const userViewModal = document.getElementById('userViewModal');
const userViewModalClose = document.getElementById('userViewModalClose');
if (userViewModalClose) {
    userViewModalClose.addEventListener('click', () => {
        userViewModal.classList.remove('active');
    });
}

// Medicine Modal
const medicineModal = document.getElementById('medicineModal');
const medicineModalTitle = document.getElementById('medicineModalTitle');
const medicineModalClose = document.getElementById('medicineModalClose');
const medicineModalCancel = document.getElementById('medicineModalCancel');
const addMedicineBtn = document.getElementById('addMedicineBtn');
const saveMedicineBtn = document.getElementById('saveMedicineBtn');
const medicineForm = document.getElementById('medicineForm');
const medicineImage = document.getElementById('medicineImage');
const medicineImagePreview = document.getElementById('medicineImagePreview');

if (addMedicineBtn) {
    addMedicineBtn.addEventListener('click', () => {
        medicineModalTitle.textContent = 'Add Medicine';
        if (medicineForm) medicineForm.reset();
        medicineImagePreview.src = 'https://picsum.photos/seed/defaultmedicine/100/100.jpg';
        medicineModal.classList.add('active');
    });
}

if (medicineModalClose) {
    medicineModalClose.addEventListener('click', () => {
        medicineModal.classList.remove('active');
    });
}

if (medicineModalCancel) {
    medicineModalCancel.addEventListener('click', () => {
        medicineModal.classList.remove('active');
    });
}

if (medicineImage) {
    medicineImage.addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                medicineImagePreview.src = e.target.result;
            }
            reader.readAsDataURL(file);
        }
    });
}

if (saveMedicineBtn) {
    saveMedicineBtn.addEventListener('click', () => {
        // Validate form
        const name = document.getElementById('medicineName').value;
        const price = document.getElementById('medicinePrice').value;
        const stock = document.getElementById('medicineStock').value;
        const rating = document.getElementById('medicineRating').value;
        
        if (!name || !price || !stock || rating === '') {
            showToast('Please fill in all required fields', 'error');
            return;
        }
        
        // Submit form
        if (medicineForm) {
            medicineForm.submit();
        }
    });
}

// Medicine View Modal
const medicineViewModal = document.getElementById('medicineViewModal');
const medicineViewModalClose = document.getElementById('medicineViewModalClose');
if (medicineViewModalClose) {
    medicineViewModalClose.addEventListener('click', () => {
        medicineViewModal.classList.remove('active');
    });
}

// Order Modal
const orderModal = document.getElementById('orderModal');
const orderModalTitle = document.getElementById('orderModalTitle');
const orderModalClose = document.getElementById('orderModalClose');
const orderModalCancel = document.getElementById('orderModalCancel');
const addOrderBtn = document.getElementById('addOrderBtn');
const saveOrderBtn = document.getElementById('saveOrderBtn');
const orderForm = document.getElementById('orderForm');

if (addOrderBtn) {
    addOrderBtn.addEventListener('click', () => {
        orderModalTitle.textContent = 'Add Order';
        if (orderForm) orderForm.reset();
        orderModal.classList.add('active');
    });
}

if (orderModalClose) {
    orderModalClose.addEventListener('click', () => {
        orderModal.classList.remove('active');
    });
}

if (orderModalCancel) {
    orderModalCancel.addEventListener('click', () => {
        orderModal.classList.remove('active');
    });
}

if (saveOrderBtn) {
    saveOrderBtn.addEventListener('click', () => {
        // Validate form
        const customer = document.getElementById('orderCustomer').value;
        const email = document.getElementById('orderEmail').value;
        const phone = document.getElementById('orderPhone').value;
        const product = document.getElementById('orderProduct').value;
        const quantity = document.getElementById('orderQuantity').value;
        const price = document.getElementById('orderPrice').value;
        const payment = document.getElementById('orderPayment').value;
        const status = document.getElementById('orderStatus').value;
        
        if (!customer || !email || !phone || !product || !quantity || !price || !payment || !status) {
            showToast('Please fill in all required fields', 'error');
            return;
        }
        
        // Submit form
        if (orderForm) {
            orderForm.submit();
        }
    });
}

// Order View Modal
const orderViewModal = document.getElementById('orderViewModal');
const orderViewModalClose = document.getElementById('orderViewModalClose');
if (orderViewModalClose) {
    orderViewModalClose.addEventListener('click', () => {
        orderViewModal.classList.remove('active');
    });
}

// Order Actions
document.addEventListener('click', (e) => {
    if (e.target.closest('.action-btn.accept')) {
        const orderItem = e.target.closest('.order-item');
        const statusBadge = orderItem.querySelector('.order-status');
        statusBadge.textContent = 'Processing';
        statusBadge.className = 'order-status status-processing';
        showToast('Order accepted successfully!');
    } else if (e.target.closest('.action-btn.reject')) {
        const orderItem = e.target.closest('.order-item');
        orderItem.remove();
        showToast('Order rejected successfully!');
    } else if (e.target.closest('.action-btn.view')) {
        showToast('View order details');
    }
});

// Table Actions - View
document.addEventListener('click', (e) => {
    if (e.target.closest('.table-action-btn.view')) {
        const btn = e.target.closest('.table-action-btn');
        const id = btn.getAttribute('data-id');
        const type = btn.getAttribute('data-type');
        
        if (type === 'user') {
            // Navigate to user view page
            window.location.href = `/admin/users/view/${id}`;
        } else if (type === 'medicine') {
            // Navigate to medicine view page
            window.location.href = `/admin/medicines/view/${id}`;
        } else if (type === 'order') {
            // Navigate to order view page
            window.location.href = `/admin/orders/view/${id}`;
        }
    }
});

// Table Actions - Edit
document.addEventListener('click', (e) => {
    if (e.target.closest('.table-action-btn.edit')) {
        const btn = e.target.closest('.table-action-btn');
        const id = btn.getAttribute('data-id');
        const type = btn.getAttribute('data-type');
        
        if (type === 'user') {
            // Fetch user data via AJAX
            fetch(`/admin/users/get/${id}`)
                .then(response => response.json())
                .then(data => {
                    // Pre-fill form
                    document.getElementById('userModalTitle').textContent = 'Edit User';
                    document.getElementById('userName').value = data.name;
                    document.getElementById('userEmail').value = data.email;
                    document.getElementById('userPhone').value = data.phone;
                    document.getElementById('userAddress').value = data.address;
                    document.getElementById('userRole').value = data.role;
                    // Set image preview
                    if (data.image) {
                        document.getElementById('userImagePreview').src = data.image;
                    } else {
                        document.getElementById('userImagePreview').src = 'https://picsum.photos/seed/user' + id + '/100/100.jpg';
                    }
                    // Update form action
                    document.getElementById('userForm').action = `/admin/users/edit/${id}`;
                    userModal.classList.add('active');
                })
                .catch(error => {
                    showToast('Error fetching user data', 'error');
                    console.error('Error:', error);
                });
        } else if (type === 'medicine') {
            // Fetch medicine data via AJAX
            fetch(`/admin/medicines/get/${id}`)
                .then(response => response.json())
                .then(data => {
                    // Pre-fill form
                    document.getElementById('medicineModalTitle').textContent = 'Edit Medicine';
                    document.getElementById('medicineName').value = data.name;
                    document.getElementById('medicinePrice').value = data.price;
                    document.getElementById('medicineStock').value = data.stock_quantity;
                    document.getElementById('medicineRating').value = data.ratings;
                    document.getElementById('medicineCategory').value = data.category;
                    document.getElementById('medicineDetails').value = data.details;
                    // Set image preview
                    if (data.image) {
                        document.getElementById('medicineImagePreview').src = data.image;
                    } else {
                        document.getElementById('medicineImagePreview').src = 'https://picsum.photos/seed/medicine' + id + '/100/100.jpg';
                    }
                    // Update form action
                    document.getElementById('medicineForm').action = `/admin/medicines/edit/${id}`;
                    medicineModal.classList.add('active');
                })
                .catch(error => {
                    showToast('Error fetching medicine data', 'error');
                    console.error('Error:', error);
                });
        } else if (type === 'order') {
            // Fetch order data via AJAX
            fetch(`/admin/orders/get/${id}`)
                .then(response => response.json())
                .then(data => {
                    // Pre-fill form
                    document.getElementById('orderModalTitle').textContent = 'Edit Order';
                    document.getElementById('orderCustomer').value = data.ordered_by;
                    document.getElementById('orderEmail').value = data.email;
                    document.getElementById('orderPhone').value = data.phone;
                    document.getElementById('orderProduct').value = data.product;
                    document.getElementById('orderQuantity').value = data.quantity;
                    document.getElementById('orderPrice').value = data.price;
                    document.getElementById('orderPayment').value = data.payment_method;
                    document.getElementById('orderStatus').value = data.status;
                    document.getElementById('orderAddress').value = data.address;
                    document.getElementById('orderInstructions').value = data.special_instruction;
                    // Update form action
                    document.getElementById('orderForm').action = `/admin/orders/edit/${id}`;
                    orderModal.classList.add('active');
                })
                .catch(error => {
                    showToast('Error fetching order data', 'error');
                    console.error('Error:', error);
                });
        }
    }
});

// Table Actions - Delete
document.addEventListener('click', (e) => {
    if (e.target.closest('.table-action-btn.delete')) {
        if (confirm('Are you sure you want to delete this item?')) {
            const form = e.target.closest('form');
            if (form) {
                form.submit();
            } else {
                e.target.closest('tr').remove();
                showToast('Item deleted successfully!');
            }
        }
    }
});

// Table Actions - Block/Unblock
document.addEventListener('click', (e) => {
    if (e.target.closest('.table-action-btn.block')) {
        showToast('User blocked successfully!');
    } else if (e.target.closest('.table-action-btn.unblock')) {
        showToast('User unblocked successfully!');
    }
});

// Close modals when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === userModal) {
        userModal.classList.remove('active');
    }
    if (e.target === medicineModal) {
        medicineModal.classList.remove('active');
    }
    if (e.target === orderModal) {
        orderModal.classList.remove('active');
    }
    if (e.target === profileModal) {
        profileModal.classList.remove('active');
    }
    if (e.target === userViewModal) {
        userViewModal.classList.remove('active');
    }
    if (e.target === medicineViewModal) {
        medicineViewModal.classList.remove('active');
    }
    if (e.target === orderViewModal) {
        orderViewModal.classList.remove('active');
    }
});

// Simulate real-time updates - only on dashboard
if (document.getElementById('dashboard')) {
    setInterval(() => {
        // Update stats randomly
        const totalSales = document.getElementById('totalSales');
        if (totalSales) {
            const currentSales = parseInt(totalSales.textContent.replace(/[৳,]/g, ''));
            const newSales = currentSales + Math.floor(Math.random() * 100);
            totalSales.textContent = '৳' + newSales.toLocaleString();
        }
        
        const totalUsers = document.getElementById('totalUsers');
        if (totalUsers) {
            const currentUsers = parseInt(totalUsers.textContent.replace(/,/g, ''));
            const newUsers = currentUsers + Math.floor(Math.random() * 3);
            totalUsers.textContent = newUsers.toLocaleString();
        }
        
        const totalOrders = document.getElementById('totalOrders');
        if (totalOrders) {
            const currentOrders = parseInt(totalOrders.textContent.replace(/,/g, ''));
            const newOrders = currentOrders + Math.floor(Math.random() * 2);
            totalOrders.textContent = newOrders.toLocaleString();
        }
    }, 5000);
}

// Function to initialize charts based on section
function initializeCharts(sectionId) {
    if (sectionId === 'dashboard' || sectionId === 'reports') {
        // Sales Chart
        const salesCtx = document.getElementById('salesChart');
        if (salesCtx) {
            new Chart(salesCtx.getContext('2d'), {
                type: 'line',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                    datasets: [{
                        label: 'Sales',
                        data: [3200, 4100, 3800, 5200, 4900, 6100, 5800, 7200, 6900, 8100, 7800, 9200],
                        backgroundColor: 'rgba(44, 82, 130, 0.1)',
                        borderColor: 'rgba(44, 82, 130, 1)',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return '৳' + value;
                                }
                            }
                        }
                    }
                }
            });
        }
        
        // Order Status Chart
        const orderStatusCtx = document.getElementById('orderStatusChart');
        if (orderStatusCtx) {
            new Chart(orderStatusCtx.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
                    datasets: [{
                        data: [15, 25, 30, 25, 5],
                        backgroundColor: [
                            'rgba(66, 153, 225, 0.8)',
                            'rgba(221, 107, 32, 0.8)',
                            'rgba(56, 161, 105, 0.8)',
                            'rgba(49, 130, 206, 0.8)',
                            'rgba(229, 62, 62, 0.8)'
                        ],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right'
                        }
                    }
                }
            });
        }
        
        // User Growth Chart (only in reports section)
        if (sectionId === 'reports') {
            const userGrowthCtx = document.getElementById('userGrowthChart');
            if (userGrowthCtx) {
                // Get the data from a global variable or data attribute
                let userGrowthData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; // Default data
                
                // Try to get data from a data attribute on the chart element
                if (userGrowthCtx.dataset.userGrowthData) {
                    try {
                        userGrowthData = JSON.parse(userGrowthCtx.dataset.userGrowthData);
                    } catch (e) {
                        console.error('Error parsing user growth data:', e);
                    }
                }
                
                new Chart(userGrowthCtx.getContext('2d'), {
                    type: 'bar',
                    data: {
                        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                        datasets: [{
                            label: 'New Users',
                            data: userGrowthData,
                            backgroundColor: 'rgba(49, 151, 149, 0.8)',
                            borderWidth: 0
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: false
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true
                            }
                        }
                    }
                });
            }
        }
        
        // Top Selling Chart (only in reports section)
        if (sectionId === 'reports') {
            const topSellingCtx = document.getElementById('topSellingChart');
            if (topSellingCtx) {
                // Get the data from global variables or data attributes
                let medicineNames = ['Paracetamol 500mg', 'Vitamin C 1000mg', 'Cough Syrup', 'Ibuprofen 400mg', 'Antihistamine'];
                let medicineSales = [245, 187, 132, 98, 76];
                
                // Try to get data from data attributes on the chart element
                if (topSellingCtx.dataset.medicineNames) {
                    try {
                        medicineNames = JSON.parse(topSellingCtx.dataset.medicineNames);
                    } catch (e) {
                        console.error('Error parsing medicine names:', e);
                    }
                }
                
                if (topSellingCtx.dataset.medicineSales) {
                    try {
                        medicineSales = JSON.parse(topSellingCtx.dataset.medicineSales);
                    } catch (e) {
                        console.error('Error parsing medicine sales:', e);
                    }
                }
                
                new Chart(topSellingCtx.getContext('2d'), {
                    type: 'bar',
                    data: {
                        labels: medicineNames,
                        datasets: [{
                            label: 'Units Sold',
                            data: medicineSales,
                            backgroundColor: 'rgba(221, 107, 32, 0.8)',
                            borderWidth: 0
                        }]
                    },
                    options: {
                        indexAxis: 'y',
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: false
                            }
                        },
                        scales: {
                            x: {
                                beginAtZero: true
                            }
                        }
                    }
                });
            }
        }
    }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Set active section on page load based on URL
    const currentPath = window.location.pathname;
    
    // Find matching menu item
    menuItems.forEach(item => {
        const href = item.getAttribute('href');
        if (href && currentPath.includes(href)) {
            // Remove active class from all items
            menuItems.forEach(i => i.classList.remove('active'));
            // Add active class to current item
            item.classList.add('active');
            
            // Show corresponding section
            const sectionId = item.getAttribute('data-section');
            const section = document.getElementById(sectionId);
            if (section) {
                sections.forEach(s => s.classList.remove('active'));
                section.classList.add('active');
                
                // Initialize charts for this section
                initializeCharts(sectionId);
            }
        }
    });
    
    // Show view modals on page load if needed
    if (currentPath.includes('/admin/users/view/')) {
        userViewModal.classList.add('active');
    } else if (currentPath.includes('/admin/medicines/view/')) {
        medicineViewModal.classList.add('active');
    } else if (currentPath.includes('/admin/orders/view/')) {
        orderViewModal.classList.add('active');
    }
    
    // If no active section is set (e.g., on dashboard), initialize dashboard charts
    const activeSection = document.querySelector('.dashboard-section.active');
    if (activeSection) {
        initializeCharts(activeSection.id);
    }
});
 document.addEventListener("DOMContentLoaded", () => {
  const alerts = document.querySelectorAll(".flash-messages .alert");

  alerts.forEach((alert, i) => {
    // ছোট delay দিয়ে দেখাও
    setTimeout(() => {
      alert.classList.add("show");
    }, i * 150);

    // 2 সেকেন্ড পর hide করো
    setTimeout(() => {
      alert.classList.remove("show");
      alert.classList.add("hide");
      // animation শেষে DOM থেকে remove
      setTimeout(() => alert.remove(), 500);
    }, 2000 + i * 150);
  });
});
