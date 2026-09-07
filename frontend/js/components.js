// js/components.js - Inline header and footer (works without server)
(function () {
    'use strict';

    $(document).ready(function () {
        console.log('Loading components...');
        loadComponents();
    });

    function loadComponents() {
        loadHeader();
        loadFooter();

        setTimeout(function () {
            setActiveNavigation();
            updateCartCount();
            console.log('Components loaded successfully!');
        }, 100);
    }

    function loadHeader() {
        var headerHTML = `
            <header id="header" class="site-header text-black">
                <nav id="header-nav" class="navbar navbar-expand-lg px-3 mb-3">
                    <div class="container-fluid">
                        <a class="navbar-brand" href="index.html">
                            <img src="images/main-logo.png" class="logo" alt="Sunil Sawane Art Gallery">
                        </a>
                        
                        <button class="navbar-toggler d-flex d-lg-none order-3 p-2" type="button" 
                                data-bs-toggle="offcanvas" data-bs-target="#bdNavbar" 
                                aria-controls="bdNavbar" aria-expanded="false" aria-label="Toggle navigation">
                            <svg class="navbar-icon" width="50" height="50">
                                <use xlink:href="#navbar-icon"></use>
                            </svg>
                        </button>
                        
                        <div class="offcanvas offcanvas-end" tabindex="-1" id="bdNavbar" 
                             aria-labelledby="bdNavbarOffcanvasLabel">
                            <div class="offcanvas-header px-4 pb-0">
                                <a class="navbar-brand" href="index.html">
                                    <img src="images/main-logo.png" class="logo" alt="Sunil Sawane">
                                </a>
                                <button type="button" class="btn-close btn-close-black" 
                                        data-bs-dismiss="offcanvas" aria-label="Close" 
                                        data-bs-target="#bdNavbar"></button>
                            </div>
                            
                            <div class="offcanvas-body">
                                <ul id="navbar" class="navbar-nav text-uppercase justify-content-end align-items-center flex-grow-1 pe-3">
                                    <li class="nav-item">
                                        <a class="nav-link me-4" href="index.html">Home</a>
                                    </li>
                                    <li class="nav-item">
                                        <a class="nav-link me-4" href="about-us.html">About</a>
                                    </li>
                                    <li class="nav-item">
                                        <a class="nav-link me-4" href="gallery.html">Gallery</a>
                                    </li>
                                    <li class="nav-item">
                                        <a class="nav-link me-4" href="shop.html">Shop</a>
                                    </li>
                                    <li class="nav-item">
                                        <a class="nav-link me-4" href="contact.html">Contact</a>
                                    </li>
                                    <li class="nav-action-item cart-nav-item">
                                        <a class="header-action-link position-relative" href="cart.html" aria-label="View cart">
                                            <svg class="cart" width="18" height="18">
                                                <use xlink:href="#cart"></use>
                                            </svg>
                                            <span class="cart-count header-action-badge badge bg-danger position-absolute top-0 start-100 translate-middle" style="display:none;">0</span>
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </nav>
            </header>
        `;

        $('#header-placeholder').html(headerHTML);
    }

    function loadFooter() {
        var footerHTML = `
            <footer id="footer" class="gallery-footer overflow-hidden">
                <div class="container-fluid gallery-footer-container">
                    <div class="gallery-footer-grid">
                        <div class="footer-brand-panel">
                            <a class="footer-logo-link" href="index.html" aria-label="Sunil Sawane Art Gallery home">
                                <img src="images/main-logo.png" alt="Sunil A. Sawane" class="footer-logo">
                            </a>
                            <p class="footer-brand-note">Original pen, ink, and color works by Sunil A. Sawane, curated for collectors and art lovers.</p>
                            <a class="footer-primary-link" href="gallery.html">View Gallery</a>
                        </div>

                        <nav class="footer-link-column" aria-label="Footer navigation">
                            <h5 class="widget-title">Explore</h5>
                            <ul class="menu-list list-unstyled">
                                <li class="menu-item"><a href="index.html">Home</a></li>
                                <li class="menu-item"><a href="about-us.html">About</a></li>
                                <li class="menu-item"><a href="gallery.html">Gallery</a></li>
                                <li class="menu-item"><a href="shop.html">Shop</a></li>
                                <li class="menu-item"><a href="contact.html">Contact</a></li>
                            </ul>
                        </nav>

                        <nav class="footer-link-column footer-commerce-links" aria-label="Collector support">
                            <h5 class="widget-title">Collectors</h5>
                            <ul class="menu-list list-unstyled">
                                <li class="menu-item"><a href="shop.html">Shop</a></li>
                                <li class="menu-item"><a href="cart.html">Cart</a></li>
                                <li class="menu-item"><a href="shipping-policy.html">Shipping &amp; Delivery</a></li>
                                <li class="menu-item"><a href="returns-damage-policy.html">Returns &amp; Damage</a></li>
                                <li class="menu-item"><a href="authenticity-policy.html">Authenticity</a></li>
                                <li class="menu-item"><a href="privacy-policy.html">Privacy</a></li>
                                <li class="menu-item"><a href="terms.html">Terms</a></li>
                            </ul>
                        </nav>

                        <nav class="footer-link-column footer-social-links" aria-label="Social links">
                            <h5 class="widget-title">Follow</h5>
                            <ul class="menu-list list-unstyled">
                                <li class="menu-item"><a href="https://www.instagram.com/sunil.sawane?igsh=dG9sZXpzbmU4aXFl" target="_blank" rel="noopener noreferrer">Instagram</a></li>
                                <li class="menu-item"><a href="https://www.facebook.com/share/2yBgtxFQiH4UMLbT/?mibextid=qi2Omg" target="_blank" rel="noopener noreferrer">Facebook</a></li>
                                <li class="menu-item"><a href="https://x.com/SawaneB1145?t=xpYprttypuSbuer9z-6N5A&amp;s=08" target="_blank" rel="noopener noreferrer">X</a></li>
                            </ul>
                        </nav>

                        <address class="footer-link-column footer-contact-list">
                            <h5 class="widget-title">Contact</h5>
                            <a href="tel:+919810238984">+91 98102 38984</a>
                            <a href="mailto:sunilsawaneart@gmail.com">sunilsawaneart@gmail.com</a>
                            <span>Gurgaon, Haryana, India</span>
                        </address>
                    </div>

                    <div class="footer-legal-bar">
                        <p>&copy; 2026 Sunil A. Sawane. Artwork and content protected.</p>
                        <a href="contact.html">Usage inquiries</a>
                    </div>
                </div>
            </footer>
        `;

        $('#footer-placeholder').html(footerHTML);
    }

    function setActiveNavigation() {
        // Get current page
        var currentPage = window.location.pathname.split('/').pop();

        // Default to index.html if empty
        if (currentPage === '' || currentPage === '/') {
            currentPage = 'index.html';
        }

        console.log('Current page:', currentPage);

        // Map of pages for special cases
        var pageMap = {
            'about-us-test.html': 'about-us.html',
            'artwork-detail.html': 'gallery.html',
            'cart.html': 'cart.html'
        };

        // Get the page to highlight
        var activePage = pageMap[currentPage] || currentPage;

        // Remove all active classes
        $('#navbar .nav-link').removeClass('active');

        // Add active class to current page
        $('#navbar .nav-link').each(function () {
            var href = $(this).attr('href');
            if (href === activePage) {
                $(this).addClass('active');
                console.log('Active page set:', href);
            }
        });
    }

    function updateCartCount() {
        try {
            // Read cart from localStorage (not from global cart object)
            const cartData = localStorage.getItem('cart');
            const cart = cartData ? JSON.parse(cartData) : [];

            // Calculate total items
            const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);

            console.log('📦 Cart count:', totalItems);
            console.log('📦 Cart items:', cart);

            // Update all cart count badges
            const cartBadges = document.querySelectorAll('.cart-count');
            cartBadges.forEach(badge => {
                badge.textContent = totalItems;
                badge.style.display = totalItems > 0 ? 'inline-block' : 'none';
            });

            console.log('✅ Cart count updated:', totalItems);
        } catch (error) {
            console.error('❌ Error updating cart count:', error);
            // Fallback: hide cart badges if there's an error
            const cartBadges = document.querySelectorAll('.cart-count');
            cartBadges.forEach(badge => {
                badge.textContent = '0';
                badge.style.display = 'none';
            });
        }
    }

    // Listen for cart updates from other pages
    window.addEventListener('cartUpdated', updateCartCount);
    window.addEventListener('storage', updateCartCount);

    // Update cart count when components load
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(updateCartCount, 500);
    });


    // Make functions globally available if needed
    window.ComponentLoader = {
        reload: loadComponents,
        setActive: setActiveNavigation,
        updateCart: updateCartCount
    };

})();
