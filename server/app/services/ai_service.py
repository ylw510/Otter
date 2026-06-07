import json

from app.services.llm_client import chat_completion
from app.services.prompt_loader import get_prompt_loader


async def ai_rewrite(text: str, styles: list[str]) -> list[dict]:
    prompt = get_prompt_loader().render_rewrite(text, styles)
    raw = await chat_completion(
        [{"role": "user", "content": prompt}],
        temperature=0.7,
        response_format_json=True,
    )
    if not raw:
        return [{"style": s, "text": ""} for s in styles]
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        return [{"style": s, "text": ""} for s in styles]
    return [{"style": style, "text": data.get(style, "") or ""} for style in styles]


async def ai_explain(text: str, sentence: str = "") -> dict:
    prompt = get_prompt_loader().render_explain(text, sentence)
    raw_text = await chat_completion(
        [{"role": "user", "content": prompt}],
        temperature=0.3,
        response_format_json=False,
    )
    return {"explanation": (raw_text or "").strip()}


async def ai_translate(
    text: str,
    sentence: str = "",
    *,
    source_lang: str = "en",
    target_lang: str = "zh",
) -> dict:
    prompt = get_prompt_loader().render_translate(
        text,
        sentence,
        source_lang=source_lang,
        target_lang=target_lang,
    )
    raw_text = await chat_completion(
        [{"role": "user", "content": prompt}],
        temperature=0.3,
        response_format_json=False,
    )
    return {"translation": (raw_text or "").strip()}
