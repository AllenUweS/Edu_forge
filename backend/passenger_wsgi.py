import os
import sys

# Add application directory to sys.path
sys.path.insert(0, os.path.dirname(__file__))

# Configure Django settings module
os.environ['DJANGO_SETTINGS_MODULE'] = 'exam_project.settings'

from exam_project.wsgi import application
