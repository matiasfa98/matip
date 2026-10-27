
from pathlib import Path
import os

ROOT = Path(__file__).resolve().parent
OUTPUT = ROOT / "matip-codebase.txt"

EXCLUDED_DIRS = {
    "node_modules", ".git", ".venv", "venv", "env",
    "__pycache__", "dist", "build", ".next", ".nuxt",
    "coverage", ".expo", ".turbo", ".cache",
    "target", "vendor", ".idea", ".vscode",
    "Pods", "DerivedData"
}

EXCLUDED_FILES = {
    "package-lock.json", "yarn.lock", "pnpm-lock.yaml",
    "bun.lockb", "bun.lock", "Cargo.lock",
    "composer.lock", "poetry.lock", "uv.lock",
    "dump_project.py", "matip-codebase.txt"
}

EXCLUDED_SUFFIXES = {
    ".pyc", ".pyo", ".exe", ".dll", ".so", ".dylib",
    ".bin", ".db", ".sqlite", ".sqlite3", ".zip",
    ".pdf", ".png", ".jpg", ".jpeg", ".gif", ".webp",
    ".ico", ".mp4", ".mp3", ".woff", ".woff2", ".ttf",
    ".otf", ".class", ".jar", ".wasm"
}

# Never dump files that may contain credentials or private data.
SECRET_NAMES = {
    ".env", ".env.local", ".env.production",
    ".env.development", ".npmrc", ".pypirc",
    "credentials.json", "service-account.json",
    "id_rsa", "id_ed25519"
}

MAX_FILE_SIZE = 300_000  # 300 KB per file


def should_skip(path: Path) -> bool:
    name = path.name.lower()

    if name in {x.lower() for x in EXCLUDED_FILES}:
        return True

    if name in {x.lower() for x in SECRET_NAMES}:
        return True

    if name.endswith(".pem") or name.endswith(".key"):
        return True

    if name.startswith(".env."):
        return True

    if path.suffix.lower() in EXCLUDED_SUFFIXES:
        return True

    # Skip other likely environment/secret files.
    if any(word in name for word in (
        "secret", "credential", "private_key"
    )):
        return True

    return False


def main():
    written = 0
    skipped = 0

    with OUTPUT.open("w", encoding="utf-8") as dump:
        dump.write(f"PROJECT: {ROOT.name}\n")
        dump.write(f"ROOT: {ROOT}\n\n")

        dump.write("=" * 80 + "\nPROJECT FILE TREE\n")
        dump.write("=" * 80 + "\n")

        for current, dirs, files in os.walk(ROOT):
            current_path = Path(current)

            dirs[:] = sorted(
                d for d in dirs
                if d not in EXCLUDED_DIRS
                and not (current_path / d).is_symlink()
            )

            for filename in sorted(files):
                path = current_path / filename

                if path == OUTPUT or path.is_symlink():
                    continue

                if should_skip(path):
                    skipped += 1
                    continue

                try:
                    if path.stat().st_size > MAX_FILE_SIZE:
                        skipped += 1
                        continue
                except OSError:
                    skipped += 1
                    continue

                relative = path.relative_to(ROOT).as_posix()
                dump.write(relative + "\n")

        dump.write("\n" + "=" * 80)
        dump.write("\nSOURCE FILE CONTENTS\n")
        dump.write("=" * 80 + "\n")

        for current, dirs, files in os.walk(ROOT):
            current_path = Path(current)

            dirs[:] = sorted(
                d for d in dirs
                if d not in EXCLUDED_DIRS
                and not (current_path / d).is_symlink()
            )

            for filename in sorted(files):
                path = current_path / filename

                if path == OUTPUT or path.is_symlink():
                    continue

                if should_skip(path):
                    continue

                try:
                    if path.stat().st_size > MAX_FILE_SIZE:
                        continue

                    content = path.read_text(encoding="utf-8")
                except (OSError, UnicodeError):
                    skipped += 1
                    continue

                dump.write(
                    f"\n\n{'=' * 80}\n"
                    f"FILE: {path.relative_to(ROOT).as_posix()}\n"
                    f"{'=' * 80}\n"
                )
                dump.write(content)
                written += 1

    print(f"Dump complete: {OUTPUT}")
    print(f"Files included: {written}")
    print(f"Files skipped: {skipped}")
    print("Review the dump for secrets before sharing it.")


if __name__ == "__main__":
    main()
