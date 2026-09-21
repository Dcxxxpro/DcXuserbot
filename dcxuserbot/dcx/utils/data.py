"""Tiny persistent JSON store (sudo list, PM permit state, small caches).

Atomic writes, zero dependencies, survives restarts — without needing any
database service. Values live under ``Config.DATA_DIR/state.json``.
"""

from __future__ import annotations

import json
import os
import threading
import time

from dcx.config import Config

_LOCK = threading.Lock()
_STATE: dict | None = None
_MTIME: float = 0.0

_DEFAULTS: dict = {
    "sudo_users": [],          # runtime-added sudo ids
    "pm_approved": [],         # PM permit whitelist
    "pm_warnings": {},         # user_id(str) -> strike count
    "pm_enabled": None,        # None -> follow Config.PM_PERMIT
}


def _path() -> str:
    os.makedirs(Config.DATA_DIR, exist_ok=True)
    return os.path.join(Config.DATA_DIR, "state.json")


def _load(force: bool = False) -> dict:
    global _STATE, _MTIME
    path = _path()
    try:
        mtime = os.path.getmtime(path)
    except OSError:
        mtime = 0.0
    with _LOCK:
        if _STATE is None or force or mtime > _MTIME:
            try:
                with open(path, "r", encoding="utf-8") as fh:
                    _STATE = json.load(fh)
            except (OSError, ValueError):
                _STATE = {}
            for key, fallback in _DEFAULTS.items():
                _STATE.setdefault(key, fallback.copy() if isinstance(fallback, (list, dict)) else fallback)
            _MTIME = mtime or time.time()
        return _STATE


def _save() -> None:
    global _MTIME
    state = _load()
    path = _path()
    tmp = f"{path}.tmp"
    with _LOCK:
        with open(tmp, "w", encoding="utf-8") as fh:
            json.dump(state, fh, indent=2)
        os.replace(tmp, path)
        _MTIME = time.time() + 1


# ── generic access ──────────────────────────────────────────────────────
def get(key: str, default=None):
    return _load().get(key, default)


def set_value(key: str, value) -> None:
    _load()[key] = value
    _save()


# ── sudo users ──────────────────────────────────────────────────────────
def sudo_ids() -> set[int]:
    return {int(x) for x in _load().get("sudo_users", [])}


def add_sudo(user_id: int) -> bool:
    ids = _load()["sudo_users"]
    if user_id in ids:
        return False
    ids.append(user_id)
    _save()
    return True


def remove_sudo(user_id: int) -> bool:
    ids = _load()["sudo_users"]
    if user_id not in ids:
        return False
    ids.remove(user_id)
    _save()
    return True


# ── PM permit ───────────────────────────────────────────────────────────
def pm_enabled() -> bool:
    value = _load().get("pm_enabled")
    return Config.PM_PERMIT if value is None else bool(value)


def set_pm_enabled(enabled: bool) -> None:
    set_value("pm_enabled", bool(enabled))


def pm_approved() -> set[int]:
    return {int(x) for x in _load().get("pm_approved", [])}


def pm_approve(user_id: int) -> bool:
    approved = _load()["pm_approved"]
    if user_id in approved:
        return False
    approved.append(user_id)
    _load()["pm_warnings"].pop(str(user_id), None)
    _save()
    return True


def pm_disapprove(user_id: int) -> bool:
    approved = _load()["pm_approved"]
    if user_id not in approved:
        return False
    approved.remove(user_id)
    _save()
    return True


def pm_warn(user_id: int) -> int:
    warnings = _load()["pm_warnings"]
    warnings[str(user_id)] = int(warnings.get(str(user_id), 0)) + 1
    _save()
    return warnings[str(user_id)]


def pm_reset_warnings(user_id: int) -> None:
    if _load()["pm_warnings"].pop(str(user_id), None) is not None:
        _save()
