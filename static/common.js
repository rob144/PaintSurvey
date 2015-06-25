function initDialog(){
    var $dialog = $('.dialog');
    var $background = $('.dialog-background');
    $background.css({ opacity: 0.6 });
    $dialog.find('.btn-dialog-cancel').click(
        function(){
            $background.hide();
            $dialog.hide();
        }
    );
}

function showDialog(title, message, confirmFunc, funcParams){
    var $dialog = $('.dialog');
    var $background = $('.dialog-background');
    $background.show();
    $dialog.show();
    $dialog.find('.dialog-title').text(title);
    $dialog.find('.dialog-message').text(message);

    if(confirmFunc != null) {
        $dialog.find('.btn-dialog-confirm').one(
            'click',
            function(){
                $dialog.hide();
                $background.hide();
                confirmFunc(funcParams);
            }
        );
    }
}

function doXhr(params) {

    var $loading = $('.loadingDivOuter');
    var success = false;

    return $.ajax({
        url:        params.url,
        type:       params.httpMethod,
        data:       params.data,
        dataType:   params.dataType,
        beforeSend: function(){
            LOADING_START_TIME = new Date($.now());
            $loading.center();
            $loading.show();
        },
        success: function(data, status, xhr){
            success = true;
            var elapsed = new Date($.now()) - LOADING_START_TIME;
            setTimeout(
              function(){
                  params.successFunc(data, status, xhr);
                  $loading.hide(); 
              }, 1000 - elapsed
            );
        }
    }).always(function() {
        if(!success){
            var elapsed = new Date($.now()) - LOADING_START_TIME;
            setTimeout(
                function(){
                    $loading.hide(); 
                }, 1000 - elapsed
            );
        }
    })

}

$.fn.hasAncestor = function(a) {
    return $(this).closest(a).length >= 1 ? true : false;
};

$.fn.center = function() {
    var container = $(window);
    var top = -this.outerHeight() / 2;
    var left = -this.outerWidth() / 2;
    return this.css('position', 'fixed').css({
      'margin-left': left + 'px', 
      'margin-top': top + 'px', 
      'left': '50%', 'top': '50%'
    });
}

String.prototype.format = function () {
  var args = arguments;
  return this.replace(/\{\{|\}\}|\{(\d+)\}/g, function (m, n) {
    if (m == "{{") { return "{"; }
    if (m == "}}") { return "}"; }
    return args[n];
  });
};

function isObjectEmpty(object){
    if ('object' !== typeof object) {
        throw new Error('Object must be specified.');
    }

    if (null === object) {
        return true;
    }

    if ('undefined' !== Object.keys) {
        // Using ECMAScript 5 feature.
        return (0 === Object.keys(object).length);
    } else {
        // Using legacy compatibility mode.
        for (var key in object) {
            if (object.hasOwnProperty(key)) {
                return false;
            }
        }
        return true;
    }
}

var makeComponent = function(selector, initFunc){
    var $template = $('#view-components ' + selector + '.template').clone();
    var $newElems = $(selector + ':not(.template)');
    $newElems.each( 
        function(i, elem){
            $(elem).html($template.html());
        }
    );
    if(initFunc != null){
        $newElems.each( initFunc );
    }
}

var makeComponents = function(arrComponents){
    if(arrComponents){
        for(var i = 0; i < arrComponents.length; i++){
            makeComponent(arrComponents[i]);
        }
    }  
}