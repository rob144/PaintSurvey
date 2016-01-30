import logging
import os
import webapp2
import jinja2
from google.appengine.ext import ndb
from models import *
from datetime import datetime, timedelta
import time
import json
from mytools import *
from google.appengine.api.logservice import logservice

TEMPLATES_DIR = 'templates/'
loader = jinja2.FileSystemLoader(os.path.dirname(__file__))

JINJA_ENV = jinja2.Environment(
    loader = loader,
    extensions = ['jinja2.ext.autoescape'],
    autoescape = True)

def ToJson(strInput):
    strOuput = strInput
    try:
        strOutput = json.dumps(strInput, sort_keys=True, indent=2, separators=(',', ': '))
    except TypeError:
        print("type error.")
    return strOutput

def json_serial(obj):
    #JSON serializer for objects not serializable by default json code
    if isinstance(obj, datetime):
        return obj.isoformat()
    if(type(obj) == ndb.key.Key):
        return obj.urlsafe()

class Home(webapp2.RequestHandler):
    def get(self):
        default_room = DefaultRoom.query().fetch(1)[0].to_dict()
        rooms        = [r.to_dict() for r in Room.query().fetch(300)]
        projects     = [p.to_dict() for p in Project.query().fetch(20)]
        paints       = [p.to_dict() for p in Paint.query().order(Paint.surfaceType, Paint.order).fetch(300)]

        self.response.write(
            JINJA_ENV.get_template(TEMPLATES_DIR + 'index.html').render({
                'default_room': json.dumps(default_room, indent=4, default=json_serial),
                'rooms':        json.dumps(rooms,       indent=4, default=json_serial),
                'projects':     json.dumps(projects,    indent=4, default=json_serial),
                'paints':       json.dumps(paints,      indent=4, default=json_serial)
            })
        )

class Admin(webapp2.RequestHandler):
    def get(self):
        default_rooms = [r.to_dict() for r in DefaultRoom.query().fetch(1)]
        rooms        = [r.to_dict() for r in Room.query().fetch(300)]
        projects     = [p.to_dict() for p in Project.query().fetch(20)]
        paints       = [p.to_dict() for p in Paint.query().order(Paint.surfaceType, Paint.order).fetch(300)]

        cssClass = "datastore-table"

        htmlDefaultRoom = ""

        if(len(default_rooms) >= 1):
            htmlDefaultRoom = dictToHtmlTable(default_rooms[0], cssClass)

        htmlRooms       = listToHtmlTable(rooms, cssClass)
        htmlProjects    = listToHtmlTable(projects, cssClass)
        htmlPaints      = listToHtmlTable(paints, cssClass)

        self.response.write(
            JINJA_ENV.get_template(TEMPLATES_DIR + 'admin.html').render({
                'default_room': htmlDefaultRoom,
                'rooms':        htmlRooms,
                'projects':     htmlProjects,
                'paints':       htmlPaints
            })
        )

class Logs(webapp2.RequestHandler):
    def get(self):
        resp = ''
        logs = logservice.fetch(start_time=time.time() - 1000,
            end_time=time.time(), offset=None,
            minimum_log_level=logservice.LOG_LEVEL_INFO, include_app_logs=True)
        #resp += 'Total number of logs: %s' % len(logs)
        numOfLogs = 0
        for req_log in logs:
            numOfLogs += 1
            resp += '<hr /><br /> REQUEST LOG. '
            resp += 'IP: %s %s %s ' % (req_log.ip, req_log.method, req_log.resource)
            resp += '%s' % datetime.fromtimestamp(req_log.end_time)

            for app_log in req_log.app_logs:
                resp += '<br/><br/>APP LOG. '
                resp += '%s ' % datetime.fromtimestamp(app_log.time)
                resp += '<br/><textarea rows="30" cols="100">%s</textarea>' % app_log.message

        resp = 'Total number of logs: ' +  str(numOfLogs) + '<br/>' + resp

        self.response.out.write(resp)

class DeleteData(webapp2.RequestHandler):
    def post(self):
        deleteData()
        self.response.write('data deleted')

class InitData(webapp2.RequestHandler):
    def get(self):
        initData()
        self.response.write('data initialized')
    def post(self):
        initData()
        self.response.write('data initialized')

class GetPaints(webapp2.RequestHandler):
    def get(self):
        self.response.headers['Content-Type'] = 'application/json'
        self.response.write(
            json.dumps([p.to_dict() for p in Paint.query().order(Paint.order).fetch(200)])
        )

