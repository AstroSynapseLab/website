$(document).ready(function() {
    const $mobileContent = $('.mobile-content');
    let lastScrollTop = 0;
    let isScrolling = false;
    
    // Get actual viewport height including address bar
    function getViewportHeight() {
        return window.innerHeight;
    }
    
    // Improved debounce function
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }
    
    // Improved snap function
    function snapToNearestSlide() {
        if (isScrolling) return;
        
        const scrollTop = $mobileContent.scrollTop();
        const viewportHeight = getViewportHeight();
        const targetSlideIndex = Math.round(scrollTop / viewportHeight);
        const targetScrollTop = targetSlideIndex * viewportHeight;
        
        isScrolling = true;
        
        $mobileContent.animate({
            scrollTop: targetScrollTop
        }, {
            duration: 300,
            complete: () => {
                isScrolling = false;
            }
        });
    }
    
    // Handle scroll events
    $mobileContent.on('scroll', debounce(function() {
        if (isScrolling) return;
        
        const scrollTop = $mobileContent.scrollTop();
        const scrollDelta = Math.abs(scrollTop - lastScrollTop);
        
        if (scrollDelta > getViewportHeight() * 0.15) { // Reduced threshold
            snapToNearestSlide();
        }
        
        lastScrollTop = scrollTop;
    }, 50)); // Reduced debounce time
    
    // Handle resize events
    $(window).on('resize', debounce(function() {
        if (isScrolling) return;
        snapToNearestSlide();
    }, 150));
    
    // Handle orientation change
    $(window).on('orientationchange', function() {
        setTimeout(snapToNearestSlide, 100);
    });
    
    // Modal handlers
    $('.open-dialog').on('click', function(e) {
        e.preventDefault();
        const slideId = this.id + 'Content';
        const content = $('#' + slideId).html();
        $('#modalContent').html(content);
        $('#fullScreenModal').fadeIn();
    });
    
    $('.close').on('click', function() {
        $('#fullScreenModal').fadeOut();
    });
    
    // Prevent bounce scrolling on iOS
    document.addEventListener('touchmove', function(e) {
        if (!$mobileContent.has($(e.target)).length) {
            e.preventDefault();
        }
    }, { passive: false });
});
