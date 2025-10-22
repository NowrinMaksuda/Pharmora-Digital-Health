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

// Contact Form
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Get form values
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const subject = document.getElementById('subject').value;
        const message = document.getElementById('message').value.trim();
        const newsletter = document.getElementById('newsletter').checked;
        
        // Basic validation
        if (!name || !email || !subject || !message) {
            showToast('Please fill in all required fields', 'error');
            return;
        }
        
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showToast('Please enter a valid email address', 'error');
            return;
        }
        
        // Phone validation (if provided)
        if (phone && !/^[0-9+\-\s]+$/.test(phone)) {
            showToast('Please enter a valid phone number', 'error');
            return;
        }
        
        // Submit the form
        fetch('{{ url_for("contact") }}', {
            method: 'POST',
            body: new FormData(contactForm)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showToast('Thank you for your message! We will get back to you soon.', 'success');
                contactForm.reset();
            } else {
                showToast('There was an error sending your message. Please try again.', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('There was an error sending your message. Please try again.', 'error');
        });
    });
}

// FAQ Toggle
const faqItems = document.querySelectorAll('.faq-item');

faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');
    const icon = question.querySelector('.faq-icon');
    
    question.addEventListener('click', () => {
        // Toggle active class
        const isActive = item.classList.toggle('active');
        
        // Toggle answer visibility
        if (isActive) {
            answer.style.maxHeight = answer.scrollHeight + 'px';
            icon.classList.remove('fa-chevron-down');
            icon.classList.add('fa-chevron-up');
        } else {
            answer.style.maxHeight = '0';
            icon.classList.remove('fa-chevron-up');
            icon.classList.add('fa-chevron-down');
        }
        
        // Close other FAQ items
        faqItems.forEach(otherItem => {
            if (otherItem !== item && otherItem.classList.contains('active')) {
                otherItem.classList.remove('active');
                const otherAnswer = otherItem.querySelector('.faq-answer');
                const otherIcon = otherItem.querySelector('.faq-question .faq-icon');
                otherAnswer.style.maxHeight = '0';
                otherIcon.classList.remove('fa-chevron-up');
                otherIcon.classList.add('fa-chevron-down');
            }
        });
    });
});

// Live Chat Button
const liveChatBtn = document.getElementById('liveChatBtn');
if (liveChatBtn) {
    liveChatBtn.addEventListener('click', () => {
        showToast('Live chat feature coming soon!', 'info');
    });
}

// Emergency Chat Button
const emergencyChatBtn = document.getElementById('emergencyChatBtn');
if (emergencyChatBtn) {
    emergencyChatBtn.addEventListener('click', () => {
        showToast('Emergency chat feature coming soon!', 'info');
    });
}

// Add event listeners to contact buttons
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('contact-button')) {
        const buttonText = e.target.textContent.trim();
        
        if (buttonText === 'Call Now') {
            // The button is already an anchor tag with tel: link, so it will work automatically
            showToast('Redirecting to call...', 'info');
        } else if (buttonText === 'Send Email') {
            // The button is already an anchor tag with mailto: link, so it will work automatically
            showToast('Opening email client...', 'info');
        } else if (buttonText === 'Get Directions') {
            // The button is already an anchor tag with Google Maps link, so it will work automatically
            showToast('Opening map directions...', 'info');
        }
    }
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

// Initialize FAQ answers with max-height: 0
document.addEventListener('DOMContentLoaded', () => {
    const faqAnswers = document.querySelectorAll('.faq-answer');
    faqAnswers.forEach(answer => {
        answer.style.maxHeight = '0';
        answer.style.overflow = 'hidden';
        answer.style.transition = 'max-height 0.3s ease-out';
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
