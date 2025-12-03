// Mobile menu handler
(function() {
    // Create mobile menu button
    const mobileMenuBtn = document.createElement('button');
    mobileMenuBtn.className = 'mobile-menu-toggle';
    mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
    mobileMenuBtn.setAttribute('aria-label', 'Toggle Menu');
    
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'mobile-overlay';
    
    // Add to page
    document.body.appendChild(mobileMenuBtn);
    document.body.appendChild(overlay);
    
    const sidebar = document.querySelector('.sidebar');
    
    // Toggle menu
    function toggleMenu() {
        sidebar.classList.toggle('mobile-open');
        overlay.classList.toggle('active');
        
        // Update icon
        const icon = mobileMenuBtn.querySelector('i');
        if (sidebar.classList.contains('mobile-open')) {
            icon.className = 'fas fa-times';
        } else {
            icon.className = 'fas fa-bars';
        }
    }
    
    // Close menu
    function closeMenu() {
        sidebar.classList.remove('mobile-open');
        overlay.classList.remove('active');
        const icon = mobileMenuBtn.querySelector('i');
        icon.className = 'fas fa-bars';
    }
    
    // Event listeners
    mobileMenuBtn.addEventListener('click', toggleMenu);
    overlay.addEventListener('click', closeMenu);
    
    // Close menu when clicking a menu item
    if (sidebar) {
        sidebar.addEventListener('click', (e) => {
            if (e.target.closest('a[data-route]')) {
                // Small delay to allow navigation to start
                setTimeout(closeMenu, 100);
            }
        });
    }
    
    // Close menu on window resize to desktop
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (window.innerWidth > 1024) {
                closeMenu();
            }
        }, 250);
    });
    
    // Handle escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidebar.classList.contains('mobile-open')) {
            closeMenu();
        }
    });
})();
