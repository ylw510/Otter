from unittest.mock import AsyncMock, patch

import pytest

from app.services import ai_service


@pytest.mark.asyncio
async def test_ai_rewrite_parses_json():
    with patch.object(
        ai_service,
        "chat_completion",
        new_callable=AsyncMock,
        return_value='{"professional": "A", "native": "B"}',
    ):
        out = await ai_service.ai_rewrite("x", ["professional", "native"])
        assert out == [
            {"style": "professional", "text": "A"},
            {"style": "native", "text": "B"},
        ]


@pytest.mark.asyncio
async def test_ai_explain_strips():
    with patch.object(
        ai_service,
        "chat_completion",
        new_callable=AsyncMock,
        return_value="  hello  ",
    ):
        out = await ai_service.ai_explain("w", "")
        assert out == {"explanation": "hello"}
