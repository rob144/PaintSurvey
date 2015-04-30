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
    prod_rate       = ndb.FloatProperty()
    surface_type    = ndb.StringProperty()
    order           = ndb.IntegerProperty()
    project         = ndb.KeyProperty(kind='Project')

def set_project_paints(project, paints):
    for paint in paints:
        project.paints.append(
            Paint(
                name            = paint.name,
                prod_rate       = paint.prod_rate,
                surface_type    = paint.surface_type,
                order           = paint.order,
                project         = project.key
            ).put()
        )
    return project.put().get()

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