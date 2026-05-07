"""LLM 接入配置：支持 OpenAI / DeepSeek / Anthropic / Kimi(Moonshot) / 任意 OpenAI 兼容网关。"""

from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Any

# 默认模型可随各平台更新，始终可用 LLM_MODEL 覆盖
_PRESETS: dict[str, dict[str, Any]] = {
    "openai": {
        "base_url": None,
        "model": "gpt-4o",
    },
    "deepseek": {
        "base_url": "https://api.deepseek.com",
        "model": "deepseek-chat",
    },
    "anthropic": {
        "base_url": None,
        "model": "claude-3-5-sonnet-20241022",
    },
    "kimi": {
        "base_url": "https://api.moonshot.cn/v1",
        "model": "moonshot-v1-8k",
    },
    "moonshot": {
        "base_url": "https://api.moonshot.cn/v1",
        "model": "moonshot-v1-8k",
    },
    "groq": {
        "base_url": "https://api.groq.com/openai/v1",
        "model": "llama-3.3-70b-versatile",
    },
    "openai_compatible": {
        "base_url": None,
        "model": "gpt-4o",
    },
}

_ALIASES: dict[str, str] = {
    "ms": "moonshot",
}


@dataclass(frozen=True)
class LLMSettings:
    """当前生效的 LLM 配置。"""

    provider: str
    api_key: str
    base_url: str | None
    model: str


def _env(key: str, default: str = "") -> str:
    return (os.getenv(key) or default).strip()


def load_llm_settings() -> LLMSettings:
    raw = _env("LLM_PROVIDER", "openai").lower() or "openai"
    provider = _ALIASES.get(raw, raw)

    if provider not in _PRESETS:
        raise ValueError(
            f"Unknown LLM_PROVIDER={raw!r}. "
            f"Use one of: {', '.join(sorted(_PRESETS))}.",
        )

    preset = _PRESETS[provider]
    key = _env("LLM_API_KEY")
    if not key:
        key = _env("OPENAI_API_KEY")
    if not key and provider == "anthropic":
        key = _env("ANTHROPIC_API_KEY")
    if not key:
        raise RuntimeError(
            "No API key: set LLM_API_KEY, or OPENAI_API_KEY "
            "(or ANTHROPIC_API_KEY for provider=anthropic).",
        )

    base = _env("LLM_BASE_URL")
    if not base:
        bu = preset.get("base_url")
        base = bu if isinstance(bu, str) else None
    if provider == "openai_compatible" and not base:
        raise RuntimeError(
            "LLM_PROVIDER=openai_compatible requires LLM_BASE_URL "
            "(e.g. 智谱、本地 vLLM、Ollama 的 OpenAI 兼容地址).",
        )

    model = _env("LLM_MODEL")
    if not model:
        m = preset.get("model")
        model = m if isinstance(m, str) else "gpt-4o"
    if provider == "openai_compatible" and not _env("LLM_MODEL"):
        # 无显式模型时仍用 preset 的默认
        pass

    return LLMSettings(
        provider=provider,
        api_key=key,
        base_url=base or None,
        model=model,
    )
