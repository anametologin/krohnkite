#!.venv/bin/python
'''
    SPDX-FileCopyrightText: 2025 Vjatcheslav V. Kolchkov <akl334@protonmail.ch>

    SPDX-License-Identifier: MIT
'''
from logging import warning, error, info, debug
import os
from pathlib import Path
import signal
import threading
from threading import Thread
import time
from watchdog.events import (
    FileSystemEvent,
    PatternMatchingEventHandler,
)
from watchdog.observers import Observer


import config
from lib import run_cmd



def kde_send_notification(s: str):
    run_cmd([config.notify_program, s], is_stilly=True)


def kwin_script_install(p: Path):
    isInstalled: bool
    has_installed_result_binary = run_cmd(
        [
            config.install_program,
            "-t",
            "KWin/Script",
            "-s",
            config.kwin_script_name,
        ]
    )
    if has_installed_result_binary is None:
        return

    err = (
        None
        if has_installed_result_binary.stderr == b""
        else has_installed_result_binary.stderr.decode("utf-8").lower()
    )
    if err is not None:
        if "can't find plugin" in err:
            isInstalled = False
        else:
            error(err)
            return
    else:
        isInstalled = True

    debug(f"{config.kwin_script_name} isInstalled: {isInstalled}")

    install_result_binary = run_cmd(
        [
            config.install_program,
            "-t",
            "KWin/Script",
            f"{'-u' if isInstalled else '-i'}",
            p.as_posix(),
        ],
    )
    if install_result_binary is None:
        return
    err = (
        None
        if install_result_binary.stderr == b""
        else install_result_binary.stderr.decode("utf-8").lower()
    )
    if err is not None:
        kde_send_notification(f"💀 {err}")
    else:
        kde_send_notification(f"✅ {p.name}")


class FileEventHandler(PatternMatchingEventHandler):
    def __init__(
        self,
        *,
        patterns: list[str] | None = None,
        ignore_patterns: list[str] | None = None,
        ignore_directories: bool = False,
        case_sensitive: bool = False,
    ):
        super().__init__(
            patterns=patterns,
            ignore_patterns=ignore_patterns,
            ignore_directories=ignore_directories,
            case_sensitive=case_sensitive,
        )
        self.event_path: Path | None = None

    def on_any_event(self, event: FileSystemEvent) -> None:
        path = event.src_path
        if isinstance(path, (bytes, bytearray)):
            try:
                path = path.decode()
            except (UnicodeDecodeError, AttributeError):
                warning("Cannot decode byte like path")
                return

        path = Path(path)

        if event.event_type == "created":
            self.event_path = path
        if event.event_type == "closed":
            if self.event_path == path:
                if not os.path.isfile(path):
                    warning(f"file:{path} doesn't exit")
                    self.event_path = None
                    return
                kwin_script_install(path)
            else:
                return


def thread_1():
    event_handler = FileEventHandler(
        patterns=[
            "krohnkite*.kwinscript",
        ],
        case_sensitive=False,
        ignore_directories=True,
    )
    observer = Observer()
    observer.schedule(event_handler, config.folder_path, recursive=True)
    observer.start()
    try:
        while not exit_event.is_set():
            time.sleep(1)
    finally:
        info("Stoping daemon...")
        observer.stop()
        observer.join()


def exit_hdl(signum, frame):
    exit_event.set()

if __name__ == "__main__":
    if '/usr/bin' not in os.environ['PATH']:
        os.environ['PATH'] = '/usr/bin:' + os.environ['PATH']
    exit_event = threading.Event()
    signal.signal(signal.SIGTERM, exit_hdl)
    signal.signal(signal.SIGINT, exit_hdl)

# creating a thread
    T = Thread(target=thread_1)

# change T to daemon
    T.daemon = True

# starting of Thread T
    T.start()
    T.join()
    debug("Exit Main Thread")
