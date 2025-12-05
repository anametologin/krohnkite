#!/usr/bin/python3

import argparse
import getpass
from logging import error
import os
from pathlib import Path

from lib import run_cmd, bcolors, success, fail

def make_directory(p: Path) -> bool:
    try:
        p.mkdir(parents=True, exist_ok=True)
    except FileExistsError:
        # print(f"Directory '{p}' already exists.")
        return True
    except PermissionError:
        error(f"Permission denied: Unable to create '{p}'.")
        return False
    except Exception as e:
        print(f"An error occurred: {e}")
        return False

    return True


def generate_cfg(p: Path) -> bool:
    cfg = f"""
folder_path: str = "{p}"

kwin_script_name: str = "krohnkite"
install_program = "kpackagetool6"
notify_program = "notify-send"
"""

    with open("config.py", "w") as file:
        file.write(cfg)

    return True


def generate_systemd_service(project_dir: Path,systemd_service_folder, systemd_service_name: str) -> bool:
    if not make_directory(systemd_service_folder):
        return False
    systemd_file = f"""
[Unit]
Description=Krohnkite autoinstall

[Service]
Type=simple
User={getpass.getuser()}
WorkingDirectory={project_dir}
ExecStart={Path.joinpath(project_dir, '.venv', 'bin', 'python')} {Path.joinpath(project_dir, 'autoinstalld.py')}
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

# Environment variables (optional)
Environment=PATH={Path.joinpath(project_dir, '.venv', 'bin')}

[Install]
WantedBy=default.target

    """
    with open(Path.joinpath(systemd_service_folder, systemd_service_name).as_posix(), "w") as file:
        file.write(systemd_file)

    return True


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        prog="install",
        description="Install `autoinstall`.Create virtualenv and config.py",
        usage="%(prog)s [options]",
    )
    parser.add_argument(
        "dirpath",
        help="Absolute or relative path to directory where will appear krohnkite packages",
    )
    args = parser.parse_args()

    current_dir = Path(os.getcwd())
    print(bcolors.OKBLUE + f"Current directory: {current_dir}" + bcolors.ENDC)

    if not current_dir.joinpath("autoinstalld.py").is_file():
        fail("1.Check if 'autoinstalld.py' exist:")
        exit(-1)
    else:
        success("1.Check if 'autoinstalld.py' exist:")

    watch_dir = Path(args.dirpath)

    if not watch_dir.is_dir():
        fail(f"2.Check if '{watch_dir}' exist")
        exit(-1)
    success(f"2.Check if '{watch_dir}' exist")

    config_backup_file = current_dir.joinpath("config.py.backup")
    if config_backup_file.is_file():
        config_backup_file.unlink()
    config_file = current_dir.joinpath("config.py")
    if config_file.is_file():
        os.rename(config_file, config_backup_file)

    if generate_cfg(watch_dir):
        success("3.Generate 'config.py'")

    virtualenv_path = current_dir.joinpath(".venv")

    if not virtualenv_path.is_dir():
        result = run_cmd(["python", "-m", "venv", ".venv"])
        if result is None:
            fail(f"4.1 Create Virtual environment[{virtualenv_path}]")
            exit(1)
        success(f"4.1 Create Virtual environment[{virtualenv_path}]")

        result = run_cmd(
            [".venv/bin/python", ".venv/bin/pip", "install", "--upgrade", "pip"]
        )
        if result is None:
            fail("4.2 Update pip")
            exit(1)
        success("4.2 Update pip")

        result = run_cmd([".venv/bin/python", ".venv/bin/pip", "install", "watchdog"])
        if result is None:
            fail("4.3 Install 'watchdog'")
            exit(1)
        success("4.3 Install 'watchdog'")
    else:
        success(
            f"4.Virtual environment '{current_dir.joinpath('.venv')}' already exist"
        )

    # systemd
    systemd_service_folder = Path.joinpath(Path.home(),
        ".config/systemd/user"
    )
    systemd_service_name = "krohnkite_autoinstall.service"
    systemd_service_path = Path.joinpath(systemd_service_folder, systemd_service_name)
    if not systemd_service_path.is_file():
        if generate_systemd_service(current_dir, systemd_service_folder, systemd_service_name):
            success(
                f"5. Create systemd service'{systemd_service_path}'"
            )
        else:
            fail (
                f"5. Create systemd service'{systemd_service_path}'"
            )
    else:
        success(
            f"5. Systemd service'{systemd_service_path}' already exist"
        )

    result = run_cmd(["systemctl", "--user", "start", "krohnkite_autoinstall.service"])
    if result is None:
        fail("7 Start service [krohnkite_autoinstall]")
        exit(1)
    success("6 Start service [krohnkite_autoinstall]")

    run_cmd(["systemctl", "--user", "enable", "krohnkite_autoinstall.service"], is_stilly=True)
    result_bin = run_cmd(["systemctl", "--user", "is-enabled", "krohnkite_autoinstall.service"])

    result = result_bin.stdout.decode('utf-8') if result_bin is not None else None

    if result is None or "enabled" not in result :
        fail(f"6 Enable service '{result}' [krohnkite_autoinstall]")
        exit(1)
    success("7 Enable service [krohnkite_autoinstall]")

