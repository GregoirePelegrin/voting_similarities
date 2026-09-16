from __future__ import annotations

from threading import Lock
from uuid import uuid4


class SingletonMetaclass(type):
    _instances: dict = {}
    __lock: Lock = Lock()

    def __call__(cls, *args, **kwargs):
        if cls not in cls._instances:
            with cls.__lock:
                if cls not in cls._instances:
                    instance = super().__call__(*args, **kwargs)
                    instance.uuid = str(uuid4())
                    instance.get_uuid = lambda: instance.uuid
                    cls._instances[cls] = instance
        return cls._instances[cls]
