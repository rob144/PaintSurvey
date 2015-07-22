function Caro(boxElem){
    
    var caro = this;

    caro.name               = boxElem;
    caro.caroBox            = $(boxElem);
    caro.draggedSlide       = null;
    caro.mouseupAnimation   = null;
    caro.mouseIsDown        = false;
    caro.startX             = null;
    caro.trackX             = null;
    caro.callbacks          = [];

    /* Add the container divs */
    if(!caro.caroBox.find('.caro-window').length){
        caro.caroBox.append(
            '<div class="caro-window"><div class="caro-stage"></div></div>'
        );
    }
    caro.caroWindow = caro.caroBox.find('.caro-window');
    caro.caroStage = caro.caroBox.find('.caro-stage');
    
    /* Add the nav controls */
    caro.caroBox.prepend('<div class="caro-nav-btn caro-nav-next">Next</div>');
    caro.caroBox.prepend('<div class="caro-nav-btn caro-nav-prev">Prev</div>');
}

Caro.prototype.registerCallback = function(arrFuncNames, func){
    
    var caro = this;
    for (var i = 0; i < arrFuncNames.length; i++) {
        caro.callbacks.push({ 
            funcName: arrFuncNames[i], 
            func: func 
        })
    };
}

Caro.prototype.getCallback = function(funcName){
    
    var caro = this;
    var func = function(){};
    var callbacks = caro.callbacks;
    
    for(var i = 0; i < callbacks.length; i++){
        if(callbacks[i].funcName.toLowerCase() == funcName.toLowerCase()){
            func = callbacks[i].func;
        }
    }
    return func;
}

Caro.prototype.resizeUi = function(forceScrollBar){
    
    var caro = this;
    var slides = caro.getSlides();
    var windowWidth = caro.caroWindow.width();
    var currSlide = caro.getCurrentSlide();

    //Make the stage width big enough to contain all the slides
    caro.caroStage.width(slides.length * caro.caroWindow.width());
    
    //Set the width of the slides to match caro window width
    //I.e. show one slide in the caro window
    slides.width(windowWidth);

    //Realign stage after resize
    var newLeft = caro.caroStage.offset().left - currSlide.offset().left;
    caro.caroStage.css('margin-left', newLeft);
}

Caro.prototype.getSlide = function(slideIndex){
    return this.caroStage.find('.caro-item').eq(slideIndex);
}

Caro.prototype.getSlides = function(){
    return this.caroStage.find('.caro-item');
}

Caro.prototype.getLastSlide = function(){
    return this.caroStage.find('.caro-item:last');
}

Caro.prototype.getTargetSlide = function(currSlide, direction){
    
    var currSlide = $(currSlide);

    if(direction < 0 && currSlide.next().length){
        return currSlide.next();
    }
        
    if(direction > 0 && currSlide.prev().length){
        return currSlide.prev();
    }

    return null;
};

Caro.prototype.getCurrentSlide = function(){
    
    var caro = this;
    var targetIndex;
    var minDiff = caro.caroStage.width();
    var slides = caro.getSlides();

    //Find the slide with the most area inside the caro window
    slides.each(function(index, elem){

        var slide = $(elem);
        var diffLeft = slide.offset().left - caro.caroWindow.offset().left;
        var diffRight = slide.offset().left + slide.width() 
                        - (caro.caroWindow.offset().left + caro.caroWindow.width());
        var diff = Math.abs(diffLeft) + Math.abs(diffRight);
        
        if(diff < minDiff){
            minDiff = diff;
            targetIndex = index;
        }

    });

    return slides.eq(targetIndex);
}

Caro.prototype.addSlide = function(slideHtml){
    this.caroStage.append("<div class='caro-item'>" + slideHtml + "</div>");
}

Caro.prototype.removeSlide = function(index){
    var caro = this;
    if(index >= 1 && caro.caroStage.find('.caro-item:nth-child(' + index + ')').length){
        caro.caroStage.find('.caro-item:nth-child(' + index + ')').remove();
    }
}

Caro.prototype.removeSlideContaining = function(selector){
    
    var caro = this;
    var slides = caro.getSlides();
    var targetSlides = [];

    //Find and remove sides containing elements matching the selector
    if(slides.length >= 1){
        slides.each(function(i, elem){
            var slide = $(elem);
            if(slide.find(selector).length >= 1){
                targetSlides.push(caro.getSlide(i));
            };
        });
        for(var i = 0; i < targetSlides.length; i++){
            targetSlides[i].remove();
        }
    }
}

Caro.prototype.nextSlide = function(){ 
    this.moveSlide(-1);
};

Caro.prototype.prevSlide = function(){
    this.moveSlide(1);
};

Caro.prototype.animateStage = function(newLeft){
    var caro = this;
    if(!caro.caroStage.hasClass('sliding')){
        caro.caroStage.addClass('sliding');
        caro.caroStage.animate(
            { marginLeft: newLeft },
            300, 
            function(){ 
                caro.caroStage.removeClass('sliding');
                /*
                if(getCallback('animateStage') != null){
                    getCallback('animateStage')();
                }*/
            }
        );
    }
};

