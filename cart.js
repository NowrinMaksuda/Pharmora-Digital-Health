
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
        const cartCount = document.getElementById('cartCount');
        const clearCartBtn = document.getElementById('clearCartBtn');
        const subtotalElement = document.getElementById('subtotal');
        const discountElement = document.getElementById('discount');
        const deliveryElement = document.getElementById('delivery');
        const taxElement = document.getElementById('tax');
        const totalElement = document.getElementById('total');
        const standardDelivery = document.getElementById('standard');
        const expressDelivery = document.getElementById('express');

        // Update cart count
        function updateCartCount() {
            const count = document.querySelectorAll('.cart-item').length;
            cartCount.textContent = count;
        }

        // Calculate and update price breakdown
        function updatePriceBreakdown() {
            let subtotal = 0;
            
            cartItems.forEach(item => {
                const priceText = item.querySelector('.cart-item-price').textContent;
                const price = parseInt(priceText.replace('৳', ''));
                const quantity = parseInt(item.querySelector('.quantity-input').value);
                subtotal += price * quantity;
            });
            
            const discount = 0; // Could be calculated based on promo code
            const deliveryFee = expressDelivery.checked ? 150 : 50;
            const tax = Math.round(subtotal * 0.1); // 10% tax
            const total = subtotal - discount + deliveryFee + tax;
            
            subtotalElement.textContent = `৳${subtotal}`;
            discountElement.textContent = `-৳${discount}`;
            deliveryElement.textContent = `৳${deliveryFee}`;
            taxElement.textContent = `৳${tax}`;
            totalElement.textContent = `৳${total}`;
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
                    updatePriceBreakdown();
                    showToast('Quantity updated');
                }
            });
            
            increaseBtn.addEventListener('click', () => {
                let quantity = parseInt(quantityInput.value);
                quantity++;
                quantityInput.value = quantity;
                updatePriceBreakdown();
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
                    updateCartCount();
                    updatePriceBreakdown();
                    showToast('Item removed from cart');
                }, 300);
            });
        });

        // Clear cart
        clearCartBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear your cart?')) {
                cartItems.forEach(item => {
                    item.style.opacity = '0';
                    item.style.transform = 'translateX(20px)';
                });
                
                setTimeout(() => {
                    document.querySelector('.cart-items').innerHTML = '<div class="empty-cart-message" style="text-align: center; padding: 40px 0; color: #718096;"><i class="fas fa-shopping-cart" style="font-size: 48px; margin-bottom: 15px; display: block;"></i><p>Your cart is empty</p></div>';
                    updateCartCount();
                    updatePriceBreakdown();
                    showToast('Cart cleared');
                }, 300);
            }
        });

        // Save for later
        cartItems.forEach(item => {
            const saveBtn = item.querySelector('.save-later');
            
            saveBtn.addEventListener('click', () => {
                showToast('Item saved for later');
            });
        });

        // Delivery options
        standardDelivery.addEventListener('change', updatePriceBreakdown);
        expressDelivery.addEventListener('change', updatePriceBreakdown);

        // Add to cart buttons in recommendations
        const addToCartBtns = document.querySelectorAll('.add-to-cart-btn');
        
        addToCartBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                btn.textContent = 'Added!';
                btn.style.backgroundColor = '#38a169';
                
                setTimeout(() => {
                    btn.textContent = 'Add to Cart';
                    btn.style.backgroundColor = '';
                }, 2000);
                
                showToast('Item added to cart');
            });
        });

        // Initialize price breakdown
        updatePriceBreakdown();

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
