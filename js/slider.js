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

    // New function to create the chart
    function createCostBreakdownChart(canvasId) {
        var ctx = document.getElementById(canvasId).getContext('2d');
        return new Chart(ctx, {
            type: 'horizontalBar',
            data: {
                labels: ['Salaries', 'Marketing & User Acquisition', 'Training Hardware', 'Tools & Operations', 'Design & Branding'],
                datasets: [{
                    label: 'Cost ($k)',
                    data: [320, 100, 70, 70, 40],
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    xAxes: [{
                        ticks: {
                            beginAtZero: true,
                            callback: function(value) {return '$' + value + 'k';}
                        }
                    }]
                },
                tooltips: {
                    callbacks: {
                        label: function(tooltipItem, data) {
                            return data.datasets[tooltipItem.datasetIndex].label + ': $' + tooltipItem.xLabel + 'k';
                        }
                    }
                }
            }
        });
    }

    // Function to check if an element is in viewport
    function isElementInViewport(el) {
        var rect = el.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    // Function to handle chart creation when slide is visible
    function handleChartCreation() {
        var mobileSlide = document.querySelector('.mobile-content .slide-8');
        var desktopSlide = document.querySelector('.desktop-content .slide:nth-child(8)');

        if (isElementInViewport(mobileSlide) || isElementInViewport(desktopSlide)) {
            if (!costBreakdownChart) {
                costBreakdownChart = createCostBreakdownChart('costBreakdownChart');
            }
        }
    }

    // Modify your existing scroll event
    $mobileContent.on('scroll', debounce(function() {
        const scrollTop = $mobileContent.scrollTop();
        const scrollDelta = Math.abs(scrollTop - lastScrollTop);
        
        if (scrollDelta > $(window).height() * 0.25) {
            snapToNearestSlide();
        }
        
        lastScrollTop = scrollTop;

        // Check if chart should be created
        handleChartCreation();
    }, 100));

    // Add scroll event for desktop version
    $(window).on('scroll', debounce(function() {
        handleChartCreation();
    }, 100));

    // Your existing modal-related code
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

    // Initial check for chart creation
    handleChartCreation();
})
