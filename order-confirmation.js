    
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
        loginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            loginModal.classList.add('active');
            dropdownMenu.classList.remove('active');
        });
        signupBtn.addEventListener('click', (e) => {
            e.preventDefault();
            signupModal.classList.add('active');
            dropdownMenu.classList.remove('active');
        });
        loginModalClose.addEventListener('click', () => {
            loginModal.classList.remove('active');
        });
        signupModalClose.addEventListener('click', () => {
            signupModal.classList.remove('active');
        });
        switchToSignup.addEventListener('click', (e) => {
            e.preventDefault();
            loginModal.classList.remove('active');
            signupModal.classList.add('active');
        });
        switchToLogin.addEventListener('click', (e) => {
            e.preventDefault();
            signupModal.classList.remove('active');
            loginModal.classList.add('active');
        });
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
        function showToast(message) {
            const toast = document.getElementById('toast');
            toast.textContent = message;
            toast.classList.add('show');
            
            setTimeout(() => {
                toast.classList.remove('show');
            }, 3000);
        }
        // Get order details from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const orderId = urlParams.get('orderId') || 'ORD-724856';
        const orderTotal = urlParams.get('total') || '৳913.50';
        const paymentMethod = urlParams.get('payment') || 'Cash on Delivery';
        const deliveryMethod = urlParams.get('delivery') || 'standard';
        const deliveryAddress = urlParams.get('address') || '123 Main Street, Dhaka, Bangladesh';
        
        // Set order details
        document.getElementById('orderId').textContent = orderId;
        document.getElementById('orderTotal').textContent = orderTotal;
        document.getElementById('paymentMethod').textContent = paymentMethod;
        document.getElementById('deliveryAddress').textContent = deliveryAddress;
        
        // Set estimated delivery based on delivery method
        let estimatedDeliveryText = '2-3 business days';
        if (deliveryMethod === 'express') {
            estimatedDeliveryText = '1-2 business days';
        } else if (deliveryMethod === 'sameday') {
            estimatedDeliveryText = 'Same day';
        }
        document.getElementById('estimatedDelivery').textContent = estimatedDeliveryText;
        
        // Set current date
        const currentDate = new Date();
        const formattedDate = currentDate.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        document.getElementById('orderDate').textContent = formattedDate;
        
        // Download invoice functionality
        document.getElementById('downloadInvoiceBtn').addEventListener('click', () => {
            // In a real application, this would generate and download a PDF invoice
            showToast('Invoice downloaded successfully!');
            
            // For demo purposes, we'll create a simple text invoice and download it
            const invoiceContent = `
MEDIHOME INVOICE
================

Order ID: ${orderId}
Order Date: ${formattedDate}
Payment Method: ${paymentMethod}
Delivery Method: ${deliveryMethod}
Estimated Delivery: ${estimatedDeliveryText}
Delivery Address: ${deliveryAddress}

Order Total: ${orderTotal}

Thank you for shopping with MediHome!
            `;
            
            const blob = new Blob([invoiceContent], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `invoice-${orderId}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
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
