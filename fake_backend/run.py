import os
from app import app, logging

logging.info(app.config)
app.run(port=5100)
