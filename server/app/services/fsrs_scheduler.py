"""FSRS scheduler aligned with extension/src/review/fsrsScheduler.ts (ts-fsrs)."""

from datetime import timedelta

from fsrs import Scheduler

# Python package: https://pypi.org/project/fsrs/ (py-fsrs)
_otter_scheduler: Scheduler | None = None


def get_otter_scheduler() -> Scheduler:
    global _otter_scheduler
    if _otter_scheduler is None:
        _otter_scheduler = Scheduler(
            desired_retention=0.9,
            maximum_interval=36500,
            learning_steps=(
                timedelta(minutes=1),
                timedelta(minutes=10),
                timedelta(days=1),
            ),
            relearning_steps=(
                timedelta(minutes=10),
                timedelta(days=1),
            ),
            enable_fuzzing=True,
        )
    return _otter_scheduler
