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
    date_created    = ndb.DateTimeProperty(auto_now_add=True)
    paints          = ndb.KeyProperty(kind='Paint', repeated=True)

class DefaultRoom(ModelUtils, ndb.Model):
    name                     = ndb.StringProperty()
    room_length              = ndb.FloatProperty()
    room_width               = ndb.FloatProperty()
    room_height              = ndb.FloatProperty()
    door_width               = ndb.FloatProperty()
    door_height              = ndb.FloatProperty()
    window_width             = ndb.FloatProperty()
    window_height            = ndb.FloatProperty()
    radiator_width           = ndb.FloatProperty()
    radiator_height          = ndb.FloatProperty()

class Room(ModelUtils, ndb.Model):
    name                    = ndb.StringProperty()
    room_hours_adjust       = ndb.FloatProperty()
    room_length             = ndb.FloatProperty()
    room_width              = ndb.FloatProperty()
    room_height             = ndb.FloatProperty()
    ceiling_adjust_simple   = ndb.FloatProperty()
    wall_adjust_simple      = ndb.FloatProperty()
    skirting_adjust_simple  = ndb.FloatProperty()
    group_items             = ndb.JsonProperty()
    project                 = ndb.KeyProperty(kind='Project')

class Paint(ModelUtils, ndb.Model):
    name            = ndb.StringProperty()
    prod_rate_one   = ndb.FloatProperty()
    prod_rate_two   = ndb.FloatProperty()
    unit_rate       = ndb.FloatProperty()
    surface_type    = ndb.StringProperty()
    order           = ndb.IntegerProperty()
    project         = ndb.KeyProperty(kind='Project')

def create_default_room():
    return DefaultRoom(
        room_length     = 5.0,
        room_width      = 5.0,
        room_height     = 2.5,
        door_width      = 0.5,
        door_height     = 1.5,
        window_width    = 1.5,
        window_height   = 1.0,
        radiator_width  = 1.0,
        radiator_height  = 0.5
    )

def init_data():
    #ndb.delete_multi(Project.query().fetch(keys_only=True))
    #ndb.delete_multi(Room.query().fetch(keys_only=True))
    #ndb.delete_multi(DefaultRoom.query().fetch(keys_only=True))
    #ndb.delete_multi(Paint.query().fetch(keys_only=True))

    #Create room defaults if not there already.
    if(DefaultRoom.query().count() < 1):
        create_default_room().put()

    paint_data = [
        ['1 Vinyl Matt', 20, 'Ceilings', 1],
        ['2 Vinyl Matt', 10, 'Ceilings', 2],
        ['2 Eggshell', 9, 'Ceilings', 3],
        ['Wallpaper', 4.5, 'Walls', 1],
        ['2 Vinyl Matt', 10, 'Walls', 2],
        ['2 Eggshell', 9, 'Walls', 3],
        ['General surface', 4, 'Doors', 1],
        ['Glazed med pane', 3.5, 'Doors', 2],
        ['Glazed small pane', 2.5, 'Doors', 3],
        ['Large pane', 5, 'Windows', 1],
        ['Med pane', 4, 'Windows', 1],
        ['Small pane', 3, 'Windows', 2],
        ['Panel', 4, 'Radiators', 1],
        ['Column', 3, 'Radiators', 2],
        ['100 Girth', 15, 'Isolated Surfaces', 1],
        ['150 Girth', 12, 'Isolated Surfaces', 2],
        ['300 Girth', 10, 'Isolated Surfaces', 3]
    ]

    for p in paint_data:
        qry = Paint.query(
            Paint.name == p[0],
            Paint.prod_rate_one == p[1],
            Paint.surface_type == p[2]
        )
        if(qry.count() <= 0):
            Paint(
                name=p[0], 
                prod_rate_one=p[1], 
                surface_type=p[2], 
                order=p[3]
            ).put()
