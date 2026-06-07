"""Load versioned prompt templates from ``server/prompts/`` (text files)."""

from __future__ import annotations

import os
from pathlib import Path

_SERVER_ROOT = Path(__file__).resolve().parents[2]
_PROMPTS_DIR = _SERVER_ROOT / "prompts"

_STYLE_DESCRIPTIONS: dict[str, str] = {
    "professional": (
        "formal, precise, suitable for technical documentation or professional emails"
    ),
    "native": (
        "natural, fluent, how a native English-speaking engineer would say it casually"
    ),
    "casual": "relaxed and conversational, like a Slack message to a teammate",
    "twitter_tech": (
        "punchy, opinionated, internet-native tech Twitter style, under 120 chars"
    ),
}


def _rewrite_version_id() -> str:
    return (os.getenv("PROMPT_VERSION_REWRITE") or "rewrite_v1").strip()


def _explain_version_id() -> str:
    return (os.getenv("PROMPT_VERSION_EXPLAIN") or "explain_v1").strip()


def _translate_version_id() -> str:
    return (os.getenv("PROMPT_VERSION_TRANSLATE") or "translate_v1").strip()


def _read_template(filename: str) -> str:
    path = _PROMPTS_DIR / f"{filename}.txt"
    if not path.is_file():
        raise FileNotFoundError(f"Prompt template not found: {path}")
    return path.read_text(encoding="utf-8")


class PromptLoader:
    """Loads prompts by version id for A/B or staged rollouts."""

    def render_rewrite(self, text: str, styles: list[str]) -> str:
        vid = _rewrite_version_id()
        template = _read_template(vid)
        style_list = "\n".join(
            f"- {s}: {_STYLE_DESCRIPTIONS.get(s, s)}" for s in styles
        )
        lines = ",\n".join(f'  "{s}": "..."' for s in styles)
        return (
            template.replace("{{STYLE_LIST}}", style_list)
            .replace("{{TEXT}}", text)
            .replace("{{RESPONSE_JSON_LINES}}", lines)
        )

    def render_explain(self, text: str, sentence: str = "") -> str:
        vid = _explain_version_id()
        template = _read_template(vid)
        ctx = ""
        if sentence.strip():
            ctx = (
                f'\nIt appears in this sentence (context):\n"{sentence.strip()}"\n'
            )
        block = ""
        if ctx:
            block = ctx
        return (
            template.replace("{{TEXT}}", text).replace("{{CONTEXT_BLOCK}}", block)
        )

    def render_translate(
        self,
        text: str,
        sentence: str = "",
        *,
        source_lang: str = "en",
        target_lang: str = "zh",
    ) -> str:
        del source_lang, target_lang  # reserved for future locale-specific templates
        vid = _translate_version_id()
        template = _read_template(vid)
        ctx = ""
        if sentence.strip():
            ctx = (
                f'\nSurrounding context (same paragraph or sentence):\n"{sentence.strip()}"\n'
            )
        return template.replace("{{TEXT}}", text).replace("{{CONTEXT_BLOCK}}", ctx)


_loader: PromptLoader | None = None


def get_prompt_loader() -> PromptLoader:
    global _loader
    if _loader is None:
        _loader = PromptLoader()
    return _loader
