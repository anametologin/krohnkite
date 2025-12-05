from subprocess import run, PIPE, CompletedProcess
from logging import error
import sys

class bcolors:
    HEADER = "\033[95m"
    OKBLUE = "\033[94m"
    OKCYAN = "\033[96m"
    OKGREEN = "\033[92m"
    WARNING = "\033[93m"
    FAIL = "\033[91m"
    ENDC = "\033[0m"
    BOLD = "\033[1m"
    UNDERLINE = "\033[4m"


def success(s: str):
    print(f"{s}: [{bcolors.OKGREEN}V{bcolors.ENDC}]")


def fail(s: str):
    print(f"{s}: [{bcolors.FAIL}X{bcolors.ENDC}]")


def info(s: str):
    print(f"{bcolors.OKBLUE}{s}{bcolors.ENDC}")


def warning(s: str):
    print(f"{bcolors.WARNING}{s}{bcolors.ENDC}")


def run_cmd(c: list[str], is_stilly=False) -> CompletedProcess[bytes] | None:
    try:
        result = run(
            c,
            stdout=PIPE,
            stderr=PIPE,
        )
    except FileNotFoundError:
        error(f"{c[0]}: not found")
        return None
    except:
        error("Unexpected error:", sys.exc_info()[0])
        return None

    if result.stderr != b"" and not is_stilly:
        error(result.stderr.decode("utf-8"))
        return None

    return result
