from Backend.database.database import Base, SessionLocal

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


