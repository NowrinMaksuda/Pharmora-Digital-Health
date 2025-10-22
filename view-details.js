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
if (userProfile) {
    userProfile.addEventListener('click', () => {
        dropdownMenu.classList.toggle('active');
    });
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    if (userProfile && !userProfile.contains(e.target) && !dropdownMenu.contains(e.target)) {
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
        if (dropdownMenu) dropdownMenu.classList.remove('active');
    });
}

if (signupBtn) {
    signupBtn.addEventListener('click', (e) => {
        e.preventDefault();
        signupModal.classList.add('active');
        if (dropdownMenu) dropdownMenu.classList.remove('active');
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

// Toast notification
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast show';
    
    // Add type-specific styling
    if (type === 'success') {
        toast.style.backgroundColor = '#38a169';
    } else if (type === 'error') {
        toast.style.backgroundColor = '#e53e3e';
    } else {
        toast.style.backgroundColor = '#3182ce';
    }
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Function to check if user is logged in
function isUserLoggedIn() {
    // Check if user dropdown contains a logout link (indicates user is logged in)
    const userDropdown = document.querySelector('.user-dropdown');
    if (userDropdown) {
        return userDropdown.querySelector('a[href*="logout"]') !== null;
    }
    return false;
}

// Add to Cart functionality
const addToCartBtn = document.getElementById('addToCartBtn');
if (addToCartBtn) {
    addToCartBtn.addEventListener('click', () => {
        // Check if user is logged in
        if (!isUserLoggedIn()) {
            showToast('Please login to add items to cart', 'error');
            // Open login modal after a short delay
            setTimeout(() => {
                loginModal.classList.add('active');
            }, 1500);
            return;
        }
        
        const medicineId = addToCartBtn.getAttribute('data-id');
        
        // Add to cart
        fetch('/add_to_cart', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({ 
                medicine_id: medicineId, 
                quantity: 1 
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showToast('Item added to cart successfully!', 'success');
                // Update cart count
                const cartCount = document.querySelector('.cart-count');
                cartCount.textContent = data.cart_count;
            } else {
                showToast(data.message || 'Failed to add item to cart', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('Error adding item to cart', 'error');
        });
    });
}

// Buy Now functionality - Note: This is now handled by form submission in HTML
// No need for JavaScript event listener here

// Add to Cart for recommended medicines
document.querySelectorAll('.add-to-cart-btn').forEach(button => {
    button.addEventListener('click', (e) => {
        // Check if user is logged in
        if (!isUserLoggedIn()) {
            showToast('Please login to add items to cart', 'error');
            // Open login modal after a short delay
            setTimeout(() => {
                loginModal.classList.add('active');
            }, 1500);
            return;
        }
        
        // Get medicine card
        const medicineCard = button.closest('.medicine-card');
        if (!medicineCard) return;
        
        // Get medicine ID from data attribute
        const medicineId = medicineCard.getAttribute('data-medicine-id');
        
        if (!medicineId) {
            showToast('Could not determine medicine ID', 'error');
            return;
        }
        
        // Add to cart
        fetch('/add_to_cart', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({ 
                medicine_id: medicineId, 
                quantity: 1 
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const medicineName = medicineCard.querySelector('.medicine-card-title').textContent;
                showToast(`${medicineName} added to cart!`, 'success');
                // Update cart count
                const cartCount = document.querySelector('.cart-count');
                cartCount.textContent = data.cart_count;
            } else {
                showToast(data.message || 'Failed to add item to cart', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('Error adding item to cart', 'error');
        });
    });
});

// Handle Buy Now form submission
const buyNowForm = document.querySelector('form[action="{{ url_for(\'buy_now\') }}"]');
if (buyNowForm) {
    buyNowForm.addEventListener('submit', (e) => {
        // Check if user is logged in
        if (!isUserLoggedIn()) {
            e.preventDefault();
            showToast('Please login to purchase items', 'error');
            // Open login modal after a short delay
            setTimeout(() => {
                loginModal.classList.add('active');
            }, 1500);
            return;
        }
        // If logged in, let the form submit normally
    });
}

// Newsletter Form
const newsletterForm = document.getElementById('newsletterForm');
if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const emailInput = newsletterForm.querySelector('.newsletter-input');
        const email = emailInput.value.trim();
        
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showToast('Please enter a valid email address', 'error');
            return;
        }
        
        // Submit the form
        fetch('{{ url_for("subscribe") }}', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({ 
                email: email 
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showToast('Thank you for subscribing to our newsletter!', 'success');
                emailInput.value = '';
            } else {
                showToast(data.message || 'There was an error subscribing. Please try again.', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('There was an error subscribing. Please try again.', 'error');
        });
    });
}
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
