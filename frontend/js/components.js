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
                                    <li class="nav-item">
                                        <a class="nav-link me-4" href="cart.html">
                                            <svg width="24" height="24">
                                                <use xlink:href="#cart"></use>
                                            </svg>
                                            <span class="cart-count badge bg-danger ms-1" style="display:none;">0</span>
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
            <footer id="footer" class="overflow-hidden padding-large">
                <div class="container-fluid">
                    <div class="row">
                        <div class="row d-flex flex-wrap justify-content-between">
                            <!-- About Section -->
                            <div class="col-lg-3 col-sm-6 pb-3 pe-4">
                                <div class="footer-menu">
                                    <img src="images/main-logo.png" alt="logo" class="pb-3">
                                    <p>Welcome to the official website of Sunil A. Sawane. Here, you can explore a diverse collection of my artwork, including Pen & Ink. My work is inspired by nature, abstract concepts, and personal experiences, and I aim to paint all this on my canvas. Thank you for visiting, and I hope you enjoy exploring my creations.</p>
                                </div>
                                <div class="copyright">
                                    <p>© 2024, Sunil A. Sawane. All rights to artwork and content reserved. Unauthorized use or reproduction of any material from this site is prohibited.</p>
                                </div>
                            </div>
                            
                            <!-- Quick Links -->
                            <div class="col-lg-2 col-sm-6 pb-3">
                                <div class="footer-menu text-uppercase">
                                    <h5 class="widget-title pb-2">Quick Links</h5>
                                    <ul class="menu-list list-unstyled text-uppercase">
                                        <li class="menu-item pb-2">
                                            <a href="index.html">Home</a>
                                        </li>
                                        <li class="menu-item pb-2">
                                            <a href="about-us.html">About</a>
                                        </li>
                                        <li class="menu-item pb-2">
                                            <a href="gallery.html">Gallery</a>
                                        </li>
                                        <li class="menu-item pb-2">
                                            <a href="shop.html">Shop</a>
                                        </li>
                                        <li class="menu-item pb-2">
                                            <a href="contact.html">Contact</a>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                            
                            <!-- Social Links -->
                            <div class="col-lg-2 col-sm-6 pb-3">
                                <div class="footer-menu text-uppercase">
                                    <h5 class="widget-title pb-2">Social</h5>
                                    <div class="social-links">
                                        <ul class="list-unstyled">
                                            <li class="pb-2">
                                                <a href="https://www.facebook.com/share/2yBgtxFQiH4UMLbT/?mibextid=qi2Omg" target="_blank">Facebook</a>
                                            </li>
                                            <li class="pb-2">
                                                <a href="https://x.com/SawaneB1145?t=xpYprttypuSbuer9z-6N5As08" target="_blank">Twitter</a>
                                            </li>
                                            <li class="pb-2">
                                                <a href="https://www.instagram.com/sunil.sawane?igsh=dG9sZXpzbmU4aXFl" target="_blank">Instagram</a>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Contact Info -->
                            <div class="col-lg-3 col-sm-6">
                                <div class="footer-menu contact-item">
                                    <h5 class="widget-title text-uppercase pb-2">Contact Us</h5>
                                    <p><a href="tel:+91-9810238984">+91-9810238984</a></p>
                                    <p><a href="mailto:sunilsawaneart@gmail.com">sunilsawaneart@gmail.com</a></p>
                                    <p>Gurgaon, Haryana, India</p>
                                </div>
                            </div>
                        </div>
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
