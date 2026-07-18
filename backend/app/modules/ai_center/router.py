from fastapi import APIRouter, Depends, HTTPException

from app.db.models import User
from app.modules.ai_center.schemas import AIChatRequest, AIChatResponse, AIStaffRead
from app.modules.ai_center.service import build_reply, get_staff, list_staff
from app.shared.deps import get_current_user

router = APIRouter(prefix="/ai-center", tags=["ai-center"])


@router.get("/staff", response_model=list[AIStaffRead])
def staff_directory(_: User = Depends(get_current_user)) -> list[dict]:
    return [
        {
            "id": staff.id,
            "name": staff.name,
            "role": staff.role,
            "domain": staff.domain,
            "focus": list(staff.focus),
            "opening": staff.opening,
        }
        for staff in list_staff()
    ]


@router.post("/chat", response_model=AIChatResponse)
def chat(payload: AIChatRequest, _: User = Depends(get_current_user)) -> dict:
    staff = get_staff(payload.staff_id)
    if staff is None:
        raise HTTPException(status_code=404, detail="AI staff member not found")

    reply, actions = build_reply(staff, payload.message, payload.context)
    return {
        "staff_id": staff.id,
        "staff_name": staff.name,
        "reply": reply,
        "recommended_actions": actions,
    }
