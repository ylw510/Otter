# Prompts

English | [中文版](prompts.md)

Prompts are versioned text files in `server/prompts/` (for example `rewrite_v1.txt`, `explain_v1.txt`), not embedded in Python source.

## Prompt roles

- `rewrite_v1`: Chinese/broken English -> native English, multi-style JSON output
- `explain_v1`: vocabulary explanation for Chinese-speaking engineers

## Contract

- Rewrite input: text + style list; output: JSON object keyed by styles
- Explain input: term + optional sentence; output: concise plain text explanation

## Versioning

- Controlled by `PROMPT_VERSION_REWRITE` and `PROMPT_VERSION_EXPLAIN`
- Rendered through `PromptLoader`
- Bump prompt versions for output-shape changes
