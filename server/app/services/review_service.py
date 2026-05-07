"""
SM-2 间隔重复（与 design.md 一致）
quality: 0–5（0=完全不记得，5=轻松记得）
返回 (下次间隔天数, 新 ease, 新复习次数)。
"""


def calculate_next_review(
    quality: int,
    ease_factor: float,
    interval: int,
    review_count: int,
) -> tuple[int, float, int]:
    if quality < 3:
        return 1, max(1.3, ease_factor - 0.2), review_count + 1

    if review_count == 0:
        new_interval = 1
    elif review_count == 1:
        new_interval = 6
    else:
        new_interval = round(interval * ease_factor)

    new_ease = ease_factor + (
        0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)
    )
    new_ease = max(1.3, new_ease)

    return new_interval, new_ease, review_count + 1
