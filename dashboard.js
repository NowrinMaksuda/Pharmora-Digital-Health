document.addEventListener('DOMContentLoaded', function() {
    // Theme Toggle
    const themeToggle = document.getElementById('themeToggle');
    const body = document.body;
    const themeIcon = themeToggle.querySelector('i');
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
    
    // Mobile Menu Toggle
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const navLinks = document.getElementById('navLinks');
    mobileMenuToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        
        if (navLinks.classList.contains('active')) {
            mobileMenuToggle.innerHTML = '<i class="fas fa-times"></i>';
        } else {
            mobileMenuToggle.innerHTML = '<i class="fas fa-bars"></i>';
        }
    });
    
    // User Dropdown
    const userProfile = document.getElementById('userProfile');
    const dropdownMenu = document.getElementById('dropdownMenu');
    userProfile.addEventListener('click', () => {
        dropdownMenu.classList.toggle('active');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!userProfile.contains(e.target) && !dropdownMenu.contains(e.target)) {
            dropdownMenu.classList.remove('active');
        }
    });
    
    // Modal functionality
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const loginModal = document.getElementById('loginModal');
    const signupModal = document.getElementById('signupModal');
    const loginModalClose = document.getElementById('loginModalClose');
    const signupModalClose = document.getElementById('signupModalClose');
    const switchToSignup = document.getElementById('switchToSignup');
    const switchToLogin = document.getElementById('switchToLogin');
    
    if (loginBtn) {
        loginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            loginModal.classList.add('active');
            dropdownMenu.classList.remove('active');
        });
    }
    
    if (signupBtn) {
        signupBtn.addEventListener('click', (e) => {
            e.preventDefault();
            signupModal.classList.add('active');
            dropdownMenu.classList.remove('active');
        });
    }
    
    if (loginModalClose) {
        loginModalClose.addEventListener('click', () => {
            loginModal.classList.remove('active');
        });
    }
    
    if (signupModalClose) {
        signupModalClose.addEventListener('click', () => {
            signupModal.classList.remove('active');
        });
    }
    
    if (switchToSignup) {
        switchToSignup.addEventListener('click', (e) => {
            e.preventDefault();
            loginModal.classList.remove('active');
            signupModal.classList.add('active');
        });
    }
    
    if (switchToLogin) {
        switchToLogin.addEventListener('click', (e) => {
            e.preventDefault();
            signupModal.classList.remove('active');
            loginModal.classList.add('active');
        });
    }
    
    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === loginModal) {
            loginModal.classList.remove('active');
        }
        if (e.target === signupModal) {
            signupModal.classList.remove('active');
        }
    });
    
    // Update Profile Modal
    const updateProfileBtn = document.getElementById('updateProfileBtn');
    const updateProfileModal = document.getElementById('updateProfileModal');
    const updateProfileModalClose = document.getElementById('updateProfileModalClose');
    
    if (updateProfileBtn) {
        updateProfileBtn.addEventListener('click', () => {
            updateProfileModal.classList.add('active');
        });
    }
    
    if (updateProfileModalClose) {
        updateProfileModalClose.addEventListener('click', () => {
            updateProfileModal.classList.remove('active');
        });
    }
    
    // Close update profile modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === updateProfileModal) {
            updateProfileModal.classList.remove('active');
        }
    });
    
    // Tab Navigation
    const menuItems = document.querySelectorAll('.menu-item');
    const tabContents = document.querySelectorAll('.tab-content');
    
    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active class from all menu items and tab contents
            menuItems.forEach(i => i.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked menu item
            item.classList.add('active');
            
            // Show corresponding tab content
            const tabId = item.getAttribute('data-tab');
            const tabContent = document.getElementById(tabId);
            if (tabContent) {
                tabContent.classList.add('active');
            }
        });
    });
    
    // View all orders button
    const viewAllBtn = document.querySelector('.view-all-btn');
    if (viewAllBtn) {
        viewAllBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all menu items and tab contents
            menuItems.forEach(i => i.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to orders menu item and tab content
            const ordersMenuItem = document.querySelector('[data-tab="orders"]');
            const ordersTabContent = document.getElementById('orders');
            
            if (ordersMenuItem && ordersTabContent) {
                ordersMenuItem.classList.add('active');
                ordersTabContent.classList.add('active');
            }
        });
    }
    
    // Toast notification
    function showToast(message) {
        const toast = document.getElementById('toast');
        if (toast) {
            toast.textContent = message;
            toast.classList.add('show');
            
            setTimeout(() => {
                toast.classList.remove('show');
            }, 3000);
        }
    }
    
    // File Upload
    const uploadContainer = document.getElementById('uploadContainer');
    const uploadBtn = document.getElementById('uploadBtn');
    const fileInput = document.getElementById('fileInput');
    const prescriptionForm = document.getElementById('prescriptionForm');
    const cancelPrescriptionBtn = document.getElementById('cancelPrescriptionBtn');
    
    if (uploadBtn && fileInput && prescriptionForm) {
        uploadBtn.addEventListener('click', () => {
            fileInput.click();
        });
        
        fileInput.addEventListener('change', () => {
            if (fileInput.files.length) {
                prescriptionForm.style.display = 'block';
            }
        });
        
        if (cancelPrescriptionBtn) {
            cancelPrescriptionBtn.addEventListener('click', () => {
                prescriptionForm.style.display = 'none';
                fileInput.value = '';
            });
        }
    }
    
    if (uploadContainer) {
        uploadContainer.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadContainer.classList.add('dragover');
        });
        
        uploadContainer.addEventListener('dragleave', () => {
            uploadContainer.classList.remove('dragover');
        });
        
        uploadContainer.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadContainer.classList.remove('dragover');
            
            if (e.dataTransfer.files.length) {
                handleFiles(e.dataTransfer.files);
            }
        });
    }
    
    function handleFiles(files) {
        [...files].forEach(file => {
            showToast(`${file.name} uploaded successfully`);
        });
    }
    
    // Order Tracking
    const trackingBtn = document.querySelector('.tracking-btn');
    const trackingInput = document.querySelector('.tracking-input');
    const trackingResult = document.getElementById('trackingResult');
    
    if (trackingBtn && trackingInput && trackingResult) {
        trackingBtn.addEventListener('click', () => {
            if (trackingInput.value.trim() !== '') {
                trackingResult.classList.add('active');
                showToast('Tracking information updated');
            } else {
                showToast('Please enter an order ID');
            }
        });
    }
    
    // Add event listeners to buttons
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('order-btn') || e.target.classList.contains('view-all-btn') || e.target.classList.contains('add-to-cart-btn')) {
            const buttonText = e.target.textContent.trim();
            
            if (buttonText === 'View') {
                showToast('Order details viewed');
            } else if (buttonText === 'Reorder') {
                showToast('Reorder placed successfully');
            } else if (buttonText === 'Cancel') {
                if (confirm('Are you sure you want to cancel this order?')) {
                    showToast('Order cancelled successfully');
                }
            } else if (buttonText === 'Track') {
                showToast('Tracking information updated');
            } else if (buttonText === 'Invoice') {
                showToast('Invoice downloaded');
            } else if (buttonText === 'Review') {
                showToast('Review form opened');
            } else if (buttonText === 'View All Orders') {
                // Switch to orders tab
                menuItems.forEach(i => i.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                
                const ordersMenuItem = document.querySelector('[data-tab="orders"]');
                const ordersTabContent = document.getElementById('orders');
                
                if (ordersMenuItem && ordersTabContent) {
                    ordersMenuItem.classList.add('active');
                    ordersTabContent.classList.add('active');
                }
            } else if (buttonText === 'Add to Cart') {
                showToast('Item added to cart');
            }
        }
    });
    
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                window.scrollTo({
                    top: target.offsetTop - 80,
                    behavior: 'smooth'
                });
                
                // Close mobile menu if open
                if (navLinks) {
                    navLinks.classList.remove('active');
                }
                if (mobileMenuToggle) {
                    mobileMenuToggle.innerHTML = '<i class="fas fa-bars"></i>';
                }
            }
        });
    });
    
    // Auto-hide flash messages after 5 seconds
    const flashMessages = document.querySelectorAll('.alert');
    if (flashMessages) {
        flashMessages.forEach(function(message) {
            setTimeout(function() {
                message.style.display = 'none';
            }, 5000);
        });
    }
    
    // Quick action handlers
    document.querySelectorAll('.action-card').forEach(card => {
        card.addEventListener('click', function() {
            const action = this.getAttribute('data-action');
            
            switch(action) {
                case 'new-order':
                    window.location.href = "{{ url_for('medicines') }}";
                    break;
                case 'upload-rx':
                    document.querySelector('[data-tab="prescription"]').click();
                    break;
                case 'support':
                    window.location.href = "{{ url_for('contact') }}";
                    break;
                case 'give-review':
                    document.getElementById('reviewModal').style.display = 'flex';
                    break;
            }
        });
    });
    
    // Reorder button handlers
    document.querySelectorAll('.reorder-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const orderId = this.getAttribute('data-order-id');
            // Create the URL with the actual order ID
            const url = "{{ url_for('reorder_order', order_id=0) }}".replace('0', orderId);
            window.location.href = url;
        });
    });
    
    // Review modal handlers (simplified)
    const reviewModal = document.getElementById('reviewModal');
    const reviewModalClose = document.getElementById('reviewModalClose');
    const cancelReviewBtn = document.getElementById('cancelReviewBtn');
    
    if (reviewModalClose) {
        reviewModalClose.addEventListener('click', function() {
            reviewModal.style.display = 'none';
        });
    }
    
    if (cancelReviewBtn) {
        cancelReviewBtn.addEventListener('click', function() {
            reviewModal.style.display = 'none';
        });
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
