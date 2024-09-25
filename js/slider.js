$(document).ready(function() {
    const $mobileContent = $('.mobile-content');
    let lastScrollTop = 0;

    // Debounce function
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    function snapToNearestSlide() {
        const scrollTop = $mobileContent.scrollTop();
        const slideHeight = $(window).height();
        const targetSlideIndex = Math.round(scrollTop / slideHeight);
        const targetScrollTop = targetSlideIndex * slideHeight;

        $mobileContent.animate({
            scrollTop: targetScrollTop
        }, 300);
    }

    $mobileContent.on('scroll', debounce(function() {
        const scrollTop = $mobileContent.scrollTop();
        const scrollDelta = Math.abs(scrollTop - lastScrollTop);
        
        if (scrollDelta > $(window).height() * 0.25) {
            snapToNearestSlide();
        }
        
        lastScrollTop = scrollTop;
    }, 100));

    $('.slide a').on('click', function(e) {
        e.preventDefault();
        var slideId = this.id + 'Content'
        var content = $('#' + slideId).html();
        $('#modalContent').html(content);
        $('#fullScreenModal').fadeIn();
    })

    $('.close').on('click', function() {
        $('#fullScreenModal').fadeOut()
    })
});
