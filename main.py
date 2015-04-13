import os
import webapp2
import jinja2
from google.appengine.ext import ndb
from datetime import datetime
import time
import json

TEMPLATES_DIR = 'templates/'

loader = jinja2.FileSystemLoader(os.path.dirname(__file__))

JINJA_ENV = jinja2.Environment(
    loader = loader,
    extensions = ['jinja2.ext.autoescape'],
    autoescape = True)

def include_file(filename):
    return jinja2.Markup(loader.get_source(JINJA_ENV, TEMPLATES_DIR + filename)[0])

JINJA_ENV.globals['include_file'] = include_file

def json_serial(obj):
    #JSON serializer for objects not serializable by default json code
    if isinstance(obj, datetime):
        return obj.isoformat()
    if(type(obj) == ndb.key.Key):
        return obj.urlsafe()

def str2bool(s):
    return s.lower() in ("yes", "true", "t", "1")

class ModelUtils(object):
    def to_dict(self):
        result = super(ModelUtils,self).to_dict()
        result['key'] = self.key.urlsafe()
        return result

class Project(ModelUtils, ndb.Model):
    username = ndb.StringProperty()
    title = ndb.StringProperty()
    rooms = ndb.KeyProperty(kind='Room', repeated=True)
    date_created = ndb.DateTimeProperty(auto_now_add=True)

class Room(ModelUtils, ndb.Model):
    name = ndb.StringProperty()
    room_length = ndb.FloatProperty()
    room_width = ndb.FloatProperty()
    room_height = ndb.FloatProperty()
    door_quantity = ndb.IntegerProperty()
    door_width = ndb.FloatProperty()
    door_height = ndb.FloatProperty()
    window_quantity = ndb.IntegerProperty()
    window_width = ndb.FloatProperty()
    window_height = ndb.FloatProperty()
    radiator_quantity = ndb.IntegerProperty()
    radiator_width = ndb.FloatProperty()
    radiator_height = ndb.FloatProperty()
    ceiling_adjust_simple = ndb.FloatProperty()
    wall_adjust_simple = ndb.FloatProperty()
    group_items = ndb.JsonProperty()
    is_default = ndb.BooleanProperty()
    project = ndb.KeyProperty(kind='Project')

class Paint(ModelUtils, ndb.Model):
    name = ndb.StringProperty()
    prod_rate = ndb.FloatProperty()
    surface_type = ndb.StringProperty()
    order = ndb.IntegerProperty()

def create_default_room():
    return Room(
        room_length = 5.0,
        room_width = 5.0,
        room_height = 2.5,
        door_quantity = 1,
        door_width = 0.9,
        door_height = 2.0,
        window_quantity = 1,
        window_width = 1.5,
        window_height = 1.0,
        radiator_quantity = 1,
        radiator_width = 1.5,
        radiator_height = 0.7,
        is_default = True
    )

def init_data():
    #ndb.delete_multi(Project.query().fetch(keys_only=True))
    #ndb.delete_multi(Room.query().fetch(keys_only=True))
    #ndb.delete_multi(Paint.query().fetch(keys_only=True))
    
    #Create project test data if not there already.
    if(Project.query(Project.username == 'Test').count() < 3):
        Project(username='Test', title='Test One', date_created=datetime.now()).put()

    #Create room defaults if not there already.
    if(Room.query(Room.is_default == True).count() <= 0):
        default_room = create_default_room()
        default_room.put()

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
            Paint.prod_rate == p[1],
            Paint.surface_type == p[2]
        )
        if(qry.count() <= 0):
            Paint(name=p[0], prod_rate=p[1], surface_type=p[2], order=p[3]).put()

    time.sleep(3)

class Home(webapp2.RequestHandler):
    def get(self):
        init_data()
        self.response.write(
        	JINJA_ENV.get_template(TEMPLATES_DIR + 'index.html').render({ 
                'default_room': json.dumps(Room.query(Room.is_default == True).fetch(1)[0].to_dict(), indent=4, default=json_serial),
                'rooms': json.dumps([r.to_dict() for r in Room.query(Room.is_default == False).fetch(300)], indent=4, default=json_serial),
	        	'projects': json.dumps([p.to_dict() for p in Project.query().fetch(20)], indent=4, default=json_serial),
                'paints': json.dumps([p.to_dict() for p in Paint.query().order(Paint.surface_type, Paint.order).fetch(300)], indent=4)
        	}) 
        )

class GetPaints(webapp2.RequestHandler):
    def get(self):
        self.response.headers['Content-Type'] = 'application/json'
        self.response.write(
            json.dumps([p.to_dict() for p in Paint.query().order(Paint.order).fetch(200)])
        )

