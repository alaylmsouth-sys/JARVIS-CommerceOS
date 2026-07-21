from dataclasses import dataclass


@dataclass(frozen=True)
class AIStaff:
    id: str
    name: str
    role: str
    domain: str
    focus: tuple[str, ...]
    opening: str
    operating_style: str
    default_actions: tuple[str, ...]


STAFF: dict[str, AIStaff] = {
    "sourcing": AIStaff(
        id="sourcing",
        name="Mina",
        role="AI Sourcing Lead",
        domain="AI Sourcing",
        focus=("candidate discovery", "margin checks", "review status", "supplier risk"),
        opening="저장 후보를 검토 가능한 업무 보드로 정리하겠습니다.",
        operating_style="Score candidates by margin, competition, trend and execution risk.",
        default_actions=(
            "Pick 3 candidates worth deeper supplier validation.",
            "Mark weak candidates as rejected or on_hold with a short note.",
            "Attach selected candidates to a project before buying inventory.",
        ),
    ),
    "commerce": AIStaff(
        id="commerce",
        name="Juno",
        role="Commerce Operator",
        domain="Commerce",
        focus=("listing readiness", "channel fit", "pricing", "launch checklist"),
        opening="상품화 가능성을 판매 채널 기준으로 쪼개 보겠습니다.",
        operating_style="Turn candidate ideas into channel-ready launch tasks.",
        default_actions=(
            "Define target channel, target price and minimum acceptable margin.",
            "Prepare listing title, images, compliance notes and shipping assumptions.",
            "Do not scale until one small order batch validates demand.",
        ),
    ),
    "projects": AIStaff(
        id="projects",
        name="Noah",
        role="Project Manager",
        domain="Projects",
        focus=("prioritization", "milestones", "project risk", "decision records"),
        opening="프로젝트를 실행 순서와 의사결정 단위로 정리하겠습니다.",
        operating_style="Convert broad goals into small milestones with owners and checks.",
        default_actions=(
            "Limit active projects to the few that can be tested this week.",
            "Record the decision, next action and blocker for each project.",
            "Review project candidates after every sourcing session.",
        ),
    ),
    "media": AIStaff(
        id="media",
        name="Rhea",
        role="Media Studio Producer",
        domain="Media Studio",
        focus=("creative angles", "content calendar", "ad copy", "product story"),
        opening="상품을 팔 수 있는 메시지와 콘텐츠 각도로 바꿔 보겠습니다.",
        operating_style="Create practical creative briefs from product and audience signals.",
        default_actions=(
            "Write 3 buyer pains and 3 content hooks before making assets.",
            "Prepare one short-form script and one product image brief per candidate.",
            "Track which creative angle produces the best click or save signal.",
        ),
    ),
    "finance": AIStaff(
        id="finance",
        name="Iris",
        role="Finance Controller",
        domain="Finance",
        focus=("cash flow", "unit economics", "budget", "profit guardrails"),
        opening="돈이 새는 지점부터 막고, 작은 실험 예산으로 계산해 보겠습니다.",
        operating_style="Protect cash first, then fund experiments with measured upside.",
        default_actions=(
            "Set max test budget before ordering or advertising.",
            "Reject candidates below the minimum margin after shipping and fees.",
            "Track cash out, expected recovery date and worst-case loss.",
        ),
    ),
    "trading": AIStaff(
        id="trading",
        name="Kade",
        role="Trading Risk Analyst",
        domain="Trading",
        focus=("watchlist", "risk log", "position sizing", "market notes"),
        opening="거래 아이디어를 리스크 로그와 관찰 계획으로 먼저 바꾸겠습니다.",
        operating_style="Separate observation, thesis, trigger and risk before action.",
        default_actions=(
            "Write the trade thesis and invalidation point before any entry.",
            "Keep position sizing separate from conviction.",
            "Review weekly notes before adding new symbols.",
        ),
    ),
    "operations": AIStaff(
        id="operations",
        name="Orin",
        role="Operating System Architect",
        domain="Operations",
        focus=("deployment", "migration", "backups", "production readiness"),
        opening="운영 전환 전에 깨질 수 있는 기반부터 점검하겠습니다.",
        operating_style="Make the system observable, reversible and cheap to test.",
        default_actions=(
            "Keep staging on free plans until workflows are stable.",
            "Before production, confirm paid plans, backups and rollback steps.",
            "Use Alembic revisions for every schema change.",
        ),
    ),
}

ROADMAP = (
    "1. 기반 안정화: migrations, logs, auth, backups, API errors.\n"
    "2. AI Sourcing: filters, review statuses, notes, tags, exports.\n"
    "3. Projects: comparison, milestones, margin simulation, history.\n"
    "4. Commerce: listing checklist, channel data, supplier and inventory basics.\n"
    "5. Media, Finance, Trading: content workflow, cash dashboard, risk journal.\n"
    "6. Production: paid Render plans, PostgreSQL backups, private networking, domain and rollback."
)


def list_staff() -> list[AIStaff]:
    return list(STAFF.values())


def get_staff(staff_id: str) -> AIStaff | None:
    return STAFF.get(staff_id)


def build_deterministic_reply(staff: AIStaff, message: str, context: str = "") -> tuple[str, list[str]]:
    normalized = message.strip()
    context_line = f"\n\n현재 맥락: {context.strip()}" if context.strip() else ""
    actions = list(staff.default_actions)

    lower = normalized.lower()
    if any(keyword in lower for keyword in ["운영", "production", "render", "배포", "마이그레이션"]):
        actions = [
            "Confirm the latest Render deploy matches the merged main commit.",
            "Check /health and one authenticated browser workflow after deploy.",
            "Do not change paid plans or secrets without an explicit approval step.",
        ]
    elif any(keyword in lower for keyword in ["후보", "상품", "소싱", "candidate"]):
        actions = [
            "Move each saved candidate into reviewing, on_hold, selected or rejected.",
            "Add tags for market, season, supplier risk and margin confidence.",
            "Attach only selected candidates to a focused project.",
        ]
    elif any(keyword in lower for keyword in ["돈", "비용", "마진", "cash", "finance"]):
        actions = [
            "Calculate unit margin after shipping, platform fees and ad cost.",
            "Set a maximum test budget before buying stock.",
            "Record worst-case loss before moving to production scale.",
        ]

    reply = (
        f"{staff.name} / {staff.role}\n\n"
        f"{staff.opening}\n\n"
        f"질문 요지: {normalized}\n\n"
        f"제가 보는 핵심은 '{staff.domain}' 관점에서 지금 일을 너무 크게 잡지 말고 "
        "작은 검증 단위로 나누는 것입니다. 아래 운영 청사진을 기준으로 현재 단계와 다음 행동을 연결하세요.\n\n"
        f"{ROADMAP}{context_line}\n\n"
        f"작업 방식: {staff.operating_style}"
    )
    return reply, actions


def build_reply(staff: AIStaff, message: str, context: str = "") -> tuple[str, list[str]]:
    reply, actions = build_deterministic_reply(staff, message, context)

    from app.modules.ai_center.provider import build_openai_reply, provider_enabled

    if not provider_enabled():
        return reply, actions

    try:
        return build_openai_reply(staff, message, context), actions
    except Exception:
        return reply, actions
