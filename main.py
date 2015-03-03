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
        serial = obj.isoformat()
        return serial

class Project(ndb.Model):
    id = ndb.IntegerProperty()
    username = ndb.StringProperty()
    title = ndb.StringProperty()
    rooms = ndb.KeyProperty(kind='Room', repeated=True)
    date_created = ndb.DateTimeProperty(auto_now_add=True)

class Room(ndb.Model):
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

class HandlerHome(webapp2.RequestHandler):
    def get(self):
        #ndb.delete_multi(Project.query().fetch(keys_only=True))
        #ndb.delete_multi(Room.query().fetch(keys_only=True))
        
        #Create project test data if not there already.
        if(Project.query(Project.username == 'Test').count() < 3):
            Project(username='Test', title='Test One', date_created=datetime.now()).put()
            Project(username='Test', title='Test Two', date_created=datetime.now()).put()
            Project(username='Test', title='Test Three', date_created=datetime.now()).put()

        #Create room defaults if not there already.
        if(Room.query(Room.is_default == True).count() <= 0):
            default_room = create_default_room()
            default_room.put()

        time.sleep(2)

        self.response.write( 
        	JINJA_ENV.get_template(TEMPLATES_DIR + 'index.html').render({ 
	        	'default_room': Room.query(Room.is_default == True).fetch(1)[0],
	        	'projects': Project.query().fetch(20) 
        	}) 
        )

class HandlerCreateProject(webapp2.RequestHandler):
    def post(self):
        project_title = self.request.get('projectTitle')
        new_project = Project(id=3, username='Test', title=project_title, date_created=datetime.now())
        new_project.put()
        create_default_room().put()
        time.sleep(1) #Allow time for project to save to datastore
        self.response.write( json.dumps([p.to_dict() for p in Project.query().fetch(20)], default=json_serial) )

class HandlerGetProject(webapp2.RequestHandler):
    def post(self):
        project = ndb.Key(urlsafe=self.request.get('project_key')).get()
        self.response.write(json.dumps(project.to_dict(), default=json_serial))

class HandlerSaveRoom(webapp2.RequestHandler):
    def post(self):
        room_data = self.request.get('room')
        #TODO: find the room with the given key

application = webapp2.WSGIApplication([
    ('/', HandlerHome),
    ('/createproject', HandlerCreateProject),
    ('/getproject', HandlerGetProject),
    ('/saveroom', HandlerSaveRoom)
], debug=True)
