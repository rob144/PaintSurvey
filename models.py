#models.py module
#Contains ndb models and related functions.
from google.appengine.ext import ndb

class ModelUtils(object):
    def to_dict(self):
        result = super(ModelUtils,self).to_dict()
        result['key'] = self.key.urlsafe()
        return result

class Project(ModelUtils, ndb.Model):
    username        = ndb.StringProperty()
    title           = ndb.StringProperty()
    rooms           = ndb.KeyProperty(kind='Room', repeated=True)
    dateCreated     = ndb.DateTimeProperty(auto_now_add=True)
    paints          = ndb.KeyProperty(kind='Paint', repeated=True)

class DefaultRoom(ModelUtils, ndb.Model):
    name                    = ndb.StringProperty()
    roomLength              = ndb.FloatProperty()
    roomWidth               = ndb.FloatProperty()
    roomHeight              = ndb.FloatProperty()
    doorWidth               = ndb.FloatProperty()
    doorHeight              = ndb.FloatProperty()
    windowWidth             = ndb.FloatProperty()
    windowHeight            = ndb.FloatProperty()
    radiatorWidth           = ndb.FloatProperty()
    radiatorHeight          = ndb.FloatProperty()

class Room(ModelUtils, ndb.Model):
    name                    = ndb.StringProperty()
    dateCreated             = ndb.DateTimeProperty(auto_now_add=True)
    roomHoursAdjust         = ndb.FloatProperty()
    roomLength              = ndb.FloatProperty()
    roomWidth               = ndb.FloatProperty()
    roomHeight              = ndb.FloatProperty()
    ceilingAdjustSimple     = ndb.FloatProperty()
    wallAdjustSimple        = ndb.FloatProperty()
    skirtingAdjustSimple    = ndb.FloatProperty()
    groupItems              = ndb.JsonProperty()
    project                 = ndb.KeyProperty(kind='Project')

class Paint(ModelUtils, ndb.Model):
    name            = ndb.StringProperty()
    prodRateOne     = ndb.FloatProperty()
    prodRateTwo     = ndb.FloatProperty()
    unitRate        = ndb.FloatProperty()
    surfaceType     = ndb.StringProperty()
    order           = ndb.IntegerProperty()
    project         = ndb.KeyProperty(kind='Project')

def createDefaultRoom():
    return DefaultRoom(
        roomLength     = 5.0,
        roomWidth      = 5.0,
        roomHeight     = 2.5,
        doorWidth      = 0.5,
        doorHeight     = 1.5,
        windowWidth    = 1.5,
        windowHeight   = 1.0,
        radiatorWidth  = 1.0,
        radiatorHeight = 0.5
    )

def deleteData():
    ndb.delete_multi(Project.query().fetch(keys_only=True))
    ndb.delete_multi(Room.query().fetch(keys_only=True))
    ndb.delete_multi(DefaultRoom.query().fetch(keys_only=True))
    ndb.delete_multi(Paint.query().fetch(keys_only=True))

def initData():
    #Create room defaults if not there already.
    if(DefaultRoom.query().count() < 1):
        createDefaultRoom().put()

    paint_data = [
        ['1 Vinyl Matt'     ,  20,  5, 10, 'Ceilings'         , 1],
        ['2 Vinyl Matt'     ,  10,  5, 10, 'Ceilings'         , 2],
        ['2 Eggshell'       ,   9,  5, 10, 'Ceilings'         , 3],
        ['Wallpaper'        , 4.5,  5, 10, 'Walls'            , 1],
        ['2 Vinyl Matt'     ,  10,  5, 10, 'Walls'            , 2],
        ['2 Eggshell'       ,   9,  5, 10, 'Walls'            , 3],
        ['General surface'  ,   4,  5, 10, 'Doors'            , 1],
        ['Glazed med pane'  , 3.5,  5, 10, 'Doors'            , 2],
        ['Glazed small pane', 2.5,  5, 10, 'Doors'            , 3],
        ['Large pane'       ,   5,  5, 10, 'Windows'          , 1],
        ['Med pane'         ,   4,  5, 10, 'Windows'          , 1],
        ['Small pane'       ,   3,  5, 10, 'Windows'          , 2],
        ['Panel'            ,   4,  5, 10, 'Radiators'        , 1],
        ['Column'           ,   3,  5, 10, 'Radiators'        , 2],
        ['100 Girth'        ,  15,  5, 10, 'Isolated Surfaces', 1],
        ['150 Girth'        ,  12,  5, 10, 'Isolated Surfaces', 2],
        ['300 Girth'        ,  10,  5, 10, 'Isolated Surfaces', 3]
    ]

    for p in paint_data:
        qry = Paint.query(
            Paint.name          == p[0],
            Paint.prodRateOne   == p[1],
            Paint.prodRateOne   == p[2],
            Paint.unitRate      == p[3],
            Paint.surfaceType   == p[4]
        )
        if(qry.count() <= 0):
            Paint(
                name        = p[0], 
                prodRateOne = p[1], 
                prodRateTwo = p[2],
                unitRate    = p[3],
                surfaceType = p[4], 
                order       = p[5]
            ).put()
