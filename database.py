from sqlalchemy import create_engine, Column, Integer, String, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import json

SQLALCHEMY_DATABASE_URL = "sqlite:///./tutor_app.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class UserModel(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    
    # New persistence fields
    current_role = Column(String, nullable=True)
    target_role = Column(String, nullable=True)
    roadmap_json = Column(Text, nullable=True)
    progress_data = Column(Text, nullable=False, default='{"completed_modules": [], "current_topic_index": 0}')

    def set_progress(self, data):
        self.progress_data = json.dumps(data)

    def get_progress(self):
        return json.loads(self.progress_data)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Create tables
Base.metadata.create_all(bind=engine)
