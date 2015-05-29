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

    var CARO_INFO = { mousedown: false };

    var init = function(){
        $caroStage.find('div').each(function(i, elem){
            $(elem).remove();
            addSlide($(elem).html());
        });
        $(window).resize(function(){
            resizeUi(true);
        })
    }

    var resizeUi = function(forceScrollBar){
        var $slides = $caroStage.find('.caro-item');
        $caroStage.width($slides.width() * $slides.length + 2);
        $slides.width( $caroWindow.width() );
        //Realign stage
        var offset = $caroStage.offset();
        var $nearestElem = getNearestElem($caroWindow.offset().left);
        $caroStage.offset({
            top: offset.top, 
            left: offset.left += (-1 * $nearestElem.offset().left)  
        });
        $caroWindow.height($caroStage.height());
        if(forceScrollBar && $caroWindow.height() < $(window).height() + 1){
            $caroWindow.height($(window).height() + 1);
        }
        window.scrollTo(0,0);
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

    var nextSlide = function(){ 
        moveSlide(-1);
    };

    var prevSlide = function(){
        moveSlide(1);
    };

    var getSlides = function(){
        return $caroStage.find('.caro-item');
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

    var moveSlide = function(vector){
        //Still moving
        if($caroStage.hasClass('sliding')){
            return;
        }

        //Get the current slide,
        var $currSlide;
        $caroStage.find('.caro-item').each(function(){
            var $slide = $(this);
            if( $slide.offset().left >= ($caroWindow.offset().left - 2)
                && $slide.offset().left <= ($caroWindow.offset().left + 2)){
                $currSlide = $slide;
                return false;
            }
        });
        //Check if the next or previous slide exists.
        if((vector < 0 && $currSlide.next().length) 
            || (vector > 0 && $currSlide.prev().length)){
            animateStage( 
                (vector < 0 ? '-=' : vector > 0 ? '+=' : '') 
                    + $caro.find('.caro-item').outerWidth()
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

    var getTargetSlide = function(direction){
        
        var $currElem = $(CARO_INFO.draggedSlide);

        if(direction < 0 && $currElem.next().length){
            return $currElem.next();
        }
            
        if(direction > 0 && $currElem.prev().length){
            return $currElem.prev();
        }

        return null;
    };

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

    $caroWindow.off('mousemove').on('mousemove', function(e){
        if(CARO_INFO.mousedown){
            
            var newLeft = $caroStage.position().left + e.pageX - CARO_INFO.trackX;
            var vector = e.pageX - CARO_INFO.startX;
            var direction = 0;
            if(vector != 0){
                
                var distance = Math.abs(vector);
               
                /* If distance >10px, slide all the way to the next or prev item */
                if(distance > 10){
                    if(vector < 0) {
                        direction = -1; //Moving stage from right to left
                    }else if(vector > 0){
                        direction = 1; //Moving stage from left to right
                    }
                    /* Work out distance to target slide left position */
                    var targetSlide = getTargetSlide(direction);
                    if(targetSlide !== null){
                        CARO_INFO.mouseupAnimation = function(){
                            animateToSlide(targetSlide);
                        }
                    }
                }

                //Drag stage if still within bounds
                if(direction == 1 && $caroStage.offset().left < $caroWindow.offset().left
                    || direction == -1 && $caroStage.offset().left + $caroStage.outerWidth() 
                    > $caroWindow.offset().left + $caroWindow.outerWidth()){
                    
                    $caroStage.css({ left: newLeft });
                    CARO_INFO.trackX = e.pageX;
                }
            }
        }
    });

    var getNearestElem = function(position, elems){
        var min = null;
        var $nearestElem = null;
        if(elems == null) {
            elems = $caroStage.find('.caro-item');
        }
        for(var i=0; i<elems.length; i++){
            var $elem = $(elems[i]);
            var newMin = Math.abs($caroWindow.offset().left - $elem.offset().left);
            if(min == null || newMin < min){
                $nearestElem = $elem;
                min = newMin;
            }
        }
        return $nearestElem;
    }

    $caroWindow.off('mouseup').on('mouseup', function(e){ 
        CARO_INFO.mousedown = false; 
        if(CARO_INFO.mouseupAnimation != null){
            CARO_INFO.mouseupAnimation();
            CARO_INFO.mouseupAnimation = null;
        };
        
        fixOvershoot();
        
        //Fix mouseleave and return problem.
        if(!$caroStage.hasClass('sliding')){
            
            var elems = [ CARO_INFO.draggedSlide ];
            if(CARO_INFO.draggedSlide.prev().length){
                elems.push(CARO_INFO.draggedSlide.prev());
            }
            if(CARO_INFO.draggedSlide.next().length){
                elems.push(CARO_INFO.draggedSlide.next());
            }
            var $nearestSlide = getNearestElem($caroWindow.offset().left, elems);
            if(Math.abs($caroWindow.offset().left - $nearestSlide.offset().left) > 2){
                animateToSlide($nearestSlide);
            }
            
        }
    });

    /* Add the nav controls */
    $caro.prepend('<div class="caro-nav-btn caro-nav-next">Next</a>');
    $caro.prepend('<div class="caro-nav-btn caro-nav-prev">Prev</a>');
    $caro.find('.caro-nav-prev').click(prevSlide);
    $caro.find('.caro-nav-next').click(nextSlide);

    init();

    return { 
        caroElem: $caro,
        addSlide: addSlide, 
        removeSlide: removeSlide,
        nextSlide: nextSlide,
        prevSlide: prevSlide,
        getSlides: getSlides
    };
};












