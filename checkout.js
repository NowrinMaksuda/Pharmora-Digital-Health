
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
        // Cart functionality
        const cartItems = document.querySelectorAll('.cart-item');
        const subtotalElement = document.getElementById('subtotal');
        const deliveryChargeElement = document.getElementById('delivery-charge');
        const taxAmountElement = document.getElementById('tax-amount');
        const totalAmountElement = document.getElementById('total-amount');
        const orderSubtotalElement = document.getElementById('order-subtotal');
        const orderDeliveryElement = document.getElementById('order-delivery');
        const orderTaxElement = document.getElementById('order-tax');
        const orderTotalElement = document.getElementById('order-total');
        const discountRowElement = document.getElementById('discount-row');
        const discountAmountElement = document.getElementById('discount-amount');
        const orderDiscountRowElement = document.getElementById('order-discount');
        const orderDiscountAmountElement = document.getElementById('order-discount-amount');
        // Update cart totals
        function updateCartTotals() {
            let subtotal = 0;
            
            cartItems.forEach(item => {
                const price = parseInt(item.getAttribute('data-price'));
                const quantity = parseInt(item.querySelector('.quantity-input').value);
                subtotal += price * quantity;
            });
            
            const deliveryCharge = parseInt(document.querySelector('.delivery-option.selected').getAttribute('data-price'));
            const taxAmount = Math.round(subtotal * 0.05);
            const total = subtotal + deliveryCharge + taxAmount;
            
            // Update cart summary
            subtotalElement.textContent = `৳${subtotal}`;
            deliveryChargeElement.textContent = `৳${deliveryCharge}`;
            taxAmountElement.textContent = `৳${taxAmount}`;
            totalAmountElement.textContent = `৳${total}`;
            
            // Update order summary
            orderSubtotalElement.textContent = `৳${subtotal}`;
            orderDeliveryElement.textContent = `৳${deliveryCharge}`;
            orderTaxElement.textContent = `৳${taxAmount}`;
            orderTotalElement.textContent = `৳${total}`;
        }
        // Quantity controls
        cartItems.forEach(item => {
            const decreaseBtn = item.querySelector('.decrease-qty');
            const increaseBtn = item.querySelector('.increase-qty');
            const quantityInput = item.querySelector('.quantity-input');
            
            decreaseBtn.addEventListener('click', () => {
                let quantity = parseInt(quantityInput.value);
                if (quantity > 1) {
                    quantity--;
                    quantityInput.value = quantity;
                    updateCartTotals();
                    showToast('Quantity updated');
                }
            });
            
            increaseBtn.addEventListener('click', () => {
                let quantity = parseInt(quantityInput.value);
                quantity++;
                quantityInput.value = quantity;
                updateCartTotals();
                showToast('Quantity updated');
            });
        });
        // Remove item
        cartItems.forEach(item => {
            const removeBtn = item.querySelector('.remove-item');
            
            removeBtn.addEventListener('click', () => {
                item.style.opacity = '0';
                item.style.transform = 'translateX(20px)';
                
                setTimeout(() => {
                    item.remove();
                    updateCartTotals();
                    showToast('Item removed from cart');
                }, 300);
            });
        });
        // Delivery options
        const deliveryOptions = document.querySelectorAll('.delivery-option');
        
        deliveryOptions.forEach(option => {
            option.addEventListener('click', () => {
                deliveryOptions.forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                updateCartTotals();
            });
        });
        // Payment options
        const paymentOptions = document.querySelectorAll('.payment-option');
        const paymentForms = document.querySelectorAll('.payment-form');
        
        paymentOptions.forEach(option => {
            option.addEventListener('click', () => {
                paymentOptions.forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                
                // Hide all payment forms
                paymentForms.forEach(form => form.classList.remove('active'));
                
                // Show selected payment form
                const paymentType = option.getAttribute('data-payment');
                if (paymentType === 'mobile') {
                    document.getElementById('mobile-form').classList.add('active');
                } else if (paymentType === 'card') {
                    document.getElementById('card-form').classList.add('active');
                } else if (paymentType === 'bank') {
                    document.getElementById('bank-form').classList.add('active');
                }
            });
        });
        // Promo code
        const promoInput = document.getElementById('promoInput');
        const applyPromoBtn = document.getElementById('applyPromo');
        
        applyPromoBtn.addEventListener('click', () => {
            const promoCode = promoInput.value.trim().toUpperCase();
            
            if (promoCode === 'MED10') {
                const subtotal = parseInt(orderSubtotalElement.textContent.replace('৳', ''));
                const discountAmount = Math.round(subtotal * 0.1);
                const deliveryCharge = parseInt(orderDeliveryElement.textContent.replace('৳', ''));
                const taxAmount = Math.round((subtotal - discountAmount + deliveryCharge) * 0.05);
                const total = subtotal - discountAmount + deliveryCharge + taxAmount;
                
                // Update discount display
                discountRowElement.style.display = 'flex';
                discountAmountElement.textContent = `-৳${discountAmount}`;
                orderDiscountRowElement.style.display = 'flex';
                orderDiscountAmountElement.textContent = `-৳${discountAmount}`;
                
                // Update total
                totalAmountElement.textContent = `৳${total}`;
                orderTotalElement.textContent = `৳${total}`;
                
                showToast('Promo code applied successfully!');
            } else if (promoCode === '') {
                showToast('Please enter a promo code');
            } else {
                showToast('Invalid promo code');
            }
        });
        // Place order
        const placeOrderBtn = document.getElementById('placeOrderBtn');
        const orderConfirmationModal = document.getElementById('orderConfirmationModal');
        const orderConfirmationModalClose = document.getElementById('orderConfirmationModalClose');
        const orderIdElement = document.getElementById('orderId');
        const orderTotalAmount = document.getElementById('orderTotalAmount');
        const estimatedDelivery = document.getElementById('estimatedDelivery');
        const continueShoppingBtn = document.getElementById('continueShoppingBtn');
        
        placeOrderBtn.addEventListener('click', () => {
            // Validate delivery form
            const deliveryForm = document.getElementById('deliveryForm');
            const firstName = document.getElementById('firstName').value;
            const lastName = document.getElementById('lastName').value;
            const email = document.getElementById('email').value;
            const phone = document.getElementById('phone').value;
            const address = document.getElementById('address').value;
            const city = document.getElementById('city').value;
            const postalCode = document.getElementById('postalCode').value;
            
            if (!firstName || !lastName || !email || !phone || !address || !city || !postalCode) {
                showToast('Please fill in all required fields');
                return;
            }
            
            // Validate payment selection
            const selectedPayment = document.querySelector('.payment-option.selected');
            if (!selectedPayment) {
                showToast('Please select a payment method');
                return;
            }
            
            // Generate random order ID
            const orderId = 'ORD-' + Math.floor(Math.random() * 1000000);
            
            // Show order confirmation modal
            orderIdElement.textContent = orderId;
            orderTotalAmount.textContent = orderTotalElement.textContent;
            
            // Set estimated delivery based on selected delivery option
            const selectedDelivery = document.querySelector('.delivery-option.selected');
            if (selectedDelivery.getAttribute('data-delivery') === 'standard') {
                estimatedDelivery.textContent = '2-3 business days';
            } else if (selectedDelivery.getAttribute('data-delivery') === 'express') {
                estimatedDelivery.textContent = '1-2 business days';
            } else {
                estimatedDelivery.textContent = 'Same day';
            }
            
            orderConfirmationModal.classList.add('active');
        });
        
        orderConfirmationModalClose.addEventListener('click', () => {
            orderConfirmationModal.classList.remove('active');
        });
        
        continueShoppingBtn.addEventListener('click', () => {
            orderConfirmationModal.classList.remove('active');
            // Redirect to home page or continue shopping
            window.location.href = 'index.html';
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
