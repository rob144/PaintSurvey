import os
import webapp2
import jinja2
from google.appengine.ext import ndb
from models import *
from datetime import datetime
import time
import json

TEMPLATES_DIR = 'templates/'

loader = jinja2.FileSystemLoader(os.path.dirname(__file__))

JINJA_ENV = jinja2.Environment(
    loader = loader,
    extensions = ['jinja2.ext.autoescape'],
    autoescape = True)

def json_serial(obj):
    #JSON serializer for objects not serializable by default json code
    if isinstance(obj, datetime):
        return obj.isoformat()
    if(type(obj) == ndb.key.Key):
        return obj.urlsafe()

class Home(webapp2.RequestHandler):
    def get(self):
        init_data()
        self.response.write(
            JINJA_ENV.get_template(TEMPLATES_DIR + 'index.html').render({ 
                'default_room': json.dumps(DefaultRoom.query().fetch(1)[0].to_dict(), indent=4, default=json_serial),
                'rooms': json.dumps([r.to_dict() for r in Room.query().fetch(300)], indent=4, default=json_serial),
                'projects': json.dumps([p.to_dict() for p in Project.query().fetch(20)], indent=4, default=json_serial),
                'paints': json.dumps([p.to_dict() for p in Paint.query().order(Paint.surface_type, Paint.order).fetch(300)], indent=4, default=json_serial)
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
        self.response.write(json.dumps([p.to_dict() for p in resp_paints], default=json_serial))
        
class CreateProject(webapp2.RequestHandler):
    def post(self):        
        project_title = self.request.get('projectTitle')
        project = Project(username='Test', title=project_title, date_created=datetime.now())
        project = project.put().get()
        
        for paint in Paint.query(Paint.project == None).fetch(200):
            project.paints.append(
                Paint(
                    name            = paint.name,
                    prod_rate       = paint.prod_rate,
                    surface_type    = paint.surface_type,
                    order           = paint.order,
                    project         = project.key
                ).put()
            )

        projects = Project.query().fetch(500)
        paints = Paint.query().order(Paint.project, Paint.surface_type, Paint.order).fetch(500)

        #Append new project to response to deal with ds latency.
        if(project.key not in [p.key for p in projects]):
            projects.append(project)

        #Append new project paints to response to deal with ds latency.
        for proj_paint in project.paints:
            if(proj_paint not in [p.key for p in paints]):
                paints.append(proj_paint.get())

        resp = {
            'projects': [p.to_dict() for p in projects],
            'paints': [p.to_dict() for p in paints]
        }

        self.response.headers['Content-Type'] = 'application/json'
        self.response.write( json.dumps(resp, indent=4, default=json_serial) )

class GetProject(webapp2.RequestHandler):
    def post(self):
        project = ndb.Key(urlsafe=self.request.get('project_key')).get()

        self.response.headers['Content-Type'] = 'application/json'
        self.response.write(json.dumps(project.to_dict(), default=json_serial))

class DeleteProject(webapp2.RequestHandler):
    def post(self):

        proj_key = ndb.Key(urlsafe=self.request.get('project_key'))
        project = proj_key.get()
        
        if(project):
            for room in project.rooms:
                room.delete()
            for paint in project.paints:
                paint.delete()
            project.key.delete()

        projects = Project.query().fetch(200)
        projects = [ p for p in projects if p.key is not proj_key ]

        self.response.headers['Content-Type'] = 'application/json'
        self.response.write( json.dumps([p.to_dict() for p in projects], default=json_serial) )

class SaveDefaultRoom(webapp2.RequestHandler):
    def post(self):
        obj_room = json.loads(self.request.POST.get('room'))
        room = DefaultRoom()
        
        if(obj_room['key'] != ""):
            room = ndb.Key(urlsafe=obj_room['key']).get()

        room.name               = obj_room['name']
        room.room_width         = obj_room['room_width']
        room.room_length        = obj_room['room_length']
        room.room_height        = obj_room['room_height']
        room.door_width         = obj_room['door_width']
        room.door_height        = obj_room['door_height']
        room.window_width       = obj_room['window_width']
        room.window_height      = obj_room['window_height']
        room.radiator_width     = obj_room['radiator_width']
        room.radiator_height    = obj_room['radiator_height']
        
        room = room.put().get()

        self.response.headers['Content-Type'] = 'application/json'
        self.response.write(json.dumps(room.to_dict(), default=json_serial))   

class SaveRoom(webapp2.RequestHandler):
    def post(self):
        obj_room = json.loads(self.request.POST.get('room'))
        room = Room()
        
        if(obj_room['key'] != ""):
            room = ndb.Key(urlsafe=obj_room['key']).get()

        room.name                   = obj_room['name']
        room.room_hours_adjust      = obj_room['room_hours_adjust']
        room.room_width             = obj_room['room_width']
        room.room_length            = obj_room['room_length']
        room.room_height            = obj_room['room_height']
        room.ceiling_adjust_simple  = obj_room['ceiling_adjust_simple']
        room.wall_adjust_simple     = obj_room['wall_adjust_simple']
        room.skirting_adjust_simple = obj_room['skirting_adjust_simple']
        room.group_items            = obj_room['group_items']

        room = room.put().get()

        if(obj_room['project'] != ""):
            #Get the project entity and append the room.
            room.project = ndb.Key(urlsafe=obj_room['project'])
            project = room.project.get()
            if(room.key not in project.rooms):
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
    ('/savedefaultroom', SaveDefaultRoom),
    ('/deleteroom', DeleteRoom),
    ('/savespec', SaveSpec),
    ('/getpaints', GetPaints)
], debug=True)
