import os
os.environ['DATABASE_URL']='sqlite:///./test_jarvis.db'
os.environ['DEFAULT_ADMIN_EMAIL']='admin@test.local'
os.environ['DEFAULT_ADMIN_PASSWORD']='test-password'
os.environ['JWT_SECRET']='test-secret'
