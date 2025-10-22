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

// Service button click handlers
document.addEventListener('DOMContentLoaded', function() {
    // Service buttons
    const consultationBtn = document.getElementById('consultationBtn');
    const deliveryBtn = document.getElementById('deliveryBtn');
    const prescriptionBtn = document.getElementById('prescriptionBtn');
    const checkupBtn = document.getElementById('checkupBtn');
    const reminderBtn = document.getElementById('reminderBtn');
    const emergencyBtn = document.getElementById('emergencyBtn');
    
    if (consultationBtn) {
        consultationBtn.addEventListener('click', () => {
            showToast('Online consultation service coming soon!', 'info');
        });
    }
    
    if (deliveryBtn) {
        deliveryBtn.addEventListener('click', () => {
            showToast('Medicine delivery service available now!', 'success');
            // Redirect to medicines page
            window.location.href = '{{ url_for("medicines") }}';
        });
    }
    
    if (prescriptionBtn) {
        prescriptionBtn.addEventListener('click', () => {
            showToast('Prescription upload service coming soon!', 'info');
        });
    }
    
    if (checkupBtn) {
        checkupBtn.addEventListener('click', () => {
            showToast('Health checkup service coming soon!', 'info');
        });
    }
    
    if (reminderBtn) {
        reminderBtn.addEventListener('click', () => {
            showToast('Medicine reminder service coming soon!', 'info');
        });
    }
    
    if (emergencyBtn) {
        emergencyBtn.addEventListener('click', () => {
            showToast('Emergency support available 24/7!', 'success');
            // Redirect to contact page
            window.location.href = '{{ url_for("contact") }}';
        });
    }
    
    // Get Started button click handlers
    const getStartedButtons = document.querySelectorAll('.specialized-button');
    getStartedButtons.forEach(button => {
        button.addEventListener('click', () => {
            const serviceName = button.closest('.specialized-card').querySelector('.specialized-title').textContent;
            showToast(`${serviceName} service coming soon!`, 'info');
        });
    });
    
    // Choose Plan button click handlers
    const planButtons = document.querySelectorAll('.plan-button');
    planButtons.forEach(button => {
        button.addEventListener('click', () => {
            const planName = button.closest('.pricing-card').querySelector('.plan-name').textContent;
            showToast(`${planName} selection coming soon!`, 'info');
        });
    });
});

// Newsletter Form
const newsletterForm = document.querySelector('.newsletter-form');
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
            body: new FormData(newsletterForm)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showToast('Thank you for subscribing to our newsletter!', 'success');
                emailInput.value = '';
            } else {
                showToast('There was an error subscribing. Please try again.', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('There was an error subscribing. Please try again.', 'error');
        });
    });
}

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
            navLinks.classList.remove('active');
            mobileMenuToggle.innerHTML = '<i class="fas fa-bars"></i>';
        }
    });
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
