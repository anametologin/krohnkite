#!/usr/bin/python3
'''
    SPDX-FileCopyrightText: 2025 deepseek@ai <deepseek@ai.ch>

    SPDX-License-Identifier: MIT
'''

import argparse
import os
from pathlib import Path
import shutil
from subprocess import run, PIPE, CompletedProcess
import sys
from logging import error

from lib import run_cmd, bcolors, warning, success,fail,info



def confirm_action(prompt: str) -> bool:
    """Ask for confirmation before performing destructive action."""
    response = input(f"{bcolors.WARNING}{prompt} (y/N): {bcolors.ENDC}").strip().lower()
    return response in ['y', 'yes']


def stop_and_disable_service(service_name: str) -> bool:
    """Stop and disable the systemd service."""
    success_flag = True

    # Stop the service
    result = run_cmd(["systemctl", "--user", "stop", service_name])
    if result is None:
        warning(f"Failed to stop service '{service_name}' (might not be running)")
    else:
        success(f"Stop service '{service_name}'")

    # Disable the service
    run_cmd(["systemctl", "--user", "disable", service_name],is_stilly=True)
    result_bin = run_cmd(["systemctl", "--user", "is-enabled", service_name])

    result = result_bin.stdout.decode('utf-8').strip() if result_bin is not None else None

    if result is None or "not-found" not in result :
        fail(f"Disable service '{service_name}'")
        success_flag = False
    else:
        success(f"Disable service '{service_name}'")

    # Reload systemd daemon
    result = run_cmd(["systemctl", "--user", "daemon-reload"])
    if result is None:
        warning("Failed to reload systemd daemon")
    else:
        success("Reload systemd daemon")

    return success_flag


def remove_systemd_service(service_folder: Path, service_name: str) -> bool:
    """Remove the systemd service file."""
    service_path = service_folder.joinpath(service_name)

    if service_path.is_file():
        try:
            service_path.unlink()
            success(f"Remove systemd service file: {service_path}")
            return True
        except Exception as e:
            error(f"Failed to remove {service_path}: {e}")
            return False
    else:
        info(f"Systemd service file not found: {service_path}")
        return True  # Not an error if it doesn't exist


def restore_config_backup(config_file: Path, backup_file: Path) -> bool:
    """Restore the original config.py from backup if it exists."""
    if backup_file.is_file():
        if config_file.is_file():
            try:
                config_file.unlink()
                info(f"Removed current config file: {config_file}")
            except Exception as e:
                error(f"Failed to remove current config file: {e}")

        try:
            backup_file.rename(config_file)
            success(f"Restored original config from backup")
            return True
        except Exception as e:
            error(f"Failed to restore backup: {e}")
            return False
    else:
        # No backup, just remove current config if it exists
        if config_file.is_file():
            try:
                config_file.unlink()
                success(f"Removed config file: {config_file}")
                return True
            except Exception as e:
                error(f"Failed to remove config file: {e}")
                return False
    return True


def remove_virtualenv(venv_path: Path) -> bool:
    """Remove the virtual environment directory."""
    if venv_path.is_dir():
        try:
            shutil.rmtree(venv_path)
            success(f"Removed virtual environment: {venv_path}")
            return True
        except Exception as e:
            error(f"Failed to remove virtual environment: {e}")
            return False
    else:
        info(f"Virtual environment not found: {venv_path}")
        return True  # Not an error if it doesn't exist


