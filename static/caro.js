function Caro(elem){
            
    var $caro = $(elem);
    var $caroWindow;
    var $caroStage;
    
    if(!$caro.find('.caro-window').length){
        $caro.append('<div class="caro-window"></div>');
        $caro.find('.caro-window').append('<div class="caro-stage"></div>');
    }
    $caroWindow = $caro.find('.caro-window');
    $caroStage = $caro.find('.caro-stage');

    var CARO_INFO = { 
        mousedown: false,
        callbacks: []
    };

    var registerCallback = function(arrFuncNames, func){
        for (var i = 0; i < arrFuncNames.length; i++) {
            CARO_INFO.callbacks.push({ 
                funcName: arrFuncNames[i], 
                func: func 
            })
        };
    }

    var getCallback = function(funcName){
        
        var func = function(){};
        var callbacks = CARO_INFO.callbacks;
        
        for(var i = 0; i < callbacks.length; i++){
            if(callbacks[i].funcName.toLowerCase() == funcName.toLowerCase()){
                func = callbacks[i].func;
            }
        }
        return func;
    }

    var init = function(){
        $caroStage.find('div').each(function(i, elem){
            $(elem).remove();
            addSlide($(elem).html());
        });
        $(window).resize(function(){
            clearTimeout(this.id);
            this.id = setTimeout(function(){ resizeUi(true); }, 400);
        })
    }

    var resizeUi = function(forceScrollBar){
        
        var caroLeftAdjust = 0;
        var $nearestSlide = getNearestSlide($caroWindow.offset().left);
        var $slides = $caroStage.find('.caro-item');
        
        $caroStage.width($slides.width() * $slides.length + 10000);
        $slides.width( $caroWindow.width() );
        
        //Realign stage
        var offset = $caroStage.offset();
        caroLeftAdjust = ($nearestSlide) ? $nearestSlide.offset().left : 0;

        $caroStage.offset({
            top: offset.top, 
            left: offset.left += (-1 * caroLeftAdjust) 
        });

        //Set the height
        $caroWindow.css('min-height', $caroStage.height() + 'px');
        $slides.css('min-height', $caroStage.height() + 'px');
        if(forceScrollBar && $caroWindow.height() < $(window).height() + 1){
            $caroWindow.css('min-height', ($(window).height() + 1) + 'px');
        }
    }

    var addSlide = function(slideHtml){
        $caroStage.append("<div class='caro-item'>" + slideHtml + "</div>");
        resizeUi(true);
    }

    var removeSlide = function(index){
        if(index >= 1 && $caroStage.find('.caro-item:nth-child('+index+')').length){
            $caroStage.find('.caro-item:nth-child('+index+')').remove();
        }
    }

    var removeSlideContaining = function(selector){
        var $slides = getSlides();
        var $targetSlides = [];
        if($slides.length >= 1){
            $slides.each(function(i, elem){
                var $slide = $(elem);
                if($slide.find(selector).length >= 1){
                    $targetSlides.push(getSlide(i+1));
                };
            });
            for(var i = 0; i < $targetSlides.length; i++){
                $targetSlides[i].remove();
            }
        }
    }

    var nextSlide = function(){ 
        moveSlide(-1, getCallback('nextslide'));
    };

    var prevSlide = function(){
        moveSlide(1, getCallback('prevslide'));
    };

    var getSlides = function(){
        return $caroStage.find('.caro-item');
    }

    var getSlide = function(index){
        if(index >= 1 && $caroStage.find('.caro-item:nth-child('+index+')').length){
            return $caroStage.find('.caro-item:nth-child('+index+')');
        }
    }

    var getLast = function(){
        return $caro.find('.caro-item:last');
    }

    var animateStage = function(newLeft, onComplete){
        if(!$caroStage.hasClass('sliding')){
            $caroStage.addClass('sliding');
            $caroStage.animate(
                { left: newLeft },
                300, 
                function(){ 
                    $caroStage.removeClass('sliding');
                    if(onComplete != null){
                        onComplete();
                    }
                }
            );
        }
    };

    var getCurrentSlide = function(){
        
        var targetIndex;
        var minDiff = $caroStage.width();
        var $slides = $caroStage.find('.caro-item');

        //Find the slide with the most area inside the caro window
        $slides.each(function(index, elem){

            var $slide = $(elem);
            var diffLeft = $slide.offset().left - $caroWindow.offset().left;
            var diffRight = $slide.offset().left + $slide.width() 
                            - ($caroWindow.offset().left + $caroWindow.width());
            var diff = Math.abs(diffLeft) + Math.abs(diffRight);
            
            if(diff < minDiff){
                minDiff = diff;
                targetIndex = index;
            }

        });

        return $slides.eq(targetIndex);
    }

    var moveSlide = function(vector, onComplete){
        //Still moving
        if($caroStage.hasClass('sliding')){
            return;
        }

        //Get the current slide.
        var $currSlide = getCurrentSlide();

        //Check if the next or previous slide exists.
        if((vector < 0 && $currSlide.next().length) 
            || (vector > 0 && $currSlide.prev().length)){
            animateStage( 
                (vector < 0 ? '-=' : vector > 0 ? '+=' : '') 
                    + $caro.find('.caro-item').outerWidth(),
                onComplete
            );
        }
    };

    var animateToSlide = function(targetSlide){
        if(targetSlide !== null){
            var $targetSlide = $(targetSlide);
            var newLeft = $caroStage.offset().left - $targetSlide.offset().left;
            animateStage(newLeft);
        }
    };

    var fixOvershoot = function(){
        /* If the stage was dragged beyond the first or last elements,
        animate back to boundary. */

        //Animate to the first slide
        if($caroStage.offset().left > $caroWindow.offset().left){
            if(!$caroStage.hasClass('sliding')){
                $caroStage.addClass('sliding');
                $caroStage.animate(
                    { left: 0 },
                    300, 
                    function(){ 
                        $caroStage.removeClass('sliding');
                    }
                );
            }
        }

        //Animate to the last slide
        if($caroStage.offset().left + $caroStage.outerWidth() 
            < $caroWindow.offset().left + $caroWindow.outerWidth()){
            if(!$caroStage.hasClass('sliding')){
                $caroStage.addClass('sliding');
                $caroStage.animate({ 
                        left: "+=" + ( $caroWindow.offset().left 
                        - $caro.find('.caro-item:last').offset().left + 1) 
                    },
                    300, 
                    function(){ 
                        $caroStage.removeClass('sliding');
                    }
                );
            }
        }
    };

    var getTargetSlide = function(currSlide, direction){
        
        var $currSlide = $(currSlide);

        if(direction < 0 && $currSlide.next().length){
            return $currSlide.next();
        }
            
        if(direction > 0 && $currSlide.prev().length){
            return $currSlide.prev();
        }

        return null;
    };

    var dragStage = function(pageX, currSlide){
        
        var $currSlide = $(currSlide);
        var vector = pageX - CARO_INFO.startX;
        var direction = 0;
        var distance = Math.abs(vector);
        var newLeft = $caroStage.position().left + pageX - CARO_INFO.trackX;

        if(distance != 0){
              
            /* If distance >10px, slide all the way to the next or prev item */
            if(distance > 10){

                if(vector < 0) {
                    direction = -1; //Moving stage from right to left
                }else if(vector > 0){
                    direction = 1; //Moving stage from left to right
                }

                var targetSlide = getTargetSlide($currSlide, direction);

                if(targetSlide !== null){
                    CARO_INFO.mouseupAnimation = function(){
                        animateToSlide(targetSlide);
                    }
                    $caroStage.css({ left: newLeft });
                    CARO_INFO.trackX = pageX;
                }
            }
        }
    }

    /* Setup the touch and drag events */
    $caroWindow.off('mousedown').on('mousedown', function(e){
        
        var $elem = $(e.target);
        CARO_INFO.mousedown = true;
        CARO_INFO.startX = e.pageX;
        CARO_INFO.trackX = CARO_INFO.startX;

        if($elem.hasClass('caro-item') != true){
            $elem = $elem.closest('.caro-item');
        }
        
        CARO_INFO.draggedSlide = $elem;
        CARO_INFO.mouseupAnimation = function(){};
    });

    $caroStage.off('mousemove').on('mousemove', function(event){
        if(CARO_INFO.mousedown){ 
            dragStage(event.pageX, $(event.target).closest('.caro-item'));
        }
    });

    var getNearestSlide = function(position){
        
        var min = null;
        var $nearestElem = null;
        elems = $caroStage.find('.caro-item');

        for(var i = 0; i < elems.length; i++){
            var $elem = $(elems[i]);
            if($elem.offset().left >= (position - 100)){
                var newMin = Math.abs(position - $elem.offset().left);
                if(min == null || newMin < min){
                    $nearestElem = $elem;
                    min = newMin;
                }
            }
        }

        return $nearestElem;
    }

    var isLastSlide = function(){
        
        var min             = null;
        var $nearestElem    = null;
        var elems           = $caroStage.find('.caro-item');
        var index;

        for(var i = 0; i < elems.length; i++){
            var $elem = $(elems[i]);
            var newMin = Math.abs($caroWindow.offset().left - $elem.offset().left);
            if(min == null || newMin < min){
                $nearestElem = $elem;
                min = newMin;
                index = i;
            }
        }

        return (index == getSlides().length - 1);
    }

    $caroWindow.off('mouseup').on('mouseup', function(e){ 

        CARO_INFO.mousedown = false; 
        if(CARO_INFO.mouseupAnimation instanceof Function){
            CARO_INFO.mouseupAnimation();
            CARO_INFO.mouseupAnimation = null;
        };

        fixOvershoot();
    });

    /* Add the nav controls */
    $caro.prepend('<div class="caro-nav-btn caro-nav-next">Next</div>');
    $caro.prepend('<div class="caro-nav-btn caro-nav-prev">Prev</div>');
    $caro.find('.caro-nav-prev').click(prevSlide);
    $caro.find('.caro-nav-next').click(nextSlide);
    $caroWindow.append('<p class="fix-height"></p>');

    init();

    return { 
        caroElem:               $caro,
        addSlide:               addSlide, 
        removeSlide:            removeSlide,
        removeSlideContaining:  removeSlideContaining,
        registerCallback:       registerCallback,
        getNearestSlide:        getNearestSlide,
        getCurrentSlide:        getCurrentSlide,
        nextSlide:              nextSlide,
        prevSlide:              prevSlide,
        isLastSlide:            isLastSlide,
        getSlides:              getSlides,
        getSlide:               getSlide,
        getLast:                getLast,
        resizeUi:               resizeUi
    };
};