class SaveSpec(webapp2.RequestHandler):
    def post(self):
        surface_type = self.request.POST.get('surface_type')
        paints = json.loads(self.request.POST.get('paints'))
        resp_paints = []
        paint_keys = []

        for obj in paints:
            paint_keys.append(obj['key'])
            if(obj['key'] != ""):
                #Update existing paint
                paint = ndb.Key(urlsafe=obj['key']).get()
                if(paint):
                    paint.name = obj['name'];
                    paint.prod_rate = float(obj['prod_rate']);
                    paint.order = int(obj['order']);
                    resp_paints.append(paint.put().get())
            else:
                #Create new paint
                resp_paints.append(
                    Paint(name = obj['name'],
                        surface_type = surface_type,
                        prod_rate = float(obj['prod_rate']),
                        order = Paint.query().order(-Paint.order).fetch(1)[0].order + 1
                    ).put().get()
                )

        #Do deletions
        all_paints = Paint.query(Paint.surface_type == surface_type).fetch(200)
        for p in all_paints:
            if p.key.urlsafe() not in paint_keys:
                p.key.delete()

        #Combine the other types of paints so we send all the
        #most up to date data to the client
        other_paints = Paint.query(Paint.surface_type != surface_type).order(Paint.surface_type, Paint.order).fetch(500)
        for p in other_paints:
            resp_paints.append(p)

        resp_paints.sort(key=lambda x:x.order)

        self.response.headers['Content-Type'] = 'application/json'
        self.response.write(json.dumps([p.to_dict() for p in resp_paints]))
        
class CreateProject(webapp2.RequestHandler):
    def post(self):
        project_title = self.request.get('projectTitle')
        project = Project(username='Test', title=project_title, date_created=datetime.now())
        project = project.put().get()
        projects = Project.query().fetch(50)
        
        if(next((p for p in projects if p.key == project.key), None)) == None:
            projects.append(project)

        self.response.headers['Content-Type'] = 'application/json'
        self.response.write( json.dumps([p.to_dict() for p in projects], default=json_serial) )

class GetProject(webapp2.RequestHandler):
    def post(self):
        project = ndb.Key(urlsafe=self.request.get('project_key')).get()

        self.response.headers['Content-Type'] = 'application/json'
        self.response.write(json.dumps(project.to_dict(), default=json_serial))

class DeleteProject(webapp2.RequestHandler):
    def post(self):

        project = ndb.Key(urlsafe=self.request.get('project_key')).get()
        if(len(project.rooms) >= 1):
            for room in project.rooms:
                room.delete()
        project.key.delete()

        projects = Project.query().fetch(50)
        self.response.headers['Content-Type'] = 'application/json'
        self.response.write( json.dumps([p.to_dict() for p in projects], default=json_serial) )

class SaveRoom(webapp2.RequestHandler):
    def post(self):
        obj_room = json.loads(self.request.POST.get('room'))
        room = Room()
        
        if(obj_room['key'] != ""):
            room = ndb.Key(urlsafe=obj_room['key']).get()

        room.name                   = obj_room['name']
        room.room_width             = obj_room['room_width']
        room.room_length            = obj_room['room_length']
        room.room_height            = obj_room['room_height']
        room.door_quantity          = obj_room['door_quantity']
        room.door_width             = obj_room['door_width']
        room.door_height            = obj_room['door_height']
        room.window_quantity        = obj_room['window_quantity']
        room.window_width           = obj_room['window_width']
        room.window_height          = obj_room['window_height']
        room.radiator_quantity      = obj_room['radiator_quantity']
        room.radiator_width         = obj_room['radiator_width']
        room.radiator_height        = obj_room['radiator_height']
        room.ceiling_adjust_simple  = obj_room['ceiling_adjust_simple']
        room.wall_adjust_simple     = obj_room['wall_adjust_simple']
        room.is_default             = obj_room['is_default']
        room.group_items            = obj_room['group_items']

        room = room.put().get()

        if(obj_room['project'] != ""):
            #Get the project entity and append the room.
            room.project = ndb.Key(urlsafe=obj_room['project'])
            project = room.project.get()
            project.rooms.append(room.put())
            project.put()

        self.response.headers['Content-Type'] = 'application/json'
        self.response.write(json.dumps(room.to_dict(), default=json_serial))   

class DeleteRoom(webapp2.RequestHandler):
    def post(self):
        room = ndb.Key(urlsafe=self.request.get('room_key')).get()
        project = room.project.get()
        if room.key in project.rooms:
            idx = project.rooms.index(room.key)
            del project.rooms[idx]
            room.project = project.put()

        self.response.headers['Content-Type'] = 'application/json'
        self.response.write(json.dumps(project.to_dict(), default=json_serial))   

application = webapp2.WSGIApplication([
    ('/', Home),
    ('/createproject', CreateProject),
    ('/getproject', GetProject),
    ('/deleteproject', DeleteProject),
    ('/saveroom', SaveRoom),
    ('/deleteroom', DeleteRoom),
    ('/savespec', SaveSpec),
    ('/getpaints', GetPaints)
], debug=True)
