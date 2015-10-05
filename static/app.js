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
        //Order rooms by date_created
        rooms.sort(function(a, b){
            var c = new Date(a.dateCreated);
            var d = new Date(b.dateCreated);
            return c - d;
        });
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
            if(PAINTS[i].project == project_key){
                paints.push(PAINTS[i]);
            }
        }
        return paints;
    },
    getPaintsByType: function(surfaceType, projectKey){
    	var paints = []
        var projectPaints = this.getPaintsByProject(projectKey);
        for(var i = 0; i <= projectPaints.length - 1; i++){
            if(projectPaints[i].surfaceType.toLowerCase() == surfaceType.toLowerCase()){
                paints.push(projectPaints[i]);
            }
        }
        paints.sort(function(a, b){
            return a.order - b.order;
        });
        return paints;
    },

};

//Add the projects to the list
function populateProjects(projects){

    $('#projects-list').find('li:not(.hidden)').remove();

    if(projects.length <= 0){
        $('#projects-list').append('<li><p>No projects</p></li>')
    }

    for(var i=0; i<projects.length; i++){
        var $newBlock = $('.project-item:first').clone();
        $newBlock.find('.project-key').val( projects[i].key );
        $newBlock.find('.project-title').val( projects[i].title );
        $newBlock.find('.project-date-created').text(
            projects[i].dateCreated.split('.')[0].replace('T',' ')
        );
        $newBlock.removeClass('hidden');

        //Animate show/hide controls
        $newBlock.click(
            function(){
                $(this).find('.project-controls').slideToggle();
            }
        );
        //Setup click events for the controls.
        $newBlock.find('.btn-select-project').click(
            function(event){
                selectProject(
                    $(this).closest('.project-item').find('.project-key').val()
                );
            }
        );
        $newBlock.find('.btn-edit-project').click(
            function(event){
                event.stopPropagation();
            }
        );
        $newBlock.find('.btn-delete-project').click(
            function(event){
                showDialog(
                    'Delete Project',
                    'Are you sure?',
                    deleteProject,
                    $(this).closest('.project-item').find('.project-key').val()
                );
            }
        );
        $newBlock.appendTo('#projects-list');
    }
}

function addProjectPages(){

    CARO.removeSlideContaining('.project-summary-page:not(.hidden)');
    CARO.removeSlideContaining('.room-page:not(.hidden)');
    CARO.addSlide($('.project-summary-template').html());

    //Add the room pages for this project
    if(CURRENT_PROJECT.rooms.length >= 1){
        var rooms = MODEL.getRoomsForProject(CURRENT_PROJECT.key);
        for(var i = 0; i <= rooms.length - 1; i++){
            CARO.addSlide($('.room-page-template').html());
            initRoomPage(rooms[i]);
        }
    }else{
        //just add the default blank room.
        CARO.addSlide($('.room-page-template').html());
        initRoomPage();
    }

    initProjectSummaryPage();

    //Stop the carousel from moving when user clicks input
    $('input').mousedown(function(event){
        event.stopPropagation();
    });
}

