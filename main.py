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
    """JSON serializer for objects not serializable by default json code"""
    if isinstance(obj, datetime):
        return obj.isoformat()
    if(str(type(obj)) == "<class 'google.appengine.ext.ndb.key.Key'>"):
        return obj.urlsafe()

def str2bool(s):
    return s.lower() in ("yes", "true", "t", "1")

class ModelUtils(object):
    def to_dict(self):
        result = super(ModelUtils,self).to_dict()
        result['key'] = self.key.urlsafe()
        return result

class Project(ModelUtils, ndb.Model):
    id = ndb.IntegerProperty()
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
        p1_key = Project(username='Test', title='Test One', date_created=datetime.now()).put()
        r1_key = create_default_room().put()
        r1 = create_default_room().put().get()
        r1.is_default = False
        r1.project = p1_key
        r1_key = r1.put()
        p1 = p1_key.get()
        p1.rooms.append(r1_key)
        p1.put()
        for r in p1.rooms:
            print('room: ' + str(r))
        Project(username='Test', title='Test Two', date_created=datetime.now()).put()
        Project(username='Test', title='Test Three', date_created=datetime.now()).put()

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
                'default_room': json.dumps(Room.query(Room.is_default == True).fetch(1)[0].to_dict(), default=json_serial),
                'rooms': json.dumps([r.to_dict() for r in Room.query(Room.is_default == False).fetch(300)], default=json_serial),
	        	'projects': json.dumps([p.to_dict() for p in Project.query().fetch(20)], default=json_serial),
                'paints': json.dumps([p.to_dict() for p in Paint.query().order(Paint.order).fetch(300)]) 
        	}) 
        )

class GetPaints(webapp2.RequestHandler):
    def get(self):
        self.response.write(
            json.dumps([p.to_dict() for p in Paint.query().order(Paint.order).fetch(200)])
        )

class SaveSpec(webapp2.RequestHandler):
    def post(self):
        surface_type = self.request.POST.get('surface_type')
        paints = json.loads(self.request.POST.get('paints'))
        resp_paints = []
        paint_keys = []

        #Do adds and updates
        for obj in paints:
            paint_keys.append(obj['key'])
            if(obj['key'] != ""):
                #Update existing paint
                ent_paint = ndb.Key(urlsafe=obj['key']).get()
                ent_paint.name = obj['name'];
                ent_paint.prod_rate = float(obj['prod_rate']);
                ent_paint.order = int(obj['order']);
                resp_paints.append(ent_paint.put().get())
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

        #Combine all the paints so we send all the most up to date data to the client
        other_paints = Paint.query(Paint.surface_type != surface_type).fetch(1000)
        for p in other_paints:
            resp_paints.append(p)

        self.response.write(
            json.dumps([p.to_dict() for p in resp_paints])
        )
        
class CreateProject(webapp2.RequestHandler):
    def post(self):
        project_title = self.request.get('projectTitle')
        new_project = Project(id=3, username='Test', title=project_title, date_created=datetime.now())
        new_project.put()
        create_default_room().put()
        time.sleep(1) #Allow time for project to save to datastore
        self.response.write( json.dumps([p.to_dict() for p in Project.query().fetch(20)], default=json_serial) )

class GetProject(webapp2.RequestHandler):
    def post(self):
        project = ndb.Key(urlsafe=self.request.get('project_key')).get()
        self.response.write(json.dumps(project.to_dict(), default=json_serial))

class SaveRoom(webapp2.RequestHandler):
    def post(self):
        obj_room = json.loads(self.request.POST.get('room'))
        room = Room()
        
        if(obj_room['key'] != ""):
            room = ndb.Key(urlsafe=obj_room['key']).get()

        room.name = obj_room['name'];
        room.room_width = obj_room['room_width'];
        room.room_length = obj_room['room_length'];
        room.room_height = obj_room['room_height'];
        room.door_quantity = obj_room['door_quantity'];
        room.door_width = obj_room['door_width'];
        room.door_height = obj_room['door_height'];
        room.window_quantity = obj_room['window_quantity'];
        room.window_width = obj_room['window_width'];
        room.window_height = obj_room['window_height'];
        room.radiator_width = obj_room['radiator_width'];
        room.radiator_height = obj_room['radiator_height'];
        room.is_default = obj_room['is_default'];

        room = room.put().get()
        print('save room: ' + room.name + ' ' + str(room.is_default));

        if(obj_room['project'] != ""):
            #Get the project entity and append the room.
            room.project = ndb.Key(urlsafe=obj_room['project'])
            print('save room to project ' + str(room.project))
            project = room.project.get()
            project.rooms.append(room.put())
            project.put()

        self.response.write('DONE')

class DeleteRoom(webapp2.RequestHandler):
    def post(self):
        obj_room = json.loads(self.request.POST.get('room'))
        room = ndb.Key(urlsafe=obj_room['key']).get()
        project = room.project.get()
        print(room.key)
        print(project.rooms)
        if room.key in project.rooms:
            idx = project.rooms.index(room.key)
            del project.rooms[idx]
            room.project = project.put()

            print('Delete room ' + str(room.key.delete()))

        self.response.headers['Content-Type'] = 'application/json'
        self.response.write(json.dumps(project.to_dict(), default=json_serial))   

application = webapp2.WSGIApplication([
    ('/', Home),
    ('/createproject', CreateProject),
    ('/getproject', GetProject),
    ('/saveroom', SaveRoom),
    ('/deleteroom', DeleteRoom),
    ('/savespec', SaveSpec),
    ('/getpaints', GetPaints)
], debug=True)
