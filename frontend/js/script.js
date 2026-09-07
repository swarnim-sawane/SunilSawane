(function ($) {

  "use strict";

  $(document).ready(function () {

    $("#preloader").fadeOut("slow");

    $('.feat-swiper').hcSticky({
      stickTo: $('.feat-product-grid')
    });

    $(".user-items .search-item").click(function () {
      $(".search-box").toggleClass('active');
      $(".search-box .search-input").focus();
    });
    $(".close-button").click(function () {
      $(".search-box").toggleClass('active');
    });

    if (typeof Swiper === 'function') {
      var swiper = new Swiper(".main-swiper", {
        speed: 500,
        loop: true,
        pagination: {
          el: "#billboard .swiper-pagination",
          clickable: true,
        },
        navigation: {
          nextEl: "#billboard .swiper-button-next",  // Add this for the next button
          prevEl: "#billboard .swiper-button-prev",  // Add this for the previous button
        },
      });

      $('.product-swiper').each(function () {
        var sectionId = $(this).attr('id');
        var swiper = new Swiper("#" + sectionId + " .swiper", {
          slidesPerView: 4,
          spaceBetween: 20,
          pagination: {
            el: "#" + sectionId + " .swiper-pagination",
            clickable: true,
          },
          breakpoints: {
            0: {
              slidesPerView: 2,
              spaceBetween: 20,
            },
            768: {
              slidesPerView: 2,
              spaceBetween: 10,
            },
            999: {
              slidesPerView: 3,
              spaceBetween: 10,
            },
            1366: {
              slidesPerView: 4,
              spaceBetween: 40,
            },
          },
        });
      })

      var swiper = new Swiper("#featured-swiper .swiper", {
        slidesPerView: 4,
        spaceBetween: 20,
        pagination: {
          el: "#featured-swiper .swiper-pagination",
          clickable: true,
        },
        navigation: {
          nextEl: "#featured-swiper .swiper-button-next",
          prevEl: "#featured-swiper .swiper-button-prev",
        },
        breakpoints: {
          0: {
            slidesPerView: 2,
            spaceBetween: 20,
          },
          768: {
            slidesPerView: 2,
            spaceBetween: 10,
          },
          999: {
            slidesPerView: 3,
            spaceBetween: 10,
          },
          1366: {
            slidesPerView: 4,
            spaceBetween: 40,
          },
        },
      });

      var swiper = new Swiper(".testimonial-swiper", {
        loop: true,
        navigation: {
          nextEl: ".swiper-arrow-next",
          prevEl: ".swiper-arrow-prev",
        },
        pagination: {
          el: "#testimonials .swiper-pagination",
          clickable: true,
        },
      });

      if (document.querySelector(".collection-swiper")) {
        var swiper = new Swiper(".collection-swiper", {
          slidesPerView: 4,
          spaceBetween: 10,
          loop: false,
          pagination: {
            el: "#collections .swiper-pagination",
            clickable: true,
          },
          breakpoints: {
            0: {
              slidesPerView: 1,
              spaceBetween: 20,
            },
            599: {
              slidesPerView: 2,
              spaceBetween: 10,
            },
            980: {
              slidesPerView: 3,
              spaceBetween: 20,
            },
          },
        });
      }


      // product single page
      var thumb_slider = new Swiper(".product-thumbnail-slider", {
        slidesPerView: 3,
        spaceBetween: 20,
        autoplay: true,
        direction: "vertical",
        pagination: {
          el: ".swiper-pagination",
          clickable: true,
        },
      });

      var large_slider = new Swiper(".product-large-slider", {
        slidesPerView: 1,
        autoplay: true,
        spaceBetween: 0,
        effect: 'fade',
        thumbs: {
          swiper: thumb_slider,
        },
      });

      var swiper3 = new Swiper(".feat-swiper", {
        grabCursor: true,
        effect: "creative",
        pagination: {
          el: ".swiper-pagination",
          clickable: true,
        },
        creativeEffect: {
          prev: {
            shadow: true,
            translate: ["-20%", 0, -1],
          },
          next: {
            translate: ["100%", 0, 0],
          },
        },
      });
    }

    // input spinner
    var initQuantitySpinner = function () {

      $('.product-qty').each(function () {

        var $el_product = $(this);
        var quantity = 0;

        $el_product.find('.quantity-right-plus').click(function (e) {
          e.preventDefault();
          var quantity = parseInt($el_product.find('#quantity').val());
          $el_product.find('#quantity').val(quantity + 1);
        });

        $el_product.find('.quantity-left-minus').click(function (e) {
          e.preventDefault();
          var quantity = parseInt($el_product.find('#quantity').val());
          if (quantity > 0) {
            $el_product.find('#quantity').val(quantity - 1);
          }
        });

      });

    }


    // init jarallax parallax
    var initJarallax = function () {
      jarallax(document.querySelectorAll(".jarallax"));

      jarallax(document.querySelectorAll(".jarallax-img"), {
        keepImg: true,
      });
    }

    var initArtistPortraitMotion = function () {
      var card = document.querySelector('.artist-portrait-card');
      if (!card || !window.requestAnimationFrame) {
        return;
      }

      var motionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
      if (motionQuery && motionQuery.matches) {
        return;
      }

      var image = card.querySelector('.artist-portrait-image');
      var quote = card.querySelector('.artist-quote-panel');
      var ticking = false;

      var setDrift = function () {
        var rect = card.getBoundingClientRect();
        var viewportHeight = window.innerHeight || document.documentElement.clientHeight;
        var centerOffset = ((rect.top + (rect.height / 2)) - (viewportHeight / 2)) / viewportHeight;
        var progress = Math.max(-1, Math.min(1, centerOffset));

        card.style.setProperty('--artist-card-lift', (progress * -10).toFixed(2) + 'px');

        if (image) {
          image.style.setProperty('--artist-image-drift', (progress * 18).toFixed(2) + 'px');
        }

        if (quote) {
          quote.style.setProperty('--artist-quote-drift', (progress * -8).toFixed(2) + 'px');
        }

        ticking = false;
      };

      var requestDrift = function () {
        if (!ticking) {
          window.requestAnimationFrame(setDrift);
          ticking = true;
        }
      };

      setDrift();
      window.addEventListener('scroll', requestDrift, { passive: true });
      window.addEventListener('resize', requestDrift);
    }

    initJarallax();
    initQuantitySpinner();
    initArtistPortraitMotion();


  }); // End of a document

})(jQuery);