function selectProject(projectKey, reload){

    if(CURRENT_PROJECT.key == projectKey && reload != true){
        CARO.nextSlide();
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
    addProjectPages();
    CARO.nextSlide();
}

function createProject(){
    if($('#new-project-title').val().match(/\S/g)){
        doXhr({
            httpMethod: 'POST',
            url: '/createproject',
            data: { projectTitle: $('#new-project-title').val() },
            dataType: 'json',
            successFunc: function(data){
                PROJECTS = data.projects;
                PAINTS = data.paints;
                populateProjects(PROJECTS);
                $('#new-project-title').val('');
            }
        });
    }else{
        alert('Project title can not be blank!');
    }
}

function deleteProject(projectKey){
    doXhr({
        httpMethod: 'POST',
        url: '/deleteproject',
        data: { project_key: projectKey },
        dataType: 'json',
        successFunc: function(data){
            PROJECTS = data.projects;
            ROOMS = data.rooms;
            CARO.removeSlideContaining('.project-summary-page:not(.hidden)');
            CARO.removeSlideContaining('.room-page:not(.hidden)');
            populateProjects(PROJECTS);
        }
    });
}

function getRoomData($page){

    var getf = function(inputElem, ancestor){
        var $parent = (ancestor != null) ? $(ancestor) : $page;
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

    var room = {
        roomLength:             0,
        roomWidth:              0,
        roomHeight:             0,
        roomHoursAdjust:        0,
        ceilingAdjustSimple:    0,
        wallAdjustSimple:       0,
        skirtingAdjustSimple:   0,
        groupItems: {
            bayBreastVals:      [],
            ceilingAdjustVals:  [],
            wallAdjustVals:     [],
            doorVals:           [],
            skirtingVals:       [],
            windowVals:         [],
            radiatorVals:       [],
            genSurfaceVals:     [],
            isolSurfaceVals:    []
        }
    };

    room.roomLength             = getf('.room-length');
    room.roomWidth              = getf('.room-width');
    room.roomHeight             = getf('.room-height');
    room.roomHoursAdjust        = getf('.room-hours-adjust');
    room.ceilingAdjustSimple    = getf('.ceiling-adjust-simple');
    room.wallAdjustSimple       = getf('.wall-adjust-simple');
    room.skirtingAdjustSimple   = getf('.skirting-adjust-simple');

    $page.find('.baybreast-group .input-block').each( function(index, elem){
        if(notZero(elem)){
            room.groupItems.bayBreastVals.push([
                getf('.baybreast-depth', elem),
                getf('.baybreast-width', elem)
            ]);
        }
    });

    $page.find('.ceiling-adjust-group .input-block').each( function(index, elem){
        if($(elem).find('.ceiling-adjust-paint-key').val().length >= 1
            && notZero(elem)){
            room.groupItems.ceilingAdjustVals.push([
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
            room.groupItems.wallAdjustVals.push([
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
            room.groupItems.doorVals.push([
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
            room.groupItems.skirtingVals.push([
                $(elem).find('.skirting-adjust-paint-key').val(),
                getf('.skirting-adjust-qty', elem),
                getf('.skirting-adjust-length', elem)
            ]);
        }
    });

    $page.find('.windows-group .input-block').each( function(index, elem){
        if($(elem).find('.window-paint-key').val().length >= 1
            && notZero(elem)){
            room.groupItems.windowVals.push([
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
            room.groupItems.radiatorVals.push([
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
            room.groupItems.genSurfaceVals.push([
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
            room.groupItems.isolSurfaceVals.push([
                $(elem).find('.isolated-surface-paint-key').val(),
                getf('.isolated-surface-qty', elem),
                getf('.isolated-surface-length', elem),
            ]);
        }
    });

    return room;
}

function calculateWorkForRoom(room){

    var baybreastWall       = 0, baybreastCeiling   = 0, baybreastSkirting      = 0;
    var ceilingSpace        = 0, ceilingHours       = 0, ceilingUnitValue       = 0;
    var ceilingAdjustSpace  = 0, ceilingAdjustHours = 0, ceilingAdjustUnitValue = 0;
    var wallSpace           = 0, wallHours          = 0, wallUnitValue          = 0;
    var wallAdjustSpace     = 0, wallAdjustHours    = 0, wallAdjustUnitValue    = 0;
    var doorsTotalWidth     = 0;
    var doorSurface         = 0, doorSurfHours      = 0, doorSurfUnitValue      = 0;
    var doorFrame           = 0, doorFrameHours     = 0, doorFrameUnitValue     = 0;
    var skirtingSpace       = 0, skirtingHours      = 0, skirtingUnitValue      = 0;
    var skirtingAdjustSpace = 0, skirtingAdjustHours = 0, skirtingAdjustUnitValue = 0;
    var windowSpace         = 0, windowHours        = 0, windowUnitValue        = 0;
    var radiatorSpace       = 0, radiatorHours      = 0, radiatorUnitValue      = 0;
    var genSurfSpace        = 0, genSurfHours       = 0, genSurfUnitValue       = 0;
    var isolSurfSpace       = 0, isolSurfHours      = 0, isolSurfUnitValue      = 0;

    /* BAYBREAST SPACE */
    for(var i = 0; i <= room.groupItems.bayBreastVals.length - 1; i++){
        var bbDepth = room.groupItems.bayBreastVals[i][0];
        var bbWidth = room.groupItems.bayBreastVals[i][1];
        if(Math.abs(bbDepth * bbWidth) > 0){
            baybreastWall += (2 * bbDepth * room.roomHeight);
            baybreastCeiling += (bbWidth * bbDepth);
            baybreastSkirting += (2 * bbDepth);
        }
    }

    /* CEILING ADJUST SPACE */
    for(var i = 0; i <= room.groupItems.ceilingAdjustVals.length - 1; i++){
        var paint = MODEL.getPaint(room.groupItems.ceilingAdjustVals[i][0]);
        var quantity = room.groupItems.ceilingAdjustVals[i][1];
        var dim1 = room.groupItems.ceilingAdjustVals[i][0];
        var dim2 = room.groupItems.ceilingAdjustVals[i][1];
        var space = quantity * dim1 * dim2;
        if(Math.abs(space) > 0) {
            ceilingAdjustSpace += space;
            if(paint.prodRateOne > 0){
                ceilingAdjustHours += (space / paint.prodRateOne);
            }
            if(paint.prodRateTwo > 0){
                ceilingAdjustHours += (space / paint.prodRateTwo);
            }
            if(paint.unitRate > 0){
                ceilingAdjustUnitValue += (space * paint.unitRate);
            }
        }
    }

    /* WALL ADJUST SPACE */
    for(var i = 0; i <= room.groupItems.wallAdjustVals.length - 1; i++){
        var paint = MODEL.getPaint(room.groupItems.wallAdjustVals[i][0]);
        var quantity = room.groupItems.wallAdjustVals[i][1];
        var dim1 = room.groupItems.wallAdjustVals[i][2];
        var dim2 = room.groupItems.wallAdjustVals[i][3];
        var space = quantity * dim1 * dim2;
        if(Math.abs(space) > 0) {
            wallAdjustSpace += space;
            if(paint.prodRateOne > 0){
                wallAdjustHours += (space / paint.prodRateOne);
            }
            if(paint.prodRateTwo > 0){
                wallAdjustHours += (space / paint.prodRateTwo);
            }
            if(paint.unitRate > 0){
                wallAdjustUnitValue += (space * paint.unitRate);
            }
        }
    }

    /* DOOR & FRAME SPACE*/
    for(var i = 0; i <= room.groupItems.doorVals.length - 1; i++){
        var surfacePaint = MODEL.getPaint(room.groupItems.doorVals[i][0]);
        var quantity = room.groupItems.doorVals[i][1];
        var dim1 = room.groupItems.doorVals[i][2];
        var dim2 = room.groupItems.doorVals[i][3];
        if(Math.abs(quantity * dim1 * dim2) > 0) {
            doorsTotalWidth += dim1;
            var surface = quantity * dim1 * dim2;
            doorSurface += surface;
            if(surfacePaint.prodRateOne > 0){
                doorSurfHours += (surface / surfacePaint.prodRateOne);
            }
            if(surfacePaint.prodRateTwo > 0){
                doorSurfHours += (surface / surfacePaint.prodRateTwo);
            }
            if(surfacePaint.unitRate > 0){
                doorSurfUnitValue += (surface * surfacePaint.unitRate);
            }
            var framePaint = MODEL.getPaint(room.groupItems.doorVals[i][4]);
            var frameLength = 2 * dim2 + dim1;
            doorFrame += frameLength;
            if(framePaint.prodRateOne > 0){
                doorFrameHours += (frameLength / framePaint.prodRateOne);
            }
            if(framePaint.prodRateTwo > 0){
                doorFrameHours += (frameLength / framePaint.prodRateTwo);
            }
            if(framePaint.unitRate > 0){
                doorFrameUnitValue += (frameLength * framePaint.unitRate);
            }
        }
    }

    /* SKIRTING SPACE */
    for(var i = 0; i <= room.groupItems.skirtingVals.length - 1; i++){
        var skirtingPaint = MODEL.getPaint(room.groupItems.skirtingVals[i][0]);
        var quantity = room.groupItems.skirtingVals[i][1];
        var dim1 = room.groupItems.skirtingVals[i][2];
        if(Math.abs(quantity * dim1) > 0) {
            var space = quantity * dim1;
            skirtingAdjustSpace += space;
            if(skirtingPaint.prodRateOne > 0){
                skirtingAdjustHours += (space / skirtingPaint.prodRateOne);
            }
            if(skirtingPaint.prodRateTwo > 0){
                skirtingAdjustHours += (space / skirtingPaint.prodRateTwo);
            }
            if(skirtingPaint.unitRate > 0){
                skirtingAdjustUnitValue += (space * skirtingPaint.unitRate);
            }
        }
    }

    /* WINDOW SPACE */
    for(var i = 0; i <= room.groupItems.windowVals.length - 1; i++){
        var windowPaint = MODEL.getPaint(room.groupItems.windowVals[i][0]);
        var quantity = room.groupItems.windowVals[i][1];
        var dim1 = room.groupItems.windowVals[i][2];
        var dim2 = room.groupItems.windowVals[i][3];
        if(Math.abs(quantity * dim1 * dim2) > 0) {
            var space = quantity * dim1 * dim2;
            windowSpace += space;
            if(windowPaint.prodRateOne > 0){
                windowHours += (space / windowPaint.prodRateOne);
            }
            if(windowPaint.prodRateTwo > 0){
                windowHours += (space / windowPaint.prodRateTwo);
            }
            if(windowPaint.unitRate > 0){
                windowUnitValue += (space * windowPaint.unitRate);
            }
        }
    }

    /* RADIATOR SPACE */
    for(var i = 0; i <= room.groupItems.radiatorVals.length - 1; i++){
        var radiatorPaint = MODEL.getPaint(room.groupItems.radiatorVals[i][0]);
        var quantity = room.groupItems.radiatorVals[i][1];
        var dim1 = room.groupItems.radiatorVals[i][2];
        var dim2 = room.groupItems.radiatorVals[i][3];
        if(Math.abs(quantity * dim1 * dim2) > 0) {
            var space = quantity * dim1 * dim2;
            radiatorSpace += space;
            if(radiatorPaint.prodRateOne > 0){
                radiatorHours += (space / radiatorPaint.prodRateOne);
            }
            if(radiatorPaint.prodRateTwo > 0){
                radiatorHours += (space / radiatorPaint.prodRateTwo);
            }
            if(radiatorPaint.unitRate > 0){
                radiatorUnitValue += (space * radiatorPaint.unitRate);
            }
        }
    }

    /* GENERAL SURFACE SPACE */
    for(var i = 0; i <= room.groupItems.genSurfaceVals.length - 1; i++){
        var genSurfPaint = MODEL.getPaint(room.groupItems.genSurfaceVals[i][0]);
        var quantity = room.groupItems.genSurfaceVals[i][1];
        var dim1 = room.groupItems.genSurfaceVals[i][2];
        var dim2 = room.groupItems.genSurfaceVals[i][3];
        if(Math.abs(quantity * dim1 * dim2) > 0) {
            var space = quantity * dim1 * dim2;
            genSurfSpace += space;
            if(genSurfPaint.prodRateOne > 0){
                genSurfHours += (space / genSurfPaint.prodRateOne);
            }
            if(genSurfPaint.prodRateTwo > 0){
                genSurfHours += (space / genSurfPaint.prodRateTwo);
            }
            if(genSurfPaint.unitRate > 0){
                genSurfUnitValue += (space * genSurfPaint.unitRate);
            }
        }
    }

    /* ISOLATED SURFACE SPACE */
    for(var i = 0; i <= room.groupItems.isolSurfaceVals.length - 1; i++){
        var isolSurfPaint = MODEL.getPaint(room.groupItems.isolSurfaceVals[i][0]);
        var quantity = room.groupItems.isolSurfaceVals[i][1];
        var dim1 = room.groupItems.isolSurfaceVals[i][2];
        if(Math.abs(quantity * dim1) > 0) {
            var space = quantity * dim1;
            isolSurfSpace += space;
            if(isolSurfPaint.prodRateOne > 0){
                isolSurfHours += (space / isolSurfPaint.prodRateOne);
            }
            if(isolSurfPaint.prodRateTwo > 0){
                isolSurfHours += (space / isolSurfPaint.prodRateTwo);
            }
            if(isolSurfPaint.unitRate > 0){
                isolSurfUnitValue += (space * isolSurfPaint.unitRate);
            }
        }
    }

    var getDefaultPaint = function(surface_type){
        var key = $('#select-' + surface_type + '-spec').val();
        var paint = MODEL.getPaint(key);
        return paint;
    };

    /* If there are negative adjustments we need to reduce the space for
    the ceiling, wall and skirting before calculating the hours for the main
    ceiling, wall and skirting areas */
    ceilingSpace    = (room.roomLength * room.roomWidth) + baybreastCeiling;
    if(ceilingAdjustSpace < 0) ceilingSpace += ceilingAdjustSpace;

    wallSpace       = (room.roomLength + room.roomWidth) * 2 * room.roomHeight - doorSurface - windowSpace + baybreastWall;
    if(wallAdjustSpace < 0) wallSpace += wallAdjustSpace;

    skirtingSpace   = (room.roomLength + room.roomWidth) * 2 - doorsTotalWidth + baybreastSkirting;
    if(skirtingAdjustSpace < 0) skirtingSpace += skirtingAdjustSpace;

    var addRateHours = function(paint, space, hours){
        if(paint.prodRateOne > 0){
            hours += space / paint.prodRateOne;
        }
        if(paint.prodRateTwo > 0){
            hours += space / paint.prodRateTwo;
        }
        return hours;
    }

    var ceilingPaint = getDefaultPaint('ceilings');
    ceilingHours += addRateHours(ceilingPaint, ceilingSpace, ceilingHours);
    ceilingHours += room.ceilingAdjustSimple;
    ceilingHours += ceilingAdjustHours;
    if(ceilingPaint.unitRate){
        ceilingUnitValue += ceilingSpace * ceilingPaint.unitRate;
    }

    var wallPaint = getDefaultPaint('walls');
    wallHours += addRateHours(wallPaint, wallSpace, wallHours);
    wallHours += room.wallAdjustSimple;
    wallHours += wallAdjustHours;
    if(wallPaint.unitRate > 0){
        wallUnitValue += wallSpace * wallPaint.unitRate;
    }

    var skirtingPaint = getDefaultPaint('isolated-surfaces');
    skirtingHours += addRateHours(skirtingPaint, skirtingSpace, skirtingHours);
    skirtingHours += room.skirtingAdjustSimple;
    skirtingHours += skirtingAdjustHours;
    if(skirtingPaint.unitRate > 0){
        skirtingUnitValue += skirtingSpace * skirtingPaint.unitRate;
    }

    /* If there are positive adjustments, we add to ceiling, wall and skirting
    after the main parts have been calculated above because the positive
    adjustments have their own production and unit rates. */
    if(ceilingAdjustSpace > 0) ceilingSpace += ceilingAdjustSpace;
    ceilingUnitValue += ceilingAdjustUnitValue;

    if(wallAdjustSpace > 0) wallSpace += wallAdjustSpace;
    wallUnitValue += wallAdjustUnitValue;

    if(skirtingAdjustSpace > 0) skirtingSpace += skirtingAdjustSpace;
    skirtingUnitValue += skirtingAdjustUnitValue;

    var tableData = [
        { title: 'CEILING',     amount: ceilingSpace,    units: 'm2', hours: ceilingHours,          rateValue: ceilingUnitValue   },
        { title: 'WALL',        amount: wallSpace,       units: 'm2', hours: wallHours,             rateValue: wallUnitValue      },
        { title: 'DOOR AREA',   amount: doorSurface,     units: 'm2', hours: doorSurfHours,         rateValue: doorSurfUnitValue  },
        { title: 'DOOR FRAME',  amount: doorFrame,       units: 'm',  hours: doorFrameHours,        rateValue: doorFrameUnitValue },
        { title: 'WINDOW',      amount: windowSpace,     units: 'm2', hours: windowHours,           rateValue: windowUnitValue    },
        { title: 'RADIATOR',    amount: radiatorSpace,   units: 'm2', hours: radiatorHours,         rateValue: radiatorUnitValue  },
        { title: 'SKIRTING',    amount: skirtingSpace,   units: 'm2', hours: skirtingHours,         rateValue: skirtingUnitValue  },
        { title: 'GENERAL SURFACE',    amount: genSurfSpace,   units: 'm2', hours: genSurfHours,    rateValue: genSurfUnitValue   },
        { title: 'ISOLATED SURFACE',    amount: isolSurfSpace,   units: 'm', hours: isolSurfHours,  rateValue: isolSurfUnitValue  }
    ];

    return tableData;
}

function renderRoomCalculations(roomPage, tableData){
    var $resultsElem = $(roomPage).find('.results:first');
    $resultsElem.html(buildResultsTable(tableData));
    $resultsElem.fadeIn(500);
    $("html, body").animate(
        { scrollTop: 0 }, 300,
        function(){ CARO.resizeUi(true) }
    );
}

function buildResultsTable(tableData){
    var results = '<table class="room-calculations"><tr><th>Part</th><th>Amount</th><th></th><th>Hours</th><th>Value</th></tr>';
    var rowTemplate = '<tr><td>{0}</td><td class="tdRightAlign">{1}</td>';
    rowTemplate += '<td>{2}</td><td class="tdRightAlign">{3}</td><td class="tdRightAlign">{4}</td></tr>';
    var totalHours = 0;
    var totalValue = 0;

    for (i = 0; i < tableData.length; ++i) {
        obj = tableData[i];

        results += rowTemplate.format(
            obj.title,
            roundAndFix(obj.amount, 2),
            obj.units,
            roundAndFix(obj.hours, 2),
            roundAndFix(obj.rateValue, 2)
        );
        totalHours += parseFloat(obj.hours);
        totalValue += parseFloat(obj.rateValue);
    }

    results += '<tr class="rowTotalHours"><td>TOTAL:</td><td></td><td></td>';
    results += '<td class="tdRightAlign">' + totalHours.toFixed(2) + '</td>';
    results += '<td class="tdRightAlign">' + totalValue.toFixed(2) + '</td></tr></table>';

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
      && $elem.hasClass('btn-pos-neg') == false){
        $('.btn-pos-neg:not(.template)').hide();
    }
}

function roomDefaultsChange(){
    //Update the corresponding input on the room 1 screen.
    var $elem = $(this);
    $('.' + $elem.attr('id').replace('default-','')).val($elem.val());
}

function switchSign(inpElem){
    var $inpElem = $(inpElem);
    $inpElem.val(-1 * $inpElem.val());
    $inpElem.focus();
}

function initCarousel(){

    CARO = new Caro('#carousel');
    CARO.init('#caro-pages',
        ['.room-page-template','.project-summary-template']
    );

    var $btnAdd = $('.btn-add-room.template').clone();
    $btnAdd = $btnAdd.removeClass('template');
    $btnAdd.hide();
    $btnAdd.click(function(){
        CARO.addSlide($('.room-page-template').html());
        initRoomPage();
        CARO.nextSlide();
    });
    $('.caro-nav-next').after($btnAdd);

    var toggleNavButton = function(){
        var $navButton = $('.caro-nav-next:not(.template)');
        var $addButton = $('.btn-add-room:not(.template)');
        if(CARO.isLastSlide()
            && CARO.getCurrentSlide().find('.room-page').length >= 1){
            //Hide the 'next slide' button and show 'add room' button
            $navButton.hide();
            $addButton.show();
        }else{
            //Hide the 'add room' button and show 'next slide' button
            $addButton.hide();
            $navButton.show();
        }
    }

    CARO.registerCallback(['animateStage'], toggleNavButton);
}

function resizeCarousel(){
    if(CARO != null){
        CARO.resizeUi(true);
    }
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
    var dropdownText = $elem.find('.dropdown-text').text().toLowerCase().trim();

    if (dropdownText == 'dropdown'
    	|| dropdownText == 'select...'
        || dropdownText == 'menu item'
    	|| dropdownText == ''){
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

    var surfaceType = $clickedButton.closest('.spec-item-block')
                          .find('.spec-item-title').text();

    $('#spec-surface-type').val(surfaceType);

    var paints = MODEL.getPaintsByType(surfaceType, null);
    //For each paint of this surface type, build the edit inputs.
    $.each(paints, function(i, paint) {
        if (paint.surfaceType.toLowerCase() == surfaceType.toLowerCase()) {
            var $newBlock = $('#form-edit-spec .input-block:first').clone();
            $newBlock.find('input.spec-item-key'    ) .val( paint.key             );
            $newBlock.find('input.spec-item-order'  ) .val( paint.order           );
            $newBlock.find('input.spec-item-name'   ) .val( paint.name            );
            $newBlock.find('input.spec-item-pr1'    ) .val( paint.prodRateOne   );
            $newBlock.find('input.spec-item-pr2'    ) .val( paint.prodRateTwo   );
            $newBlock.find('input.spec-item-rate'   ) .val( paint.unitRate       );
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
        var paints = MODEL.getPaintsByType(SURFACE_TYPES[i], null);
        $.each(paints, function(j, paint) {
            $newBlock.find('.dropdown-value').attr('id',
                'select-' + paint.surfaceType.toLowerCase().replace(' ', '-') + '-spec');
            $newBlock.find('ul.dropdown-menu').append(
                '<li><a role="menuitem" data-value="'
                + paint.key + '" >' + paint.name + '</a></li>'
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
            prodRateOne:  $elemBlock.find('.spec-item-pr1').val(),
            prodRateTwo:  $elemBlock.find('.spec-item-pr2').val(),
            unitRate:     $elemBlock.find('.spec-item-rate').val(),
            surfaceType:  $('#spec-surface-type').val()
        });
    });

    doXhr({
        httpMethod: 'POST',
        url: '/savespec',
        data: {
          surfaceType: $('#spec-surface-type').val(),
          paints: JSON.stringify( arrSpecItemData )
        },
        dataType: 'json',
        successFunc: function(data){
            PAINTS = data;
            fadeToViewSpec();
        }
    });

}

function deleteRoom(roomKey){

    doXhr({
        httpMethod: 'POST',
        url: '/deleteroom',
        data: { room_key: roomKey },
        successFunc:
            function(data){
                MODEL.deleteRoom(roomKey);
                CURRENT_PROJECT = data;
                selectProject(CURRENT_PROJECT.key, true);
            }
    });

}

function saveRoom(room, keyElem){

    doXhr({
        httpMethod: 'POST',
        url: '/saveroom',
        data: { room: JSON.stringify( room ) },
        dataType: 'json',
        successFunc:  function(data, status){
            if(status == 'success'){
                alert('Room saved.');
                MODEL.updateRoom(data);
                if(keyElem != null) $(keyElem).val(data.key);
                initProjectSummaryPage();
            } else {
                alert('Error saving room.');
            }
            $('html, body').animate({ scrollTop: 0 }, 'slow');
        }
    });
}

function saveDefaultRoom(room){

    doXhr({
        httpMethod: 'POST',
        url: '/savedefaultroom',
        data: { room: JSON.stringify( room ) },
        dataType: 'json',
        successFunc:  function(data, status){
            if(status == 'success'){
                alert('Settings saved.');
            } else {
                alert('Error saving room.');
            }
            $('html, body').animate({ scrollTop: 0 }, 'slow');
        }
    });
}

function initRoomDefaultsPage(){

    var defRoom = DEFAULT_ROOM;

    $('#default-room-key'         ).val( defRoom.key            );
    $('#default-room-height'      ).val( defRoom.roomHeight     );
    $('#default-door-width'       ).val( defRoom.doorWidth      );
    $('#default-door-height'      ).val( defRoom.doorHeight     );
    $('#default-window-width'     ).val( defRoom.windowWidth    );
    $('#default-window-height'    ).val( defRoom.windowHeight   );
    $('#default-radiator-width'   ).val( defRoom.radiatorWidth  );
    $('#default-radiator-height'  ).val( defRoom.radiatorHeight );

    $('#form-room-defaults input[type="number"]').change( roomDefaultsChange );

    $('#form-room-defaults .btn-save').click( function(){
        saveDefaultRoom({
            key:                   $('#default-room-key').val(),
            name:                  '',
            roomWidth:             0,
            roomLength:            0,
            roomHeight:            parseFloat($('#default-room-height').val()       ),
            doorWidth:             parseFloat($('#default-door-width').val()        ),
            doorHeight:            parseFloat($('#default-door-height').val()       ),
            windowWidth:           parseFloat($('#default-window-width').val()      ),
            windowHeight:          parseFloat($('#default-window-height').val()     ),
            radiatorWidth:         parseFloat($('#default-radiator-width').val()    ),
            radiatorHeight:        parseFloat($('#default-radiator-height').val()   )
        });
    });
}

function initProjectsPage(){
    populateProjects(PROJECTS);
    $('#btn-create-project').click( createProject );
}

function initProjectSummaryPage(){

    //Calculate work for each room and aggregate data.
    var $summaryPage = $('.caro-item .project-summary-page');
    var $box = $summaryPage.find('.project-summary-info');
    var projectTotalRooms = 0;
    var projectTotalHours = 0;
    var projectTotalValue = 0;

    $box.find('.project-total-rooms').html('');
    $box.find('.project-total-hours').html('');
    $box.find('.project-room-tables').html('');
    $box.find('.project-room-list').html('');

    var getTotalHours = function(tableData){
        var totalHours = 0;
        for (var i = 0; i < tableData.length; i++) {
            totalHours += parseFloat(tableData[i].hours);
        }
        return totalHours;
    };

    var getTotalValue = function(tableData){
        var totalValue = 0;
        for (var i = 0; i < tableData.length; i++) {
            totalValue += parseFloat(tableData[i].rateValue);
        }
        return totalValue;
    };

    if(CURRENT_PROJECT.rooms.length >= 1){

        var rooms = MODEL.getRoomsForProject(CURRENT_PROJECT.key);

        for(var i = 0; i < rooms.length; i++){
            var tableData = calculateWorkForRoom(rooms[i]);
            var table = buildResultsTable(tableData);
            projectTotalRooms++;
            projectTotalHours += getTotalHours(tableData);
            projectTotalValue += getTotalValue(tableData);

            $roomItem = $('<div class="room-summary-item"></div>');
            $roomItem.append('<p>Room name: ' + rooms[i].name + '</p>');
            $roomItem.append(table);
            $box.find('.project-room-list').append($roomItem);
        }
    }

    $box.find('.project-total-rooms').html(projectTotalRooms);
    $box.find('.project-total-hours').html(projectTotalHours.toFixed(2));
    $box.find('.project-total-value').html(projectTotalValue.toFixed(2));
}

function initRoomPage(room){

    var getf = function(elemId){
        return parseFloat($(elemId).val()).toFixed(2);
    }

    var $page = $('.caro-item .room-page:last:not(.hidden)');

    //Use the default room settings if room object not passed in.
    if(room == null){
        room = {
            'name'                  : '',
            'roomLength'           : 0,
            'roomWidth'            : 0,
            'roomHeight'           : getf('#default-room-height'),
            'ceilingAdjustSimple' : 0,
            'wallAdjustSimple'    : 0,
            'skirtingAdjustSimple': 0,
            'doorWidth'            : getf('#default-door-width'),
            'doorHeight'           : getf('#default-door-height'),
            'windowWidth'          : getf('#default-window-width'),
            'windowHeight'         : getf('#default-window-height'),
            'radiatorWidth'        : getf('#default-radiator-width'),
            'radiatorHeight'       : getf('#default-radiator-height'),
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
    $page.find('.door-width:first')       .val( room.doorWidth      );
    $page.find('.door-height:first')      .val( room.doorHeight     );
    $page.find('.window-width:first')     .val( room.windowWidth    );
    $page.find('.window-height:first')    .val( room.windowHeight   );
    $page.find('.radiator-width:first')   .val( room.radiatorWidth  );
    $page.find('.radiator-height:first')  .val( room.radiatorHeight );

    $page.find('.room-key')               .val( room.key                );
    $page.find('.room-title')             .val( room.name               );
    $page.find('.room-hours-adjust')      .val( room.roomHoursAdjust    );
    $page.find('.room-height')            .val( room.roomHeight         );
    $page.find('.room-width')             .val( room.roomWidth          );
    $page.find('.room-length')            .val( room.roomLength         );
    $page.find('.ceiling-adjust-simple')  .val( room.ceilingAdjustSimple    );
    $page.find('.wall-adjust-simple')     .val( room.wallAdjustSimple       );
    $page.find('.skirting-adjust-simple') .val( room.skirtingAdjustSimple   );

    //Build input blocks and set the values for each group item.
    if(room.groupItems != null){

        for(var i = 0; i <= room.groupItems.bayBreastVals.length - 1; i++){

            if(i >= 1) addInputBlock( $page.find('.baybreast-group .btn-add-row:last') );
            var $block = $page.find('.baybreast-group .input-block:last');
            $block.find('.baybreast-depth').val( room.groupItems.bayBreastVals[i][0] );
            $block.find('.baybreast-width').val( room.groupItems.bayBreastVals[i][1] );
        }

        for(var i = 0; i <= room.groupItems.ceilingAdjustVals.length - 1; i++){

            if(i >= 1) addInputBlock( $page.find('.ceiling-adjust-group .btn-add-row:last') );
            var $block = $page.find('.ceiling-adjust-group .input-block:last');
            var paint = MODEL.getPaint(room.groupItems.ceilingAdjustVals[i][0]);
            $block.find('.dropdown-value').val( paint.key );
            $block.find('.dropdown-text').text( paint.name );
            $block.find('.ceiling-adjust-qty').val( room.groupItems.ceilingAdjustVals[i][1] );
            $block.find('.ceiling-adjust-dim1').val( room.groupItems.ceilingAdjustVals[i][2] );
            $block.find('.ceiling-adjust-dim2').val( room.groupItems.ceilingAdjustVals[i][3] );
        }

        for(var i = 0; i <= room.groupItems.wallAdjustVals.length - 1; i++){

            if(i >= 1) addInputBlock( $page.find('.wall-adjust-group .btn-add-row:last') );
            var $block = $page.find('.wall-adjust-group .input-block:last');
            var paint = MODEL.getPaint(room.groupItems.wallAdjustVals[i][0]);
            $block.find('.dropdown-value').val( paint.key );
            $block.find('.dropdown-text').text( paint.name );
            $block.find('.wall-adjust-qty').val( room.groupItems.wallAdjustVals[i][1] );
            $block.find('.wall-adjust-dim1').val( room.groupItems.wallAdjustVals[i][2] );
            $block.find('.wall-adjust-dim2').val( room.groupItems.wallAdjustVals[i][3] );
        }

        for(var i = 0; i <= room.groupItems.doorVals.length - 1; i++){

            if(i >= 1) addInputBlock( $page.find('.doors-group .btn-add-row:last') );
            var $block = $page.find('.doors-group .input-block:last');
            var surfacePaint = MODEL.getPaint(room.groupItems.doorVals[i][0]);
            $block.find('.dropdown.door-surface .dropdown-value').val( surfacePaint.key );
            $block.find('.dropdown.door-surface .dropdown-text').text( surfacePaint.name );
            var framePaint = MODEL.getPaint(room.groupItems.doorVals[i][4]);
            $block.find('.dropdown.door-frame .dropdown-value').val( framePaint.key );
            $block.find('.dropdown.door-frame .dropdown-text').text( framePaint.name );
            $block.find('.door-qty').val( room.groupItems.doorVals[i][1] );
            $block.find('.door-width').val( room.groupItems.doorVals[i][2] );
            $block.find('.door-height').val( room.groupItems.doorVals[i][3] );
        }

        for(var i = 0; i <= room.groupItems.skirtingVals.length - 1; i++){

            if(i >= 1) addInputBlock( $page.find('.skirting-adjust-group .btn-add-row:last') );
            var $block = $page.find('.skirting-adjust-group .input-block:last');
            var paint = MODEL.getPaint(room.groupItems.skirtingVals[i][0]);
            $block.find('.dropdown-value').val( paint.key );
            $block.find('.dropdown-text').text( paint.name );
            $block.find('.skirting-adjust-qty').val( room.groupItems.skirtingVals[i][1] );
            $block.find('.skirting-adjust-length').val( room.groupItems.skirtingVals[i][2] );
        }

        for(var i = 0; i <= room.groupItems.windowVals.length - 1; i++){

            if(i >= 1) addInputBlock( $page.find('.windows-group .btn-add-row:last') );
            var $block = $page.find('.windows-group .input-block:last');
            var paint = MODEL.getPaint(room.groupItems.windowVals[i][0]);
            $block.find('.dropdown-value').val( paint.key );
            $block.find('.dropdown-text').text( paint.name );
            $block.find('.window-qty').val( room.groupItems.windowVals[i][1] );
            $block.find('.window-width').val( room.groupItems.windowVals[i][2] );
            $block.find('.window-height').val( room.groupItems.windowVals[i][3] );
        }

        for(var i = 0; i <= room.groupItems.radiatorVals.length - 1; i++){

            if(i >= 1) addInputBlock( $page.find('.radiators-group .btn-add-row:last') );
            var $block = $page.find('.radiators-group .input-block:last');
            var paint = MODEL.getPaint(room.groupItems.radiatorVals[i][0]);
            $block.find('.dropdown-value').val( paint.key );
            $block.find('.dropdown-text').text( paint.name );
            $block.find('.radiator-qty').val( room.groupItems.radiatorVals[i][1] );
            $block.find('.radiator-width').val( room.groupItems.radiatorVals[i][2] );
            $block.find('.radiator-height').val( room.groupItems.radiatorVals[i][3] );
        }

        for(var i = 0; i <= room.groupItems.genSurfaceVals.length - 1; i++){

            if(i >= 1) addInputBlock( $page.find('.general-surface-group .btn-add-row:last') );
            var $block = $page.find('.general-surface-group .input-block:last');
            var paint = MODEL.getPaint(room.groupItems.genSurfaceVals[i][0]);
            $block.find('.dropdown-value').val( paint.key );
            $block.find('.dropdown-text').text( paint.name );
            $block.find('.general-surface-qty').val( room.groupItems.genSurfaceVals[i][1] );
            $block.find('.general-surface-width').val( room.groupItems.genSurfaceVals[i][2] );
            $block.find('.general-surface-height').val( room.groupItems.genSurfaceVals[i][3] );
        }

        for(var i = 0; i <= room.groupItems.isolSurfaceVals.length - 1; i++){

            if(i >= 1) addInputBlock( $page.find('.isolated-surface-group .btn-add-row:last') );
            var $block = $page.find('.isolated-surface-group .input-block:last');
            var paint = MODEL.getPaint(room.groupItems.isolSurfaceVals[i][0]);
            $block.find('.dropdown-value').val( paint.key );
            $block.find('.dropdown-text').text( paint.name );
            $block.find('.isolated-surface-qty').val( room.groupItems.isolSurfaceVals[i][1] );
            $block.find('.isolated-surface-length').val( room.groupItems.isolSurfaceVals[i][2] );
        }
    }

    $page.find('.pos-neg').focus( onPosNegInputFocus );

    var fillDropdown = function(page, dropdownId, paintType){
        var $page = $(page);
        var $dropdown = $page.find(dropdownId);
        $dropdown.empty();
        var paints = MODEL.getPaintsByType(paintType, CURRENT_PROJECT.key);
        $.each(paints, function(j, paint) {
            $dropdown.append(
                '<li><a role="menuitem" data-value="' + paint.key + '" >'
                + paint.name + '</a></li>'
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

    var defaultItems = [
        'door-width',
        'door-height',
        'window-width',
        'window-height',
        'radiator-width',
        'radiator-height'
    ];

    /* Add/remove grey backgrounds when default values changed. */
    for(var i = 0; i <= defaultItems.length - 1; i++){
        $page.find('.' + defaultItems[i]).keyup(
            { defaultValId:'#default-' + defaultItems[i] },
            function(event){;
                var $cell = $(this).closest('td');
                if(parseFloat($(this).val()).toFixed(2) == getf(event.data.defaultValId)){
                    /* Indicate this is the default value by adding
                     the class for the grey background */
                     $cell.removeClass('default-value').addClass('default-value');
                }else{
                    /* The value is different from the default so
                    remove the grey background. */
                    $cell.removeClass('default-value')
                }
            }
        );
    }

    $page.find('.btn-calculate-room').click( function(event){
        var $roomPage = $(event.target).closest('.room-page');
        var room = getRoomData($roomPage);
        var tableData = calculateWorkForRoom(room);
        renderRoomCalculations($roomPage, tableData);
    });
    $page.find('.btn-delete-room').click( onDeleteRoomClick );
    $page.find('.btn-save-room').click( onSaveRoomClick );

    initIntegerInputs();
    initDecimalInputs();
    initDropdowns($page);
    initAddInputBlockButtons();
    initInputCursorPos($page);

    //Prevent carousel moving when clicking into inputs
    $('input').mousedown(function(event){
        event.stopPropagation();
    });
}

function onPosNegInputFocus(event, secondCall){
    /* Show/hide a hovering button above input to
    allow user to switch +/- sign */

    var $inp = $(this);
    var $btn = $('.btn-pos-neg:not(.template)');

    $btn.css('top',$inp.offset().top - $btn.outerHeight());
    $btn.css('left',$inp.offset().left);
    $btn.css('display','block');
    $btn.css('z-index','1000');
    $btn.off('click').on('click', function(event){
        switchSign($inp);
        event.stopPropagation();
    });

    return true;
}

function onDeleteRoomClick(){
    if(CURRENT_PROJECT.rooms.length >= 1){
        deleteRoom($(this).closest('.caro-item').find('.room-key').val());
    }else{
        alert('Room not saved yet.');
    }
}

function onSaveRoomClick(){

    var $page = $(this).closest('.caro-item');

    if(isObjectEmpty(CURRENT_PROJECT)){
        alert('Please select a project first.');
    }else{
        room            = getRoomData($page);
        room.key        = $page.find('.room-key').val();
        room.name       = $page.find('.room-title').val();
        room.project    = CURRENT_PROJECT.key;
        saveRoom(room, '.room-key');
    }

}

function updateProjectSummary(){
    /* TODO: re-calculate the project summary data
    based on the rooms that have been saved */
}

function initInputCursorPos(context){

    var $context = $('body');
    if(context != null) $context = $(context);
    /* Set the cursor position when input focussed */
    /* Does not work for number inputs in Google Chrome or Opera. */
    $('input[type="number"]').focus( function(event){
        if(this.setSelectionRange){
            var len = $(this).val().length * 2;
            /* If input value is zero, select whole thing to make it
            easy to overwrite, else set cursor to the end */
            var start = (parseFloat($(this).val()) == 0) ? 0 : len;
            this.setSelectionRange(start, len);
        }
    });
    $('input[type="text"]').focus( function(event){
        if(this.setSelectionRange){
            var len = $(this).val().length * 2;
            /* Set cursor to the end for easy backspace delete. */
            this.setSelectionRange(len, len);
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
        $newBlock.find('.default-value').removeClass('default-value');
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
            resizeCarousel();
        });
        $group.find('input.decimal').blur();
        initDropdowns($newBlock);
        initInputCursorPos($newBlock);
        resizeCarousel();
}

function initAddInputBlockButtons(){

    $('.btn-add-spec-item,.btn-add-row').off('click');
    $('.btn-add-spec-item,.btn-add-row').click( function(){
        addInputBlock(this);
    });
}

$(document).ready(function() {

    makeComponents([
        '.btn-add-row',
        '.btn-add-spec-item',
        '.btn-remove-row',
        '.btn-reorder-item-up',
        '.btn-reorder-item-down',
        '.loadingDivOuter',
        '.dialog-background',
        '.dialog',
        '.button-box',
        '.btn-pos-neg'
    ]);

    makeComponent(
        '.dropdown',
        function(){
            $elem = $(this);
            $elem.find('input.dropdown-value').addClass(
                $elem.data('dropdown-id')
            );
        }
    );

    initCarousel();
    initSpecificationPage();
    initRoomDefaultsPage();
    initProjectsPage();

    $('body').bind('touchstart click', blurInputFocus );

    initInputCursorPos();
    initIntegerInputs();
    initDecimalInputs();
    initAddInputBlockButtons();
    $('.btn-pos-neg:not(.template)').hide();
    initDialog();

    $('input').mousedown(function(event){
        event.stopPropagation();
    });

    window.scrollTo(0,0);
});
