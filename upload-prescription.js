  
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
        // File upload functionality
        const fileUploadArea = document.getElementById('fileUploadArea');
        const fileInput = document.getElementById('fileInput');
        const browseBtn = document.getElementById('browseBtn');
        const filePreviewContainer = document.getElementById('filePreviewContainer');
        const prescriptionForm = document.getElementById('prescriptionForm');

        // Trigger file input when browse button is clicked
        browseBtn.addEventListener('click', () => {
            fileInput.click();
        });

        // Trigger file input when upload area is clicked
        fileUploadArea.addEventListener('click', () => {
            fileInput.click();
        });

        // Handle file selection
        fileInput.addEventListener('change', (e) => {
            handleFiles(e.target.files);
        });

        // Handle drag and drop
        fileUploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            fileUploadArea.classList.add('dragover');
        });

        fileUploadArea.addEventListener('dragleave', () => {
            fileUploadArea.classList.remove('dragover');
        });

        fileUploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            fileUploadArea.classList.remove('dragover');
            handleFiles(e.dataTransfer.files);
        });

        // Function to handle files
        function handleFiles(files) {
            if (files.length === 0) return;

            Array.from(files).forEach(file => {
                // Check if file is an image
                if (!file.type.match('image.*')) {
                    showToast('Please upload only image files');
                    return;
                }

                const reader = new FileReader();
                reader.onload = (e) => {
                    const filePreview = document.createElement('div');
                    filePreview.className = 'file-preview';
                    filePreview.innerHTML = `
                        <img src="${e.target.result}" alt="${file.name}">
                        <button class="remove-file" data-file="${file.name}"><i class="fas fa-times"></i></button>
                    `;
                    filePreviewContainer.appendChild(filePreview);

                    // Add event listener to remove button
                    const removeBtn = filePreview.querySelector('.remove-file');
                    removeBtn.addEventListener('click', () => {
                        filePreview.remove();
                    });
                };
                reader.readAsDataURL(file);
            });
        }

        // Form submission
        prescriptionForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Validate form
            const patientName = document.getElementById('patientName').value;
            const patientAge = document.getElementById('patientAge').value;
            const patientPhone = document.getElementById('patientPhone').value;
            const patientAddress = document.getElementById('patientAddress').value;

            if (!patientName || !patientAge || !patientPhone || !patientAddress) {
                showToast('Please fill in all required fields');
                return;
            }

            // Check if at least one file is uploaded
            if (filePreviewContainer.children.length === 0) {
                showToast('Please upload at least one prescription image');
                return;
            }

            // Here you would normally send the form data to the server
            showToast('Prescription uploaded successfully! Our pharmacist will review it shortly.');
            prescriptionForm.reset();
            filePreviewContainer.innerHTML = '';
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
