import os
from pathlib import Path
DB=Path('test_jarvis.db')
if DB.exists(): DB.unlink()
os.environ['DATABASE_URL']='sqlite:///./test_jarvis.db'
os.environ['DEFAULT_ADMIN_EMAIL']='admin@example.com'
os.environ['DEFAULT_ADMIN_PASSWORD']='test-password'
os.environ['JWT_SECRET']='test-secret'
