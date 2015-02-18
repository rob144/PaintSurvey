import os
import webapp2
import jinja2
from google.appengine.ext import ndb
from datetime import datetime
import json

class Project(ndb.Model):
    id = ndb.StringProperty()
    username = ndb.StringProperty()
    title = ndb.StringProperty()
    date_created = ndb.DateTimeProperty(auto_now_add=True)

def json_serial(obj):
    """JSON serializer for objects not serializable by default json code"""
    if isinstance(obj, datetime):
        serial = obj.isoformat()
        return serial

def include_file(filename):
    return jinja2.Markup(loader.get_source(JINJA_ENV, filename)[0])

loader = jinja2.FileSystemLoader(os.path.dirname(__file__))

JINJA_ENV = jinja2.Environment(
    loader = loader,
    extensions = ['jinja2.ext.autoescape'],
    autoescape = True)

JINJA_ENV.globals['include_file'] = include_file

class HomeHandler(webapp2.RequestHandler):
    def get(self):
        #ndb.delete_multi(Project.query().fetch(keys_only=True))
        #Create test data if not there already
        if(Project.query(Project.username == 'Test').count() < 3):
            Project(id='1', username='Test', title='Test One', date_created=datetime.now()).put()
            Project(id='2', username='Test', title='Test Two', date_created=datetime.now()).put()
            Project(id='3', username='Test', title='Test Three', date_created=datetime.now()).put()
        
        print('PROJECTS: ' + str(Project.query().count()))
        json_data = json.dumps([p.to_dict() for p in Project.query().fetch(20)], default=json_serial)
        print('JSON: '+json_data)
        template = JINJA_ENV.get_template('index.html')
        self.response.write(template.render({ 'projects': json_data }))

class CreateProjectHandler(webapp2.RequestHandler):
    def post(self):
        #TODO: add code to save project to the datastore.
        self.response.write('CREATE PROJECT')

application = webapp2.WSGIApplication([
    ('/', HomeHandler),
    ('/createproject', CreateProjectHandler)
], debug=True)
