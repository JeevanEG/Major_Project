from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class SkillGapItem(BaseModel):
    skill: str
    current_level: int
    target_level: int
    gap: int
    priority: str
