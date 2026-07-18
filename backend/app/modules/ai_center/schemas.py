from pydantic import BaseModel, Field


class AIStaffRead(BaseModel):
    id: str
    name: str
    role: str
    domain: str
    focus: list[str]
    opening: str


class AIChatRequest(BaseModel):
    staff_id: str = Field(min_length=2, max_length=40)
    message: str = Field(min_length=1, max_length=4000)
    context: str = Field(default="", max_length=4000)


class AIChatResponse(BaseModel):
    staff_id: str
    staff_name: str
    reply: str
    recommended_actions: list[str]