class SaveSpec(webapp2.RequestHandler):
    def post(self):
        surfaceType = self.request.POST.get('surfaceType')
        paints = json.loads(self.request.POST.get('paints'))
        respRaints = []
        paintKeys = []

        for obj in paints:
            paintKeys.append(obj['key'])
            if(obj['key'] != ''):
                #Update existing paint
                paint = ndb.Key(urlsafe=obj['key']).get()
                if(paint):
                    paint.name          = obj['name']
                    paint.prodRateOne   = float(obj['prodRateOne'])
                    paint.prodRateTwo   = float(obj['prodRateTwo'])
                    paint.unitRate      = float(obj['unitRate'])
                    paint.order         = int(obj['order'])
                    respRaints.append(paint.put().get())
            else:
                #Create new paint
                respRaints.append(
                    Paint(
                        name        = obj['name'],
                        surfaceType = surfaceType,
                        prodRateOne = float(obj['prodRateOne']),
                        prodRateTwo = float(obj['prodRateTwo']),
                        unitRate    = float(obj['unitRate']),
                        order       = Paint.query().order(-Paint.order).fetch(1)[0].order + 1
                    ).put().get()
                )

        #Do deletions
        allPaints = Paint.query(Paint.surfaceType == surfaceType).fetch(500)

        for p in allPaints:
            if p.key.urlsafe() not in paintKeys:
                p.key.delete()

        #Combine the other types of paints so we send all the
        #most up to date data to the client
        otherPaints = Paint.query(Paint.surfaceType != surfaceType).order(Paint.surfaceType, Paint.order).fetch(500)
        for p in otherPaints:
            respRaints.append(p)

        respRaints.sort(key=lambda x:x.order)

        self.response.headers['Content-Type'] = 'application/json'
        self.response.write(json.dumps([p.to_dict() for p in respRaints], default=json_serial))

class CreateProject(webapp2.RequestHandler):
    def post(self):
        projectTitle = self.request.get('projectTitle')
        project = Project(username='Test', title=projectTitle, dateCreated=datetime.now())
        project = project.put().get()

        #Copy paints from existing spec to the new project
        for paint in Paint.query(Paint.project == None).fetch(200):
            project.paints.append(
                Paint(
                    name          = paint.name,
                    prodRateOne   = paint.prodRateOne,
                    prodRateTwo   = paint.prodRateTwo,
                    unitRate      = paint.unitRate,
                    surfaceType   = paint.surfaceType,
                    order         = paint.order,
                    project       = project.key
                ).put()
            )
        #Save project after paints have been attached
        project.put()

        projects = Project.query().fetch(500)
        paints = Paint.query().order(Paint.project, Paint.surfaceType, Paint.order).fetch(500)

        #Append new project to response to deal with datastore latency.
        if(project.key not in [p.key for p in projects]):
            projects.append(project)

        #Append new project paints to response to deal with datastore latency.
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
        rooms = Room.query().fetch(300)
        rooms = [ r for r in rooms if r.project is not proj_key ]

        resp = {
            'projects': [p.to_dict() for p in projects],
            'rooms': [r.to_dict() for r in rooms]
        }

        self.response.headers['Content-Type'] = 'application/json'
        self.response.write( json.dumps(resp, indent=4, default=json_serial) )

class SaveDefaultRoom(webapp2.RequestHandler):
    def post(self):
        obj_room = json.loads(self.request.POST.get('room'))
        room = DefaultRoom()

        if(obj_room['key'] != ""):
            room = ndb.Key(urlsafe=obj_room['key']).get()

        room.name              = obj_room['name']
        room.roomWidth         = obj_room['roomWidth']
        room.roomLength        = obj_room['roomLength']
        room.roomHeight        = obj_room['roomHeight']
        room.doorWidth         = obj_room['doorWidth']
        room.doorHeight        = obj_room['doorHeight']
        room.windowWidth       = obj_room['windowWidth']
        room.windowHeight      = obj_room['windowHeight']
        room.radiatorWidth     = obj_room['radiatorWidth']
        room.radiatorHeight    = obj_room['radiatorHeight']

        room = room.put().get()

        self.response.headers['Content-Type'] = 'application/json'
        self.response.write(json.dumps(room.to_dict(), default=json_serial))

class SaveRoom(webapp2.RequestHandler):
    def post(self):
        obj_room = json.loads(self.request.POST.get('room'))
        room = Room()

        if('key' in obj_room and obj_room['key'] != ""):
            room = ndb.Key(urlsafe=obj_room['key']).get()

        logging.info(json.dumps(obj_room['groupItems'], sort_keys=True, indent=2, separators=(',', ': ')))

        room.name                 = obj_room['name']
        room.roomHoursAdjust      = obj_room['roomHoursAdjust']
        room.roomWidth            = obj_room['roomWidth']
        room.roomLength           = obj_room['roomLength']
        room.roomHeight           = obj_room['roomHeight']
        room.ceilingAdjustSimple  = obj_room['ceilingAdjustSimple']
        room.wallAdjustSimple     = obj_room['wallAdjustSimple']
        room.skirtingAdjustSimple = obj_room['skirtingAdjustSimple']
        room.groupItems           = obj_room['groupItems']

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
            room.key.delete()
            project = project.put().get()

        self.response.headers['Content-Type'] = 'application/json'
        self.response.write(json.dumps(project.to_dict(), default=json_serial))

application = webapp2.WSGIApplication([
    ('/'                , Home            ),
    ('/createproject'   , CreateProject   ),
    ('/getproject'      , GetProject      ),
    ('/deleteproject'   , DeleteProject   ),
    ('/saveroom'        , SaveRoom        ),
    ('/savedefaultroom' , SaveDefaultRoom ),
    ('/deleteroom'      , DeleteRoom      ),
    ('/savespec'        , SaveSpec        ),
    ('/getpaints'       , GetPaints       ),
    ('/admin'           , Admin           ),
    ('/logs'            , Logs            ),
    ('/deletedata'      , DeleteData      ),
    ('/initdata'        , InitData        ),
], debug=True)
