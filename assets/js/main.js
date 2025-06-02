
!(function($) {
  "use strict";

  // Nav Menu

  
  $(document).on('click', '.nav-menu a, .mobile-nav a', function(e) {
    if (location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '') && location.hostname == this.hostname) {
      var hash = this.hash;
      var target = $(hash);
      if (target.length) {
        e.preventDefault();
        
        if ($(this).parents('.nav-menu, .mobile-nav').length) {
          $('.nav-menu .active, .mobile-nav .active').removeClass('active');
          $(this).closest('li').addClass('active');
        }
        
        if (hash == '#header') {
          $('#header').removeClass('header-top');
          $("section").removeClass('section-show');
          return;
        }

        if (!header.classList.contains('header-top')) {
          header.classList.add('header-top');
          updateHeaderTitleFromHash(hash); 
          setTimeout(() => {
            document.querySelectorAll('section').forEach(sec => sec.classList.remove('section-show'));
            document.querySelector(hash).classList.add('section-show');
          }, 350);
        } else {
          document.querySelectorAll('section').forEach(sec => sec.classList.remove('section-show'));
          document.querySelector(hash).classList.add('section-show');
          updateHeaderTitleFromHash(hash); 
        }



        if ($('body').hasClass('mobile-nav-active')) {
          $('body').removeClass('mobile-nav-active');
          $('.mobile-nav-toggle i').toggleClass('icofont-navigation-menu icofont-close');
          $('.mobile-nav-overly').fadeOut();
        }
        
        return false;
        
      }
    }
  });
  
  // Activate/show sections on load with hash links
  if (window.location.hash) {
    var initial_nav = window.location.hash;
    if ($(initial_nav).length) {
      $('#header').addClass('header-top');
      $('.nav-menu .active, .mobile-nav .active').removeClass('active');
      $('.nav-menu, .mobile-nav').find('a[href="' + initial_nav + '"]').parent('li').addClass('active');
      updateHeaderTitleFromHash(initial_nav); 
      setTimeout(function() {
        $("section").removeClass('section-show');
        $(initial_nav).addClass('section-show');
      }, 350);
    }
  }
  
  // Mobile Navigation
  if ($('.nav-menu').length) {
    var $mobile_nav = $('.nav-menu').clone().prop({
      class: 'mobile-nav d-lg-none'
    });
    $('body').append($mobile_nav);
    $('body').prepend('<button type="button" class="mobile-nav-toggle d-lg-none"><i class="icofont-navigation-menu"></i></button>');
    $('body').append('<div class="mobile-nav-overly"></div>');
    
    $(document).on('click', '.mobile-nav-toggle', function(e) {
      $('body').toggleClass('mobile-nav-active');
      $('.mobile-nav-toggle i').toggleClass('icofont-navigation-menu icofont-close');
      $('.mobile-nav-overly').toggle();
    });
    
    $(document).click(function(e) {
      var container = $(".mobile-nav, .mobile-nav-toggle");
      if (!container.is(e.target) && container.has(e.target).length === 0) {
        if ($('body').hasClass('mobile-nav-active')) {
          $('body').removeClass('mobile-nav-active');
          $('.mobile-nav-toggle i').toggleClass('icofont-navigation-menu icofont-close');
          $('.mobile-nav-overly').fadeOut();
        }
      }
    });
  } else if ($(".mobile-nav, .mobile-nav-toggle").length) {
    $(".mobile-nav, .mobile-nav-toggle").hide();
  }
  
  function updateHeaderTitleFromHash(hash) {
    const headerLink = document.querySelector('.container h1 a');
    if (!headerLink) return;

    if (!hash || hash === '#header') {
      headerLink.innerHTML = 'I\'am Shahzad Bangash';
    } else {
      headerLink.innerHTML = '<i class="bx bx-home" style="transform: scale(1.3);"></i>';
    }
  }

  // Call on load
  updateHeaderTitleFromHash(window.location.hash);

  // Call on hash change
  window.addEventListener('hashchange', () => {
    updateHeaderTitleFromHash(window.location.hash);
  });

})(jQuery);



