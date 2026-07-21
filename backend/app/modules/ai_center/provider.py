from __future__ import annotations

import httpx

from app.core.config import settings
from app.modules.ai_center.service import AIStaff


class AIProviderError(RuntimeError):
    pass


def provider_enabled() -> bool:
    return settings.ai_provider == "openai"


def build_system_prompt(staff: AIStaff) -> str:
    return (
        "You are an AI staff member inside JARVIS-CommerceOS. "
        "Answer in Korean. Be practical, concise and operational. "
        "Never claim that you executed external marketplace, payment, posting, pricing or inventory actions. "
        "Recommend next steps only, because real side effects require explicit user approval.\n\n"
        f"Staff name: {staff.name}\n"
        f"Role: {staff.role}\n"
        f"Domain: {staff.domain}\n"
        f"Focus: {', '.join(staff.focus)}\n"
        f"Operating style: {staff.operating_style}"
    )


def build_user_prompt(message: str, context: str) -> str:
    context_line = f"\n\nCurrent context:\n{context.strip()}" if context.strip() else ""
    return f"User question:\n{message.strip()}{context_line}"


def extract_response_text(payload: dict) -> str:
    output_text = payload.get("output_text")
    if isinstance(output_text, str) and output_text.strip():
        return output_text.strip()

    chunks: list[str] = []
    output = payload.get("output")
    if isinstance(output, list):
        for item in output:
            if not isinstance(item, dict):
                continue
            content = item.get("content")
            if not isinstance(content, list):
                continue
            for content_item in content:
                if not isinstance(content_item, dict):
                    continue
                text = content_item.get("text")
                if isinstance(text, str) and text.strip():
                    chunks.append(text.strip())
    if chunks:
        return "\n".join(chunks)
    raise AIProviderError("OpenAI response did not include text output")


def build_openai_reply(staff: AIStaff, message: str, context: str) -> str:
    if settings.openai_api_key is None:
        raise AIProviderError("OpenAI API key is not configured")

    base_url = settings.openai_base_url.rstrip("/")
    response = httpx.post(
        f"{base_url}/responses",
        headers={
            "Authorization": f"Bearer {settings.openai_api_key.get_secret_value()}",
            "Content-Type": "application/json",
        },
        json={
            "model": settings.openai_model,
            "input": [
                {"role": "system", "content": build_system_prompt(staff)},
                {"role": "user", "content": build_user_prompt(message, context)},
            ],
            "max_output_tokens": 700,
        },
        timeout=settings.openai_timeout_seconds,
    )
    response.raise_for_status()
    return extract_response_text(response.json())
