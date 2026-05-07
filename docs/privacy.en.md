# Privacy

English | [中文版](privacy.md)

## Local-first default

Local backend (`http://localhost:8000`) is the recommended default. Vocabulary, sentence context, and LLM requests stay under your control.

## Data flow

1. Extension -> backend: rewrite/explain/save/review requests
2. Backend -> LLM provider: only when provider keys are configured on backend

## Local vs Hosted

- Local: data on your machine
- Hosted: data on operator infrastructure
- Optional `Extension-Key` is for local gated deployments only in OSS defaults

## OSS defaults

- No built-in analytics SDK
- No advertising trackers
- No LLM provider secrets in extension source
