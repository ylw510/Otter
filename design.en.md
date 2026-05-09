# Otter — Design (English)

English | [中文版](design.md)

## Positioning

Browser-native English copilot focused on real-world reading/writing loops, not isolated vocabulary drilling.

## System shape

- Chrome extension as product UI
- FastAPI backend for AI orchestration and persistence
- API contract centered on `/api/v1`
- Prompt engineering via versioned files in `server/prompts/`

## Core UX

- Selection menu: save / explain / rewrite
- Writing assistant button on editable surfaces
- Hover explain with debounce for cost control
- Popup for saved words and review flow

## Engineering priorities

- Isolate injected styles (Shadow DOM)
- Handle SPA DOM churn (MutationObserver)
- Protect keys by keeping provider secrets on backend
- Keep extension/backend contracts versioned and observable

## MVP progression

1. Save flow + popup list
2. Rewrite flow
3. Hover explain + persistence
4. Review flow + polish
