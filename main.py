import os
import webapp2
import jinja2

def include_file(filename):
    return jinja2.Markup(loader.get_source(JINJA_ENV, filename)[0])

loader=jinja2.FileSystemLoader(os.path.dirname(__file__))
JINJA_ENV = jinja2.Environment(
    loader=loader,
    extensions=['jinja2.ext.autoescape'],
    autoescape=True)
JINJA_ENV.globals['include_file'] = include_file

class HomeHandler(webapp2.RequestHandler):
    def get(self):
        template_values = {
            'greeting': 'HELLO'
        }

        template = JINJA_ENV.get_template('index.html')
        self.response.write(template.render(template_values))

class TestHandler(webapp2.RequestHandler):
    def get(self):
        template = JINJA_ENV.get_template('test.html')
        self.response.write(template.render())

application = webapp2.WSGIApplication([
    ('/', HomeHandler),
    (r'/test', TestHandler)
], debug=True)
