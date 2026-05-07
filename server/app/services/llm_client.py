"""统一 chat 补全：OpenAI 兼容 SDK 与 Anthropic 双路径。"""

from __future__ import annotations

import os
from typing import Any

from openai import AsyncOpenAI

from app.services.llm_settings import LLMSettings, load_llm_settings

_oa_client: AsyncOpenAI | None = None
_oa_fingerprint: tuple[str, str | None] | None = None


def _get_openai_style_client(s: LLMSettings) -> AsyncOpenAI:
    global _oa_client, _oa_fingerprint
    fp = (s.api_key, s.base_url)
    if _oa_client is not None and _oa_fingerprint == fp:
        return _oa_client
    kwargs: dict[str, Any] = {"api_key": s.api_key}
    if s.base_url:
        kwargs["base_url"] = s.base_url
    _oa_client = AsyncOpenAI(**kwargs)
    _oa_fingerprint = fp
    return _oa_client


def _use_json_response_format() -> bool:
    v = (os.getenv("LLM_JSON_RESPONSE_FORMAT") or "1").strip().lower()
    return v not in ("0", "false", "no", "off")


async def _openai_style_chat(
    s: LLMSettings,
    messages: list[dict[str, str]],
    *,
    temperature: float,
    response_format_json: bool,
) -> str:
    client = _get_openai_style_client(s)
    kwargs: dict[str, Any] = {
        "model": s.model,
        "messages": messages,
        "temperature": temperature,
    }
    if response_format_json and _use_json_response_format():
        kwargs["response_format"] = {"type": "json_object"}
    response = await client.chat.completions.create(**kwargs)
    raw = response.choices[0].message.content
    return (raw or "").strip()


async def _anthropic_chat(
    s: LLMSettings,
    messages: list[dict[str, str]],
    *,
    temperature: float,
) -> str:
    try:
        from anthropic import AsyncAnthropic
    except ImportError as e:
        raise RuntimeError(
            "Install the anthropic package: pip install anthropic",
        ) from e

    # 仅 user 内容合并为一条，与当前 explain/rewrite 用法一致
    text = "\n\n".join(m["content"] for m in messages if m.get("content"))
    client = AsyncAnthropic(api_key=s.api_key)
    msg = await client.messages.create(
        model=s.model,
        max_tokens=8192,
        temperature=temperature,
        messages=[{"role": "user", "content": text}],
    )
    if not msg.content:
        return ""
    block = msg.content[0]
    if hasattr(block, "text"):
        return (block.text or "").strip()
    return str(block).strip()


async def chat_completion(
    messages: list[dict[str, str]],
    *,
    temperature: float = 0.7,
    response_format_json: bool = False,
) -> str:
    """
    多厂商统一入口。
    - OpenAI / DeepSeek / Kimi / openai_compatible：OpenAI 官方 Python SDK（base_url 可改）。
    - Anthropic：官方 anthropic SDK。
    """
    s = load_llm_settings()
    if s.provider == "anthropic":
        return await _anthropic_chat(s, messages, temperature=temperature)
    return await _openai_style_chat(
        s,
        messages,
        temperature=temperature,
        response_format_json=response_format_json,
    )