Caro.prototype.moveSlide = function(vector, onComplete){
    
    var caro = this;

    //Check if still moving
    if(caro.caroStage.hasClass('sliding')){
        return;
    }

    //Get the current slide.
    var currSlide = caro.getCurrentSlide();
    var operator = (vector < 0 ? '-=' : vector > 0 ? '+=' : '');

    //Check if the next or previous slide exists.
    if((vector < 0 && currSlide.next().length) 
        || (vector > 0 && currSlide.prev().length)){
        caro.animateStage( operator + caro.caroBox.find('.caro-item').outerWidth() );
    }
};

Caro.prototype.animateToSlide = function(targetSlide){
    var caro = this;
    if(targetSlide != null){
        targetSlide = $(targetSlide);
        var newLeft = caro.caroStage.offset().left - targetSlide.offset().left;
        caro.animateStage(newLeft);
    }
};

Caro.prototype.dragStage = function(pageX, currSlide){
        
    var caro = this;
    var currSlide = $(currSlide);
    var vector = pageX - caro.startX;
    var direction = 0;
    var distance = Math.abs(vector);
    var newLeft = parseInt(caro.caroStage.css('margin-left')) + pageX - caro.trackX;
    
    /* If distance > 20px, slide all the way to the next or prev item */
    if(distance > 20){

        if(vector < 0) {
            direction = -1; //Moving stage from right to left
        }else if(vector > 0){
            direction = 1; //Moving stage from left to right
        }

        var targetSlide = caro.getTargetSlide(currSlide, direction);

        if(targetSlide !== null){
            caro.mouseupAnimation = function(){
                caro.animateToSlide(targetSlide);
            }
            caro.caroStage.css({ marginLeft: newLeft });
            caro.trackX = pageX;
        }
    }
}

Caro.prototype.fixOvershoot = function(){
    /* If the stage was dragged beyond the first or last elements,
    animate back to boundary. */
    var caro = this;

    //Animate to the first slide
    if(caro.caroStage.offset().left > caro.caroWindow.offset().left){
        if(!caro.caroStage.hasClass('sliding')){
            caro.addClass('sliding');
            caro.animate(
                { left: 0 },
                300, 
                function(){
                    caro.caroStage.removeClass('sliding');
                }
            );
        }
    }

    //Animate to the last slide
    if(caro.caroStage.offset().left + caro.caroStage.outerWidth() 
        < caro.caroWindow.offset().left + caro.caroWindow.outerWidth()){
        if(!caro.caroStage.hasClass('sliding')){
            caro.caroStage.addClass('sliding');
            caro.caroStage.animate({ 
                    left: "+=" + ( caro.caroWindow.offset().left 
                    - caro.getLastSlide().offset().left + 1) 
                },
                300, 
                function(){ 
                    caro.caroStage.removeClass('sliding');
                }
            );
        }
    }
};

Caro.prototype.init = function(slidesContainer){

    var caro = this; 
    $(slidesContainer).find('div.caro-page').each(function(i, elem){
        $(elem).remove();
        caro.addSlide($(elem).html());
        caro.resizeUi();
    });

    var resizeHandler = function(caroObj){
        clearTimeout(caroObj.timeOutId);
        caroObj.timeOutId = setTimeout(
            function(){ 
                caroObj.resizeUi(true); 
            }, 300 //Set delay to avoid many resize events.
        );
    }

    $(window).resize(function(){
        resizeHandler(caro);
    });

    caro.caroBox.find('.caro-nav-prev').click(
        function(){ caro.prevSlide(); }
    );
    caro.caroBox.find('.caro-nav-next').click(
        function(){ caro.nextSlide(); }
    );

    /* Setup the touch and drag events */
    caro.caroWindow.off('mousedown touchstart')
                    .on('mousedown touchstart', function(event){

        var dragElem = $(event.target);

        caro.mouseIsDown = true;
        caro.startX = (event.type == 'touchstart') 
            ? event.originalEvent.touches[0].pageX 
            : event.pageX;
        caro.trackX = caro.startX;

        if(dragElem.hasClass('caro-item') != true){
            dragElem = dragElem.closest('.caro-item');
        }
        
        caro.draggedSlide = dragElem;
        caro.mouseupAnimation = function(){
            caro.animateToSlide(caro.draggedSlide);
        };
    });

    caro.caroStage.off('mousemove touchmove')
                    .on('mousemove touchmove', function(e){

        var pageX = (e.type == 'touchmove') 
            ? e.originalEvent.touches[0].pageX 
            : e.pageX;

        if(caro.mouseIsDown){
            caro.caroWindow.css('cursor','-webkit-grabbing');
            caro.dragStage(pageX, $(e.target).closest('.caro-item'));
        }else{
            caro.caroWindow.css('cursor','default');
        }
    });

    caro.caroWindow.off('mouseup touchend')
                    .on('mouseup touchend', function(e){ 

        caro.mouseIsDown = false; 
        if(caro.mouseupAnimation instanceof Function){
            caro.mouseupAnimation();
            caro.mouseupAnimation = null;
        };

        caro.caroWindow.css('cursor','default');
        //caro.fixOvershoot();
    });
}