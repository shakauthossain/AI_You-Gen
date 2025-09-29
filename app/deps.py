from fastapi import Depends
from sqlalchemy.orm import Session
from db import SessionLocal
from models import User
from auth import get_current_user

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_or_create_user(user=Depends(get_current_user), db: Session = Depends(get_db)):
    # user['sub'] is Clerk user id, user['email'] is email
    db_user = db.query(User).filter_by(clerk_id=user["sub"]).first()
    if not db_user:
        db_user = User(clerk_id=user["sub"], email=user.get("email"))
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
    return db_user
