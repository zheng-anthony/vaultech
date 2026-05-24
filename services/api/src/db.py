import psycopg
import os
from contextlib import contextmanager

DATABASE_URL = os.getenv("DATABASE_URL")

def get_db_connection():
    with psycopg.connect(DATABASE_URL) as conn:
        with conn.transaction():
            yield conn