def check_service_status(service_name: str) -> bool:
    """Check if the service is still active."""
    result = run_cmd(["systemctl", "--user", "is-active", service_name])
    if result is not None:
        status = result.stdout.decode('utf-8').strip()
        if status == "active":
            warning(f"Service '{service_name}' is still active!")
            return True
    return False


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        prog="uninstall",
        description="Uninstall krohnkite autoinstall service",
        usage="%(prog)s [options]"
    )
    parser.add_argument(
        "-y", "--yes",
        action="store_true",
        help="Skip confirmation prompts"
    )
    parser.add_argument(
        "--keep-config",
        action="store_true",
        help="Keep config.py file"
    )
    parser.add_argument(
        "--keep-venv",
        action="store_true",
        help="Keep virtual environment"
    )
    args = parser.parse_args()

    current_dir = Path(os.getcwd())
    print(bcolors.OKBLUE + f"Current directory: {current_dir}" + bcolors.ENDC)

    # Check if we're in the right directory
    if not current_dir.joinpath("install.py").is_file():
        warning("Warning: install.py not found in current directory")
        if not args.yes and not confirm_action("Continue anyway?"):
            print("Aborted.")
            sys.exit(0)

    # Configuration
    SERVICE_NAME = "krohnkite_autoinstall.service"
    SYSTEMD_SERVICE_FOLDER = Path.home().joinpath(".config/systemd/user")
    VENV_PATH = current_dir.joinpath(".venv")
    CONFIG_FILE = current_dir.joinpath("config.py")
    CONFIG_BACKUP = current_dir.joinpath("config.py.backup")

    # Display what will be removed
    info("=== Uninstallation Summary ===")
    print(f"1. Systemd Service: {SERVICE_NAME}")
    print(f"2. Virtual Environment: {VENV_PATH}")
    if not args.keep_config:
        print(f"3. Config File: {CONFIG_FILE}")
        if CONFIG_BACKUP.is_file():
            print(f"   (Backup will be restored: {CONFIG_BACKUP})")
    else:
        print(f"3. Config File: {CONFIG_FILE} (will be kept)")

    if not args.keep_venv:
        print(f"4. Virtual Environment: {VENV_PATH}")
    else:
        print(f"4. Virtual Environment: {VENV_PATH} (will be kept)")

    # Ask for confirmation
    if not args.yes and not confirm_action("Do you want to proceed with uninstallation?"):
        print("Aborted.")
        sys.exit(0)

    print("\n" + bcolors.BOLD + "Starting uninstallation..." + bcolors.ENDC)

    # 1. Check and stop service if running
    info("\n1. Stopping systemd service...")
    if check_service_status(SERVICE_NAME):
        stop_and_disable_service(SERVICE_NAME)

    # 2. Remove systemd service file
    info("\n2. Removing systemd service file...")
    remove_systemd_service(SYSTEMD_SERVICE_FOLDER, SERVICE_NAME)

    # 3. Handle config file
    info("\n3. Handling configuration files...")
    if not args.keep_config:
        restore_config_backup(CONFIG_FILE, CONFIG_BACKUP)
    else:
        info("Config file preserved as requested")

    # 4. Remove virtual environment
    info("\n4. Removing virtual environment...")
    if not args.keep_venv:
        remove_virtualenv(VENV_PATH)
    else:
        info("Virtual environment preserved as requested")

    # 5. Final status check
    info("\n5. Final verification...")
    final_status_ok = True

    # Check if service file still exists
    if SYSTEMD_SERVICE_FOLDER.joinpath(SERVICE_NAME).is_file():
        fail("Systemd service file still exists")
        final_status_ok = False
    else:
        success("Systemd service file removed")

    # Check if service is disabled
    result = run_cmd(["systemctl", "--user", "is-enabled", SERVICE_NAME])
    if result is not None:
        status = result.stdout.decode('utf-8').strip()
        if "not-found" not in status:
            fail(f"Service is not fully disabled <{status}>")
            final_status_ok = False
        else:
            success("Service is disabled")
    else:
        success("Service status check passed")

    # Check if virtual environment exists (if we tried to remove it)
    if not args.keep_venv and VENV_PATH.is_dir():
        fail("Virtual environment still exists")
        final_status_ok = False
    else:
        success("Virtual environment check passed")

    # Final message
    print("\n" + "="*50)
    if final_status_ok:
        print(bcolors.OKGREEN + "✓ Uninstallation completed successfully!" + bcolors.ENDC)
        print("\nNote: The directory contents (except removed items) are preserved.")
        print("You can reinstall anytime by running install.py again.")
    else:
        print(bcolors.WARNING + "⚠ Uninstallation completed with some issues." + bcolors.ENDC)
        print("Some components may need manual cleanup.")
        sys.exit(1)
