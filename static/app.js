//Global variable to store current project data
var LOADING_START_TIME;
var CARO;
var CURRENT_PROJECT =   {};
var PROJECTS        =   JSON.parse($('#model-projects').text());
var SURFACE_TYPES   =   ['Ceilings','Walls','Doors','Windows','Radiators','Isolated Surfaces'];
var PAINTS          =   JSON.parse($('#model-paints').text());
var DEFAULT_ROOM    =   JSON.parse($('#model-default-room').text());
var ROOMS           =   JSON.parse($('#model-rooms').text());

var MODEL = {
    getRoomsForProject: function(project_key){
        var rooms = [];
        for(var i = 0; i <= ROOMS.length - 1; i++){
            if(ROOMS[i].project == project_key){
                rooms.push(ROOMS[i]);
            }
        }
        return rooms;
    },
    getProject: function(project_key){
        var project = false;
        for(var i = 0; i <= PROJECTS.length - 1; i++){ 
            if(PROJECTS[i].key == project_key){
                found = true;
                project = PROJECTS[i];
            }
        }
        return project;
    },
    updateProject: function(project){
        var found = false;
        for(var i = 0; i <= PROJECTS.length - 1; i++){ 
            if(PROJECTS[i].key == project.key){
                found = true;
                PROJECTS[i] = project;
                for(var i=0; i < ROOMS.length - 1; i++){
                    if(ROOMS[i].project == project.key 
                      && $.inArray(ROOMS[i].key, project.rooms) == -1){
                        /* The project is no longer assocatiated with
                         the room, so remove the room -> project reference. */
                        ROOMS[i].project = '';
                    }
                }
            }
        }
        if(!found){
            PROJECTS.push(project);
        }
    },
    getRoom: function(room_key){
        for(var i = 0; i <= ROOMS.length - 1; i++){
            if(ROOMS[i].key == room_key){
                return ROOMS[i];
            }
        }
    },
    updateRoom: function(room){
        var found = false;
        for(var i = 0; i <= ROOMS.length - 1; i++){ 
            if(ROOMS[i].key == room.key){
                ROOMS[i] = room;
                found = true;
            }
        }
        if(!found){
          ROOMS.push(room);
        }
        //Add the room to the project
        if(room.project != ''){
            for(var i = 0; i <= PROJECTS.length - 1; i++){ 
                if( PROJECTS[i].key == room.project 
                    && $.inArray(room.project, PROJECTS[i].rooms) == -1){
                        PROJECTS[i].rooms.push(room.key);
                }
            }
        }
    },
    deleteRoom: function(room_key){
        for(var i = 0; i <= ROOMS.length - 1; i++){
            if(ROOMS[i].key == room_key){
                
                for(var j=0; j < PROJECTS.length - 1; j++){
                    /* Remove the project -> room reference. */
                    var idx = $.inArray(ROOMS[i].key, PROJECTS[j].rooms);
                    if(idx >= 0) PROJECTS[j].rooms.splice(idx, 1);
                }
                /* Remove the room */
                ROOMS.splice(i,1);
                break;
            }
        }
        return ROOMS;
    },
    getPaint: function(paint_key){
        for(var i = 0; i <= PAINTS.length - 1; i++){
            if(PAINTS[i].key == paint_key){
                return PAINTS[i];
            }
        }
    },
    getPaintsByProject: function(project_key){
    	var paints = [];
        for(var i = 0; i <= PAINTS.length - 1; i++){
            if(PAINTS[i].project == project_key{
                paints.push(PAINTS[i]);
            }
        }
        return paints;
    },
    getPaintsByType: function(surface_type, project_key){
        var paints = this.getPaintsByProject(project_key);
        for(var i = 0; i <= PAINTS.length - 1; i++){
            if(PAINTS[i].surface_type.toLowerCase() == surface_type.toLowerCase()){
                paints.push(PAINTS[i]);
            }
        }
        return paints;
    },

};

//Add the projects to the list
function populateProjects(projects){
    $('.project-item:not(.hidden)').remove();
    for(var i=0; i<projects.length; i++){
        var $newBlock = $('.project-item:first').clone();
        $newBlock.find('.project-key').val( projects[i].key );
        $newBlock.find('.project-title').val( projects[i].title );
        $newBlock.find('.project-date-created').text(
            projects[i].date_created.split('.')[0].replace('T',' ')
        );
        $newBlock.removeClass('hidden');

        //Animate show/hide controls
        $newBlock.click( function(){ 
            var $controls = $(this).find('.project-controls');
            if($controls.css('display') == 'block'){
                $controls.animate(
                    {height:0},200,'swing',
                    function(){$controls.addClass('hidden');
                });
            }else{
                $controls.removeClass('hidden');
                $controls.animate(
                    {height:30},200,'swing',
                    function(){}
                );
            }
        });
        
        //Setup click events for the controls.
        $newBlock.find('.btn-select-project').click(function(event){
            selectProject( 
                $(this).closest('.project-item').find('.project-key').val()
            );
        });
        $newBlock.find('.btn-edit-project').click(function(event){
            event.stopPropagation();
        });
        $newBlock.find('.btn-delete-project').click( deleteProject );

        $newBlock.appendTo('#projects-list'); 
    }
}

function selectProject(projectKey, reload){

    if(CURRENT_PROJECT.key == projectKey && reload != true){
        alert('Project already selected.');
        return;
    }

    if(CURRENT_PROJECT.key != projectKey){
        for(var i=0; i < PROJECTS.length; i++){
            if(PROJECTS[i].key == projectKey){
                CURRENT_PROJECT = PROJECTS[i];
                break;
            }
        }
    }

    $('#app-title').text('Paint Survey - ' + CURRENT_PROJECT.title);
    
    //Remove existing room pages
    if(CARO.owl.owlItems){
        while(CARO.owl.owlItems.length >= 4){
            CARO.removeItem(CARO.owl.owlItems.length - 1);
        }
    }

console.log('CURRENT_PROJECT.rooms.length ' + CURRENT_PROJECT.rooms.length );
console.log(CURRENT_PROJECT);
    //Add the room pages for this project
    if(CURRENT_PROJECT.rooms.length >= 1){
        var rooms = MODEL.getRoomsForProject(CURRENT_PROJECT.key);
console.log(rooms);
        for(var i = 0; i <= rooms.length - 1; i++){
            CARO.addItem($('#owl-pages .owl-page.room-page-template').html());
            initRoomPage(rooms[i]);
        }
    }else{
        //just add the default blank room.
        CARO.addItem($('#owl-pages .owl-page.room-page-template').html());
        initRoomPage();
    }
    CARO.next();
    
}

function createProject(){
    if($('#new-project-title').val().match(/\S/g)){
        doXhr({ 
            httpMethod: 'POST', 
            url: '/createproject',
            data: { projectTitle: $('#new-project-title').val() },
            dataType: 'json',
            successFunc: function(data){ 
                PROJECTS = data;
                populateProjects(PROJECTS);
                $('#new-project-title').val('');
            }
        });
    }else{
        alert('Project title can not be blank!');
    }
}

function deleteProject(){

    var project_key = $(this).closest('.project-item').find('.project-key').val();

    doXhr({
        httpMethod: 'POST', 
        url: '/deleteproject',
        data: { project_key: project_key },
        dataType: 'json',
        successFunc: function(data){
            PROJECTS = data;
            //TODO:update any orphan rooms.
            populateProjects(PROJECTS);
        }
    });
}

function getRoomGroupData($page){

    var results = {
        'bayBreastVals':[],
        'ceilingAdjustVals':[],
        'wallAdjustVals':[],
        'doorVals':[],
        'skirtingVals':[],
        'windowVals':[],
        'radiatorVals':[],
        'genSurfaceVals':[],
        'isolSurfaceVals':[],
        toString: function(){
            var str = '';
            str += 'bayBreastVals [' + this.bayBreastVals + ']\n';
            str += 'ceilingAdjustVals [' + this.ceilingAdjustVals + ']\n';
            str += 'wallAdjustVals [' + this.wallAdjustVals + ']\n';
            str += 'doorVals [' + this.doorVals + ']\n';
            str += 'skirtingVals [' + this.skirtingVals + ']\n';
            str += 'windowVals [' + this.windowVals + ']\n';
            str += 'radiatorVals [' + this.radiatorVals + ']\n';
            str += 'genSurfaceVals [' + this.genSurfaceVals + ']\n';
            str += 'isolSurfaceVals [' + this.isolSurfaceVals + ']\n';
            return str;
        }
    };

    var getf = function(inputElem, ancestor){
        $parent = (ancestor != null) ? $(ancestor) : $page;
        var floatVal = parseFloat($parent.find(inputElem).val());
        return Math.abs(floatVal) >= 0 ? floatVal : 0; 
    }

    var notZero = function(ancestor){
        var sum = 1;
        $(ancestor).find('input[type="number"]').each(function(idx, elem){
            sum *= parseFloat($(elem).val());
        });
        return (Math.abs(sum) > 0);
    }

    $page.find('.baybreast-group .input-block').each( function(index, elem){
        if(notZero(elem)){
            results.bayBreastVals.push([ 
                getf('.baybreast-depth', elem), 
                getf('.baybreast-width', elem) 
            ]);
        }
    });

    $page.find('.ceiling-adjust-group .input-block').each( function(index, elem){
        if($(elem).find('.ceiling-adjust-paint-key').val().length >= 1 
            && notZero(elem)){
            results.ceilingAdjustVals.push([ 
                $(elem).find('.ceiling-adjust-paint-key').val(),
                getf('.ceiling-adjust-qty', elem), 
                getf('.ceiling-adjust-dim1', elem), 
                getf('.ceiling-adjust-dim2', elem) 
            ]);
        }
    });

    $page.find('.wall-adjust-group .input-block').each( function(index, elem){
        if($(elem).find('.wall-adjust-paint-key').val().length >= 1 
            && notZero(elem)){
            results.wallAdjustVals.push([
                $(elem).find('.wall-adjust-paint-key').val(),
                getf('.wall-adjust-qty', elem), 
                getf('.wall-adjust-dim1', elem), 
                getf('.wall-adjust-dim2', elem) 
            ]);
        }
    });

    $page.find('.doors-group .input-block').each( function(index, elem){
        if($(elem).find('.door-surface-paint-key').val().length >= 1 
            && $(elem).find('.door-frame-paint-key').val().length >= 1
            && notZero(elem)){
            results.doorVals.push([
                $(elem).find('.door-surface-paint-key').val(),
                getf('.door-qty', elem), 
                getf('.door-width', elem), 
                getf('.door-height', elem),
                $(elem).find('.door-frame-paint-key').val(),
            ]);
        }
    });

    $page.find('.skirting-adjust-group .input-block').each( function(index, elem){
        if($(elem).find('.skirting-adjust-paint-key').val().length >= 1 
            && notZero(elem)){
            results.skirtingVals.push([
                $(elem).find('.skirting-adjust-paint-key').val(),
                getf('.skirting-adjust-qty', elem), 
                getf('.skirting-adjust-length', elem)
            ]);
        }
    });

    $page.find('.windows-group .input-block').each( function(index, elem){
        if($(elem).find('.window-paint-key').val().length >= 1 
            && notZero(elem)){
            results.windowVals.push([
                $(elem).find('.window-paint-key').val(),
                getf('.window-qty', elem), 
                getf('.window-width', elem), 
                getf('.window-height', elem) 
            ]);
        }
    });

    $page.find('.radiators-group .input-block').each( function(index, elem){
        if($(elem).find('.radiator-paint-key').val().length >= 1 
            && notZero(elem)){
            results.radiatorVals.push([
                $(elem).find('.radiator-paint-key').val(),
                getf('.radiator-qty', elem), 
                getf('.radiator-width', elem), 
                getf('.radiator-height', elem) 
            ]);
        }
    });

    $page.find('.general-surface-group .input-block').each( function(index, elem){
        if($(elem).find('.general-surface-paint-key').val().length >= 1 
            && notZero(elem)){
            results.genSurfaceVals.push([
                $(elem).find('.general-surface-paint-key').val(),
                getf('.general-surface-qty', elem),
                getf('.general-surface-width', elem),
                getf('.general-surface-height', elem) 
            ]);
        }
    });

    $page.find('.isolated-surface-group .input-block').each( function(index, elem){
        if($(elem).find('.isolated-surface-paint-key').val().length >= 1 
            && notZero(elem)){
            results.isolSurfaceVals.push([
                $(elem).find('.isolated-surface-paint-key').val(),
                getf('.isolated-surface-qty', elem),
                getf('.isolated-surface-length', elem),
            ]);
        }
    });

    return results;
}

function calculateWorkForRoom(event){

    var $roomForm = $(event.target).closest('.room-form');
    //Validate input first.
    if(!$roomForm.validate({ 
            errorPlacement: function(error, element) {
                error.insertAfter(element.closest('.input-pill'));
            }
        }).form()){
        return;
    }

    var getf = function(descendant, ancestor){
        var $elem = $(event.target).closest('.pageContent'); 
        $elem = (ancestor != null) ? $(ancestor) : $elem;
        var floatVal = parseFloat($elem.find(descendant).val());
        return Math.abs(floatVal) >= 0 ? floatVal : 0; 
    }
    
    var roomLength          =   getf('.room-length:first');
    var roomWidth           =   getf('.room-width:first');
    var roomHeight          =   getf('.room-height:first');
    
    var baybreastWall = 0;
    var baybreastCeiling = 0;
    var baybreastSkirting = 0;

    var ceilingAdjustSimple     =   getf('.ceiling-adjust-simple');
    var wallAdjustSimple        =   getf('.wall-adjust-simple');
    var skirtingAdjustSimple    =   getf('.skirting-adjust-simple');

    var ceilingAdjustSpace = 0;
    var ceilingAdjustHours = 0;

    var wallAdjustSpace = 0;
    var wallAdjustHours = 0;

    var doorsTotalWidth = 0;
    var doorSurface = 0;
    var doorFrame = 0;
    var doorSurfHours = 0;
    var doorFrameHours = 0;

    var skirtingAdjustSpace = 0;
    var skirtingAdjustHours = 0;

    var windowSpace = 0;
    var windowHours = 0;

    var radiatorSpace = 0;
    var radiatorHours = 0;

    var genSurfSpace = 0;
    var genSurfHours = 0;

    var isolSurfSpace = 0;
    var isolSurfHours = 0;

    var roomData = getRoomGroupData($roomForm);
    
console.log('roomData in calc');
console.log(roomData);

    /* BAYBREAST SPACE */
    for(var i = 0; i <= roomData.bayBreastVals.length - 1; i++){
        var bbDepth = roomData.bayBreastVals[i][0];
        var bbWidth = roomData.bayBreastVals[i][1];
        if(Math.abs(bbDepth * bbWidth) > 0){
            baybreastWall += (2 * bbDepth * roomHeight);
            baybreastCeiling += (bbWidth * bbDepth);
            baybreastSkirting += (2 * bbDepth);
        }
    }

    /* CEILING ADJUST SPACE */
    for(var i = 0; i <= roomData.ceilingAdjustVals.length - 1; i++){
        var prodRate = MODEL.getPaint(roomData.ceilingAdjustVals[i][0]).prod_rate;
        var quantity = roomData.ceilingAdjustVals[i][1];
        var dim1 = roomData.ceilingAdjustVals[i][0];
        var dim2 = roomData.ceilingAdjustVals[i][1];
        if(Math.abs(quantity * dim1 * dim2) > 0) {
            ceilingAdjustSpace += (quantity * dim1 * dim2);
            ceilingAdjustHours += ((quantity * dim1 * dim2) / prodRate);
        }
    }

    /* WALL ADJUST SPACE */
    for(var i = 0; i <= roomData.wallAdjustVals.length - 1; i++){
        var prodRate = MODEL.getPaint(roomData.wallAdjustVals[i][0]).prod_rate;
        var quantity = roomData.wallAdjustVals[i][1];
        var dim1 = roomData.wallAdjustVals[i][2];
        var dim2 = roomData.wallAdjustVals[i][3];
        if(Math.abs(quantity * dim1 * dim2) > 0) {
            wallAdjustSpace += (quantity * dim1 * dim2);
            wallAdjustHours += ((quantity * dim1 * dim2) / prodRate);
        }
    }

    /* DOOR & FRAME SPACE*/
    for(var i = 0; i <= roomData.doorVals.length - 1; i++){
        var prodRate = MODEL.getPaint(roomData.doorVals[i][0]).prod_rate;
        var quantity = roomData.doorVals[i][1];
        var dim1 = roomData.doorVals[i][2];
        var dim2 = roomData.doorVals[i][3];
        if(Math.abs(quantity * dim1 * dim2) > 0) {
            doorsTotalWidth += dim1;
            doorSurface += (quantity * dim1 * dim2);
            doorSurfHours += ((quantity * dim1 * dim2) / prodRate);
        }
        var frameProdRate = MODEL.getPaint(roomData.doorVals[i][4]).prod_rate;
        doorFrame += (2 * dim2 + dim1);
        doorFrameHours += (2 * dim2 + dim1) / frameProdRate;
    }

    /* SKIRTING SURFACE SPACE */
    for(var i = 0; i <= roomData.skirtingVals.length - 1; i++){
        var prodRate = MODEL.getPaint(roomData.skirtingVals[i][0]).prod_rate;
        var quantity = roomData.skirtingVals[i][1];
        var dim1 = roomData.skirtingVals[i][2];
        if(Math.abs(quantity * dim1) > 0) {
            skirtingAdjustSpace += (quantity * dim1);
            skirtingAdjustHours += ((quantity * dim1) / prodRate);
        }
    }

    /* WINDOW SPACE */
    for(var i = 0; i <= roomData.windowVals.length - 1; i++){
        var prodRate = MODEL.getPaint(roomData.windowVals[i][0]).prod_rate;
        var quantity = roomData.windowVals[i][1];
        var dim1 = roomData.windowVals[i][2];
        var dim2 = roomData.windowVals[i][3];
        if(Math.abs(quantity * dim1 * dim2) > 0) {
            windowSpace += (quantity * dim1 * dim2);
            windowHours += ((quantity * dim1 * dim2) / prodRate);
        }
    }

    /* RADIATOR SPACE */
    for(var i = 0; i <= roomData.radiatorVals.length - 1; i++){
        var prodRate = MODEL.getPaint(roomData.radiatorVals[i][0]).prod_rate;
        var quantity = roomData.radiatorVals[i][1];
        var dim1 = roomData.radiatorVals[i][2];
        var dim2 = roomData.radiatorVals[i][3];
        if(Math.abs(quantity * dim1 * dim2) > 0) {
            radiatorSpace += (quantity * dim1 * dim2);
            radiatorHours += ((quantity * dim1 * dim2) / prodRate);
        }
    }

    /* GENERAL SURFACE SPACE */
    for(var i = 0; i <= roomData.genSurfaceVals.length - 1; i++){
        var prodRate = MODEL.getPaint(roomData.genSurfaceVals[i][0]).prod_rate;
        var quantity = roomData.genSurfaceVals[i][1];
        var dim1 = roomData.genSurfaceVals[i][2];
        var dim2 = roomData.genSurfaceVals[i][3];
        if(Math.abs(quantity * dim1 * dim2) > 0) {
            genSurfSpace += (quantity * dim1 * dim2);
            genSurfHours += ((quantity * dim1 * dim2) / prodRate);
        }
    }

    /* ISOLATED SURFACE SPACE */
    for(var i = 0; i <= roomData.isolSurfaceVals.length - 1; i++){
        var prodRate = MODEL.getPaint(roomData.isolSurfaceVals[i][0]).prod_rate;
        var quantity = roomData.isolSurfaceVals[i][1];
        var dim1 = roomData.isolSurfaceVals[i][2];
        if(Math.abs(quantity * dim1) > 0) {
            isolSurfSpace += (quantity * dim1);
            isolSurfHours += ((quantity * dim1) / prodRate);
        }
    }

    var ceilingSpace =  (roomLength * roomWidth) + baybreastCeiling + ceilingAdjustSpace; 
    var wallSpace =     (roomLength + roomWidth) * 2 * roomHeight - doorSurface - windowSpace + baybreastWall + wallAdjustSpace; 
    var skirtingSpace = (roomLength + roomWidth) * 2 - doorsTotalWidth + baybreastSkirting + skirtingAdjustSpace;

    var getRate = function(surface_type){
        var key = $('#select-' + surface_type + '-spec').val();
        var paint = MODEL.getPaint(key);
        return parseFloat(paint.prod_rate);
    };

    var tableData = [
        { title: 'CEILING',     amount: ceilingSpace,    units: 'm2', hours: ceilingSpace / getRate('ceilings') + ceilingAdjustSpace + ceilingAdjustSimple },
        { title: 'WALL',        amount: wallSpace,       units: 'm2', hours: wallSpace / getRate('walls') + wallAdjustHours + wallAdjustSimple },
        { title: 'DOOR AREA',   amount: doorSurface,     units: 'm2', hours: doorSurfHours },
        { title: 'DOOR FRAME',  amount: doorFrame,       units: 'm',  hours: doorFrameHours },
        { title: 'WINDOW',      amount: windowSpace,     units: 'm2', hours: windowHours },
        { title: 'RADIATOR',    amount: radiatorSpace,   units: 'm2', hours: radiatorHours },
        { title: 'SKIRTING',    amount: skirtingSpace,   units: 'm2', hours: skirtingSpace / getRate('isolated-surfaces') + skirtingAdjustHours + skirtingAdjustSimple }, 
        { title: 'GENERAL SURFACE',    amount: genSurfSpace,   units: 'm2', hours: genSurfHours },
        { title: 'ISOLATED SURFACE',    amount: isolSurfSpace,   units: 'm', hours: isolSurfHours }
    ];

    var $resultsElem = $(event.target).closest('.pageContent').find('.results:first');
    $resultsElem.html(buildResultsTable(tableData));
    $resultsElem.fadeIn(500);

    $("html, body").animate({ scrollTop: 0 }, "slow");
}

function buildResultsTable(tableData){
    var results = '<table><tr><th>Part</th><th>Amount</th><th></th><th>Hours</th></tr>';
    var totalHours = 0;
    
    for (i = 0; i < tableData.length; ++i) {
        obj = tableData[i];
        results += '<tr>';
        for (var key in obj){
            if (obj.hasOwnProperty(key)) {
                var val = 0;
                var cssClass = 'class="tdRightAlign"';
                if(key == 'amount' ){
                    val = roundAndFix(obj[key], 2);
                }else if(key == 'hours'){
                    val = roundAndFix(obj[key], 2);
                    totalHours += parseFloat(val);
                }else{
                    val = obj[key];
                    cssClass = '';
                }
                results += '<td ' + cssClass + '>' + val + '</td>';
            }
        }
        results += '</tr>';
    }

    results += '<tr class="rowTotalHours"><td>TOTAL:</td><td></td><td></td><td class="tdRightAlign">' + totalHours.toFixed(2) + '</td></tr>';
    results += '</table>';
    return results;
}

function roundAndFix (number, precision) {
    var multiplier = Math.pow (10, precision);
    var result = Math.round (number * multiplier) / multiplier;
    return result.toFixed(precision);
}

function keydownDecimalInput(event){

    var $elem = $(this);

    // Allow: backspace, delete, tab, escape, enter, ctrl+A
    if ($.inArray(event.keyCode, [46, 8, 9, 27, 13, 110]) !== -1 ||
         // Allow: Ctrl+A
        (event.keyCode == 65 && event.ctrlKey === true) || 
         // Allow: home, end, left, right
        (event.keyCode >= 35 && event.keyCode <= 39)) {
             // let it happen, don't do anything
             return;
    }

    //If the input allows negative numbers allow '-' minus sign.
    if(event.keyCode == 189){
        if(!$elem.attr('min') || parseFloat($elem.attr('min')) < 0){
            //if already minus sign or number before, prevent.
            if(/[0-9\-]/.test($elem.val())) {
                event.preventDefault();
            }
            return
        }
    }

    //If not number or decimal point, prevent.
    if(/[^0-9]/.test(String.fromCharCode(event.keyCode))
      && event.keyCode != 190 ){
        event.preventDefault();
        return;
    };

    //if already decimal point, prevent.
    if(event.keyCode == 190 && /\./.test(this.value)) {
        event.preventDefault();
        return;
    }
}

function keyupDecimalInput(event){
    var $elem = $(this);
    if($elem.val().length > 0){
        if($elem.val() > 0){
            $elem.css('color','black');
        }else{
            $elem.css('color','red');
        }
    }
    
}

function keydownIntegerInput(event){
    // Allow: backspace, delete, tab, escape, enter, ctrl+A
    if ($.inArray(event.keyCode, [46, 8, 9, 27, 13, 110]) !== -1 ||
         // Allow: Ctrl+A
        (event.keyCode == 65 && event.ctrlKey === true) || 
         // Allow: home, end, left, right
        (event.keyCode >= 35 && event.keyCode <= 39)) {
             // let it happen, don't do anything
             return;
    }

    //If not number, prevent
    if(/[0-9]/.test(String.fromCharCode(event.keyCode))) return;

    event.preventDefault();  
}

function blurDecimal(event, inpElem){
    var $inpElem = $(this);
    if(inpElem != null) $inpElem = $(inpElem);
   
    //Enforce 2 decimal places.
    if($inpElem.val().length == 0
        || $inpElem.val().trim() == '.'){
         $inpElem.val( '0.00' );
    }
    
    $inpElem.val( parseFloat($inpElem.val()).toFixed(2) );
    //Set red color for negative values
     if($inpElem.val() >= 0){
        $inpElem.css('color','black');
    }else{
        $inpElem.css('color','red');
    }
}

function blurInputFocus(event){
    var tagName = event.target.tagName.toLowerCase();
    if(tagName != 'input' && tagName != 'select'){
        $(':focus').blur();
    }
    var $elem = $(event.target);
    if($elem.hasAncestor('.dropdown-menu') == false
      && $elem.hasAncestor('.dropdown-btn') == false){
       $('.dropdown.open').removeClass('open');
    }
    if($elem.hasClass('pos-neg') == false 
      && $elem.attr('id') != 'btn-pos-neg'){
        $('#btn-pos-neg').hide();
    }
}

function roomDefaultsChange(){
    //Update the corresponding input on the room 1 screen.
    var $elem = $(this);
    $('.' + $elem.attr('id').replace('default-','')).val($elem.val());
}

function switchSign(inpElem){
    $inpElem = $(inpElem);
    $inpElem.val(-1 * $inpElem.val());
    //$inpElem.blur();
    $inpElem.focus();
}

function initOwlCarousel(){
    //Add the pages into the CARO
    $('#owl-pages .owl-page').each(function(){
        var $page = $(this);
        if($page.hasClass('room-page-template') == false){
            $page.appendTo('#owl-carousel');
        }
    })
    $('#owl-carousel').owlCarousel(
        { 
            navigation : true, // Show next and prev buttons
            slideSpeed : 300,
            paginationSpeed : 400,
            singleItem: true,
            afterInit : function(elem){
              var that = this;
              that.owlControls.prependTo(elem);
              this.jumpTo(2);
            }
        }
    );
    CARO = $('#owl-carousel').data('owlCarousel');
}

function toggleDropDown(){
    var $dropdown = $(this).closest('.dropdown');
    var c = 'open';

    if($dropdown.hasClass(c)){
        $dropdown.removeClass(c);
    }else{
        $dropdown.addClass(c);
    };
}

function selectDropDownItem(){
    //find the closest drop down and set the value of the hidden input.
    var $clickedItem = $(this);
    var $dropdown = $clickedItem.closest('.dropdown');
    $dropdown.find('.dropdown-value').val( $clickedItem.data('value') );
    $dropdown.find('.dropdown-text').text( $clickedItem.text() );
    $dropdown.removeClass('open');
    return false;
}

function initDropdown(elem){

    var $elem = $(elem);
    var selectedValue = $elem.find('.dropdown-value').val();
    var dropdownText = $elem.find('.dropdown-text').text().toLowerCase();

    if (dropdownText == 'dropdown' || dropdownText == 'menu item'){
        var defaultItem = $elem.find('.dropdown-menu a:first');
        $elem.find('.dropdown-value').val( defaultItem.data('value') );
        $elem.find('.dropdown-text').text( defaultItem.text() );
    }
    
    $elem.find('.dropdown-btn').unbind('click');
    $elem.find('.dropdown-btn').click( toggleDropDown );
    $elem.find('.dropdown-menu a').bind( 'click touchstart', selectDropDownItem );

}

function initDropdowns(context){
    if(context == null) context = $('html');
    $(context).find('.dropdown').each( function(index, elem){
        initDropdown(elem);
    });
}

function swapElements(elm1, elm2) {
    var parent1, next1,
        parent2, next2;

    parent1 = elm1.parentNode;
    next1   = elm1.nextSibling;
    parent2 = elm2.parentNode;
    next2   = elm2.nextSibling;

    parent1.insertBefore(elm2, next1);
    parent2.insertBefore(elm1, next2);
}

function showEditSpecView(){
    var $clickedButton = $(this);
    
    var surface_type = $clickedButton.closest('.spec-item-block')
                          .find('.spec-item-title').text();
    $('#spec-surface-type').val(surface_type);

    //For each paint of this surface type, build the edit inputs.
    $.each(PAINTS, function(i, paint) {  
        if (paint.surface_type.toLowerCase() == surface_type.toLowerCase()) {
            var $newBlock = $('#form-edit-spec .input-block:first').clone();
            $newBlock.find('input.spec-item-key').val(paint.key);
            $newBlock.find('input.spec-item-order').val(paint.order);
            $newBlock.find('input.spec-item-name').val(paint.name);
            $newBlock.find('input.spec-item-rate').val(paint.prod_rate);
            $newBlock.removeClass('hidden');
            $newBlock.insertAfter('#form-edit-spec .input-block:last');
            $btnRemove = $newBlock.find('.btn-remove-row:first');
            $btnRemove.css('display','block');
            $btnRemove.click(function(event){ $(event.target).closest('.input-block').remove(); });
            $btnReorderUp = $newBlock.find('.btn-reorder-item-up');
            $btnReorderDown = $newBlock.find('.btn-reorder-item-down');
            $btnReorderUp.click( function(){ 
                var $thisBlock = $(this).closest('.input-block');
                var $partnerBlock = $thisBlock.prev('.input-block:not(.hidden)');
                if(typeof $partnerBlock.get(0) != 'undefined'){
                    swapElements($thisBlock.get(0), $partnerBlock.get(0));
                    var order1 = $thisBlock.find('input.spec-item-order').val();
                    var order2 = $partnerBlock.find('input.spec-item-order').val();
                    $thisBlock.find('input.spec-item-order').val(order2)
                    $partnerBlock.find('input.spec-item-order').val(order1);
                }
            });
            $btnReorderDown.click( function(){ 
                var $thisBlock = $(this).closest('.input-block');
                var $partnerBlock = $thisBlock.next('.input-block:not(.hidden)');
                if(typeof $partnerBlock.get(0) != 'undefined'){
                    swapElements($thisBlock.get(0), $partnerBlock.get(0));
                    var order1 = $thisBlock.find('input.spec-item-order').val();
                    var order2 = $partnerBlock.find('input.spec-item-order').val();
                    $thisBlock.find('input.spec-item-order').val(order2)
                    $partnerBlock.find('input.spec-item-order').val(order1);
                } 
            });
        }
    });
    
    initDecimalInputs();

    $('#form-view-spec').fadeOut('fast', function(){
        $('#form-edit-spec').fadeIn('fast');
    });
}

function getPaints(){
    doXhr({
        httpMethod: 'GET',
        url: '/getpaints',
        dataType: 'json',
        successFunc: function(data){ PAINTS = data; }
    });
}

function populateSpecDropdowns(){
    $('.spec-item-block:not(.hidden)').remove();

    //Display view, for each surface type, build the dropdown menus.
    for(var i = 0; i < SURFACE_TYPES.length; i++){
        $newBlock = $('.spec-item-block:first').clone();
        $newBlock.find('.spec-item-title').text( SURFACE_TYPES[i] );
console.log(CURRENT_PROJECT);
        var paints = MODEL.getPaintsByType(SURFACE_TYPES[i], CURRENT_PROJECT);
        $.each(paints, function(j, paint) {
            $newBlock.find('.dropdown-value').attr('id',
                'select-' + paint.surface_type.toLowerCase().replace(' ', '-') + '-spec');
            $newBlock.find('ul.dropdown-menu').append(
                '<li><a role="menuitem" data-value="' + paint.key + '" >' 
                + paint.name + ' (' + paint.prod_rate + ') </a></li>'
            );
        });
        $newBlock.removeClass('hidden');
        $newBlock.appendTo('#form-view-spec');
    }
    $('.btn-edit-spec').click( showEditSpecView );
    initDropdowns($('#form-view-spec'));
}

function initSpecificationPage(){
    populateSpecDropdowns();
    $('#form-edit-spec .btn-save').click( onSpecSave );
    $('#form-edit-spec .btn-cancel').click( fadeToViewSpec );
}

function fadeToViewSpec(){
    $('#form-edit-spec').fadeOut('fast', function(){
        $('#form-edit-spec .input-block:not(.hidden)').remove();
        populateSpecDropdowns();
        $('#form-view-spec').fadeIn('fast');
    });
}

function onSpecSave(){

    var arrSpecItemData = [];
    var specItemNames = [];
    var duplicates = [];

    /* Prevent duplicate spec-item-names for this surface type */
    $('#form-edit-spec .input-block:not(.hidden) .spec-item-name').each(function(index, elem) {
        var inputVal = $(elem).val().trim();
        if($.inArray(inputVal.toLowerCase(), specItemNames) == -1) { //Not found
            specItemNames.push(inputVal.toLowerCase());
        } else {
            duplicates.push(inputVal);
        }
    });

    if(duplicates.length >= 1){
      alert("Can not save, duplicate value(s) found: " + duplicates.toString());
      return;
    }

    /* Build up the json data making save call */
    $('#form-edit-spec .input-block:not(.hidden)').each( function(index, elem){
        var $elemBlock = $(elem);
        arrSpecItemData.push({ 
            key:          $elemBlock.find('.spec-item-key').val(),
            order:        $elemBlock.find('.spec-item-order').val(),
            name:         $elemBlock.find('.spec-item-name').val().trim(),
            prod_rate:    $elemBlock.find('.spec-item-rate').val(),
            surface_type: $('#spec-surface-type').val()
        });
    });

    doXhr({
        httpMethod: 'POST',
        url: '/savespec',
        data: { 
          surface_type: $('#spec-surface-type').val(), 
          paints: JSON.stringify(arrSpecItemData) 
        },
        dataType: 'json',
        successFunc: function(data){ 
            PAINTS = data; 
            fadeToViewSpec();
        }
    });
    
}

function deleteRoom(room_key){

    //Do an ajax call to save the room data
    doXhr({
        httpMethod: 'POST',
        url: '/deleteroom',
        data: { room_key: room_key },
        successFunc: function(data){
                          MODEL.deleteRoom(room_key);
                          CURRENT_PROJECT = data;
                          selectProject(CURRENT_PROJECT.key, true);
                      }
    });

}

function saveRoom(room, keyElem){
/*    
console.log('room before save: ');
console.log(room);
*/
    doXhr({
        httpMethod: 'POST',
        url: '/saveroom',
        data: { room: JSON.stringify( room ) },
        dataType: 'json',
        successFunc:  function(data, status){
                          if(status == 'success'){
                              alert('Room saved.');
                              MODEL.updateRoom(data);
                              if(keyElem != null) {
                                  $(keyElem).val(data.key);
                              }
                          }else{
                              alert('Error saving room.');
                          }
                          $('html, body').animate({ scrollTop: 0 }, 'slow');
                      }
    });

}

function initRoomDefaultsPage(){
    
    var drm = DEFAULT_ROOM;

console.log(drm);

    $('#default-room-key'         ).val( drm.key );
    $('#default-room-height'      ).val( drm.room_height );
    $('#default-door-width'       ).val( drm.door_width );
    $('#default-door-height'      ).val( drm.door_height );
    $('#default-window-width'     ).val( drm.window_width );
    $('#default-window-height'    ).val( drm.window_height );
    $('#default-radiator-width'   ).val( drm.radiator_width );
    $('#default-radiator-height'  ).val( drm.radiator_height );
    
    $('#form-room-defaults input[type="number"]').change( roomDefaultsChange );

    $('#form-room-defaults .btn-save').click( function(){
        saveRoom({
            key:                $('#default-room-key').val(),
            name:               '',
            room_hours_adjust:      0,
            room_width:             0,
            room_length:            0,
            ceiling_adjust_simple:  0,
            wall_adjust_simple:     0,
            skirting_adjust_simple: 0,
            room_height:            parseFloat($('#default-room-height').val()),
            door_width:             parseFloat($('#default-door-width').val()),
            door_height:            parseFloat($('#default-door-height').val()),
            window_width:           parseFloat($('#default-window-width').val()),
            window_height:          parseFloat($('#default-window-height').val()),
            radiator_width:         parseFloat($('#default-radiator-width').val()),
            radiator_height:        parseFloat($('#default-radiator-height').val()),
            group_items:            '',
            is_default:             true,
            project:                ''
        });
    });      
}

function initProjectsPage(){
    populateProjects(PROJECTS);
    $('#btn-create-project').click( createProject );
}

function initRoomPage(room){
    var getf = function(elemId){
        return parseFloat($(elemId).val()).toFixed(2);
    }

    var $page = $('.owl-item:last .room-page');

    //Use the default room settings if room object not passed in.
    if(room == null){
        room = {  
            'name'                  : '',
            'room_length'           : 0,
            'room_width'            : 0,
            'room_height'           : getf('#default-room-height'),
            'ceiling_adjust_simple' : 0,
            'wall_adjust_simple'    : 0,
            'skirting-adjust-simple': 0,
            'door_width'            : getf('#default-door-width'),
            'door_height'           : getf('#default-door-height'),
            'window_width'          : getf('#default-window-width'),
            'window_height'         : getf('#default-window-height'),
            'radiator_width'        : getf('#default-radiator-width'),
            'radiator_height'       : getf('#default-radiator-height'),
            'project'				: null
        }
    } 

    $page.find('input[type=number]').val(0);

    //Set some defaults
    $page.find('.ceiling-adjust-qty')     .val(1);
    $page.find('.wall-adjust-qty')        .val(1);
    $page.find('.door-qty')               .val(1);
    $page.find('.skirting-adjust-qty')    .val(1);
    $page.find('.window-qty')             .val(1);
    $page.find('.radiator-qty')           .val(1);
    $page.find('.general-surface-qty')    .val(1);
    $page.find('.isolated-surface-qty')   .val(1);
    $page.find('.door-width:first')       .val( room.door_width );
    $page.find('.door-height:first')      .val( room.door_height );
    $page.find('.window-width:first')     .val( room.window_width );
    $page.find('.window-height:first')    .val( room.window_height );
    $page.find('.radiator-width:first')   .val( room.radiator_width );
    $page.find('.radiator-height:first')  .val( room.radiator_height );

    $page.find('.room-key')               .val( room.key );
    $page.find('.room-title')             .val( room.name );
    $page.find('.room-hours-adjust')      .val( room.room_hours_adjust );
    $page.find('.room-height')            .val( room.room_height );
    $page.find('.room-width')             .val( room.room_width );
    $page.find('.room-length')            .val( room.room_length );
    $page.find('.ceiling-adjust-simple')  .val( room.ceiling_adjust_simple );
    $page.find('.wall-adjust-simple')     .val( room.wall_adjust_simple );
    $page.find('.skirting-adjust-simple') .val( room.skirting_adjust_simple );
    
    
    //Build input blocks and set the values for each group item.
    if(room.group_items != null){
/*
console.log('fetch room group items');
console.log(room.group_items);
*/      
        /* TODO: refactor following code to use a function to set drop down values 
        and input values for each input group */

        for(var i = 0; i <= room.group_items.bayBreastVals.length - 1; i++){
            
            if(i >= 1) addInputBlock( $page.find('.baybreast-group .btn-add-row:last') );
            var $block = $page.find('.baybreast-group .input-block:last');
            $block.find('.baybreast-width').val( room.group_items.bayBreastVals[i][0] );
            $block.find('.baybreast-depth').val( room.group_items.bayBreastVals[i][1] );
        }
        
        for(var i = 0; i <= room.group_items.ceilingAdjustVals.length - 1; i++){
            
            if(i >= 1) addInputBlock( $page.find('.ceiling-adjust-group .btn-add-row:last') );
            var $block = $page.find('.ceiling-adjust-group .input-block:last');
            var paint = MODEL.getPaint(room.group_items.ceilingAdjustVals[i][0]);
            $block.find('.dropdown-value').val( paint.key );
            $block.find('.dropdown-text').text( paint.name );
            $block.find('.ceiling-adjust-qty').val( room.group_items.ceilingAdjustVals[i][1] );
            $block.find('.ceiling-adjust-dim1').val( room.group_items.ceilingAdjustVals[i][2] );
            $block.find('.ceiling-adjust-dim2').val( room.group_items.ceilingAdjustVals[i][3] );
        }
        
        for(var i = 0; i <= room.group_items.wallAdjustVals.length - 1; i++){
            
            if(i >= 1) addInputBlock( $page.find('.wall-adjust-group .btn-add-row:last') );
            var $block = $page.find('.wall-adjust-group .input-block:last');
            $block.find('.wall-adjust-qty').val( room.group_items.wallAdjustVals[i][1] );
            $block.find('.wall-adjust-dim1').val( room.group_items.wallAdjustVals[i][2] );
            $block.find('.wall-adjust-dim2').val( room.group_items.wallAdjustVals[i][3] );        
        }

        for(var i = 0; i <= room.group_items.doorVals.length - 1; i++){
            
            if(i >= 1) addInputBlock( $page.find('.doors-group .btn-add-row:last') );
            var $block = $page.find('.doors-group .input-block:last');
            var surfacePaint = MODEL.getPaint(room.group_items.doorVals[i][0]);
            $block.find('.dropdown.door-surface .dropdown-value').val( surfacePaint.key );
            $block.find('.dropdown.door-surface .dropdown-text').text( surfacePaint.name );
            var framePaint = MODEL.getPaint(room.group_items.doorVals[i][4]);
            $block.find('.dropdown.door-frame .dropdown-value').val( framePaint.key );
            $block.find('.dropdown.door-frame .dropdown-text').text( framePaint.name );
            $block.find('.door-qty').val( room.group_items.doorVals[i][1] );
            $block.find('.door-width').val( room.group_items.doorVals[i][2] );
            $block.find('.door-height').val( room.group_items.doorVals[i][3] );        
        }

        for(var i = 0; i <= room.group_items.skirtingVals.length - 1; i++){
            
            if(i >= 1) addInputBlock( $page.find('.skirting-adjust-group .btn-add-row:last') );
            var $block = $page.find('.skirting-adjust-group .input-block:last');
            $block.find('.skirting-adjust-qty').val( room.group_items.skirtingVals[i][1] );
            $block.find('.skirting-adjust-length').val( room.group_items.skirtingVals[i][2] );
        }

        for(var i = 0; i <= room.group_items.windowVals.length - 1; i++){
            
            if(i >= 1) addInputBlock( $page.find('.windows-group .btn-add-row:last') );
            var $block = $page.find('.windows-group .input-block:last');
            $block.find('.window-qty').val( room.group_items.windowVals[i][1] );
            $block.find('.window-width').val( room.group_items.windowVals[i][2] );
            $block.find('.window-height').val( room.group_items.windowVals[i][3] );        
        }

        for(var i = 0; i <= room.group_items.radiatorVals.length - 1; i++){
            
            if(i >= 1) addInputBlock( $page.find('.radiators-group .btn-add-row:last') );
            var $block = $page.find('.radiators-group .input-block:last');
            $block.find('.radiator-qty').val( room.group_items.radiatorVals[i][1] );
            $block.find('.radiator-width').val( room.group_items.radiatorVals[i][2] );
            $block.find('.radiator-height').val( room.group_items.radiatorVals[i][3] );        
        }

        for(var i = 0; i <= room.group_items.genSurfaceVals.length - 1; i++){
            
            if(i >= 1) addInputBlock( $page.find('.general-surface-group .btn-add-row:last') );
            var $block = $page.find('.general-surface-group .input-block:last');
            var paint = MODEL.getPaint(room.group_items.genSurfaceVals[i][0]);
            $block.find('.dropdown-value').val( paint.key );
            $block.find('.dropdown-text').text( paint.name );
            $block.find('.general-surface-qty').val( room.group_items.genSurfaceVals[i][1] );
            $block.find('.general-surface-width').val( room.group_items.genSurfaceVals[i][2] );
            $block.find('.general-surface-height').val( room.group_items.genSurfaceVals[i][3] );
        }
        
        for(var i = 0; i <= room.group_items.isolSurfaceVals.length - 1; i++){
            
            if(i >= 1) addInputBlock( $page.find('.isolated-surface-group .btn-add-row:last') );
            var paint = MODEL.getPaint(room.group_items.isolSurfaceVals[i][0]);
            var $block = $page.find('.isolated-surface-group .input-block:last');
            $block.find('.dropdown-value').val( paint.key );
            $block.find('.dropdown-text').text( paint.name );
            $block.find('.isolated-surface-qty').val( room.group_items.isolSurfaceVals[i][1] );
            $block.find('.isolated-surface-length').val( room.group_items.isolSurfaceVals[i][2] );
        }
    }

    $page.find('.pos-neg').focus( onPosNegInputFocus );

    var fillDropdown = function(page, dropdownId, paintType){
        var $page = $(page);
        var $dropdown = $page.find(dropdownId);
        $dropdown.empty();
        var paints = MODEL.getPaintsByType(paintType, CURRENT_PROJECT);
        $.each(paints, function(j, paint) {
            $dropdown.append(
                '<li><a role="menuitem" data-value="' + paint.key + '" >' 
                + paint.name + ' (' + paint.prod_rate + ') </a></li>'
            );
        });
    }

    fillDropdown($page, '.ceiling-adjust-group ul.dropdown-menu', 'ceilings');
    fillDropdown($page, '.wall-adjust-group ul.dropdown-menu', 'walls');
    fillDropdown($page, '.doors-group .door-surface ul.dropdown-menu', 'doors');
    fillDropdown($page, '.doors-group .door-frame ul.dropdown-menu', 'isolated surfaces');
    fillDropdown($page, '.skirting-adjust-group ul.dropdown-menu', 'isolated surfaces');
    fillDropdown($page, '.windows-group ul.dropdown-menu', 'windows');
    fillDropdown($page, '.radiators-group ul.dropdown-menu', 'radiators');
    fillDropdown($page, '.general-surface-group ul.dropdown-menu', 'doors');
    fillDropdown($page, '.isolated-surface-group ul.dropdown-menu', 'isolated surfaces');

    $page.find('.btn-calculate-room').click( calculateWorkForRoom );
    $page.find('.btn-delete-room').click( onDeleteRoomClick );
    $page.find('.btn-save-room').click( onSaveRoomClick );

    initIntegerInputs();
    initDecimalInputs();
    initDropdowns($page);
    initAddInputBlockButtons();
    initInputCursorPos($page);
}

function onPosNegInputFocus(event, secondCall){
    /* Show/hide a hovering button above input to 
    allow user to switch +/- sign */

    var $inp = $(this);  
    var $btn = $('#btn-pos-neg');

    $btn.css('top',$inp.offset().top - $btn.outerHeight());
    $btn.css('left',$inp.offset().left);
    $btn.css('display','block');
    $btn.off('click');
    $btn.on('click', function(event){
        switchSign($inp); 
        event.stopPropagation();
    });

    return true;
}

function onDeleteRoomClick(){
    if(CURRENT_PROJECT.rooms.length >= 1){
        deleteRoom($(this).closest('.owl-item').find('.room-key').val());
    }else{
        alert('Room not saved yet.');
    }
}

function onSaveRoomClick(){

    var $page = $(this).closest('.owl-item');
    var getf = function(elemId){
        return parseFloat($page.find(elemId).val());
    }

    groupItems = getRoomGroupData($page);

    if(isObjectEmpty(CURRENT_PROJECT)){
        alert('Please select a project first.');
    }else{
        saveRoom({
            key:                    $page.find('.room-key').val(),
            name:                   $page.find('.room-title').val(),
            room_hours_adjust:      getf('.room-hours-adjust'),
            room_length:            getf('.room-length'),
            room_width:             getf('.room-width'),
            room_height:            getf('.room-height'),
            ceiling_adjust_simple:  getf('.ceiling-adjust-simple'),
            wall_adjust_simple:     getf('.wall-adjust-simple'),
            skirting_adjust_simple: getf('.skirting-adjust-simple'),
            group_items:            groupItems,
            is_default:             false,
            project:                CURRENT_PROJECT.key
        }, '.room-key');
    }

}

function initInputCursorPos(context){

    var $context = $('body');
    if(context != null) $context = $(context); 
    $('input[type="number"],input[type="text"]').focus( function(event){
    /* Set the cursor position to the end when input focussed */
    /* Does not work for number inputs in Google Chrome */
    if(this.setSelectionRange){
            var len = $(this).val().length * 2;
            this.setSelectionRange(len, len);
        } else {
            $(this).val($(this).val());
        }
    });
}

function initIntegerInputs(){
    $('.integer').keydown( keydownIntegerInput );
}

function initDecimalInputs(){
    $('.decimal').keydown( keydownDecimalInput );
    $('.decimal').keyup( keyupDecimalInput );
    $('.decimal').bind( 'blur', blurDecimal );
    $('.decimal').blur();
}

function svgEl(tagName) {
    return document.createElementNS("http://www.w3.org/2000/svg", tagName);
}

function addSvgElems(containerIds, svgElemData){
    for(var i=0;i<containerIds.length;i++){
        var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        $(containerIds[i]).append($(svg).attr({ 'width':30, 'height':30 }));
        for(var j=0;j<svgElemData.length;j++){
            $(containerIds[i] + ' > svg').append(
              $(svgEl(svgElemData[j]['tagName'])).attr(svgElemData[j])
            );
        }
    }
}

function addSvgButtons(){

    addSvgElems(
        [ '#btn-add-spec-item','.btn-add-row' ],
        [
          { 'tagName':'circle', cx: 15, cy: 15, r: 15, 'fill': 'blue'},
          { 'tagName':'polygon','points':'12,6 18,6 18,12 24,12 24,18 18,18 18,24 12,24 12,18 12,18 6,18 6,12 12,12', 'fill':'white' }
        ]
    );

    //Init 'remove block' svg button icons
    addSvgElems(
        [ '.btn-remove-row' ],
        [
          { 'tagName':'circle', cx: 15, cy: 15, r: 15, 'fill': 'red'},
          { 'tagName':'polygon','points':'6,12 24,12 24,18 6,18 6,12', 'fill':'white' }
        ]
    );

    //Init item reorder up button icons
    addSvgElems(
        [ '.btn-reorder-item-up' ],
        [
          { 'tagName':'circle', cx: 15, cy: 15, r: 15, 'fill': 'black'},
          { 'tagName':'polygon','points':'15,7 23,20 7,20', 'fill':'white' }
        ]
    );

    //Init item reorder down button icons
    addSvgElems(
        [ '.btn-reorder-item-down' ],
        [
          { 'tagName':'circle', cx: 15, cy: 15, r: 15, 'fill': 'black'},
          { 'tagName':'polygon','points':'15,23 23,10 7,10', 'fill':'white' }
        ]
    );

}

function addInputBlock(context){
        //Buttons to add groups of inputs.
        //Set up events for various inputs in the new block if present.
        var $group = $(context).closest('.input-group');
        var $newBlock = $group.find('.input-block:last').clone();

        $newBlock.find('input').val('');
        $newBlock.find('.btn-add-row:first').remove();
        $newBlock.find('input.decimal').keydown( keydownDecimalInput );
        $newBlock.find('input.decimal').blur( blurDecimal );
        $newBlock.find('.dropdown').removeClass('open');
        $newBlock.find('.positive-negative-cell').click( switchSign );
        $newBlock.find('.default-value-cell').removeClass('default-value-cell');
        $newBlock.find('input[type="number"]').each(function(index, elem){
            var $elem = $(elem);
            $elem.val($elem.attr('data-default-value'));
        });
        $newBlock.removeClass('hidden');
        $newBlock.insertAfter($group.find('.input-block:last'));
        $btnRemove = $newBlock.find('.btn-remove-row:first');
        $btnRemove.css('display','block');
        $btnRemove.click(function(event){ 
          $(event.target).closest('.input-block').remove(); 
        });
        $group.find('input.decimal').blur();
        initDropdowns($newBlock);
        initInputCursorPos($newBlock);
}

function initAddInputBlockButtons(){

    $('#btn-add-spec-item,.btn-add-row').off('click');
    $('#btn-add-spec-item,.btn-add-row').click( function(){
        addInputBlock(this);
    });
}

function isObjectEmpty(object)
{
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

function doXhr(params) {

  var $loading = $('#loadingDivOuter');
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
                  params.successFunc(data, status, xhr);
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

$(document).ready(function() {

    initOwlCarousel();
    initSpecificationPage();
    initRoomDefaultsPage();
    initProjectsPage();

    $('body').bind('touchstart click', blurInputFocus );
    addSvgButtons();

    initInputCursorPos();
    initIntegerInputs();
    initDecimalInputs();
    initAddInputBlockButtons();

    $('#btn-pos-neg').hide();
});