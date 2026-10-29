#!/usr/bin/env python3
"""Release the native app locally after its Git push has succeeded."""

import fcntl
import fnmatch
import json
import os
import plistlib
import re
import subprocess
import sys
import tempfile
from datetime import datetime
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
STATE = ROOT / "ios-native/build/local-testflight"
BRANCH = "refs/heads/feature/ios-native-rebuild"
TRACKING = "refs/remotes/origin/feature/ios-native-rebuild"
APP_ID = "cn.zchengb.infohub"
TEAM_ID = "UPDM24DCXU"
HOOKS = ROOT / "ios-native/tool/git-hooks"
WORKFLOW = ".github/workflows/ios-release.yml"


def clean_environment():
    return {key: value for key, value in os.environ.items() if not key.startswith("GIT_")}


def git(*args, check=True):
    return subprocess.run(
        ["git", "-C", str(ROOT), *args],
        env=clean_environment(),
        capture_output=True,
        text=True,
        check=check,
    )


def process_start(pid):
    result = subprocess.run(
        ["ps", "-p", str(pid), "-o", "lstart="], capture_output=True, text=True
    )
    return result.stdout.strip() if result.returncode == 0 else ""


def pending_file(pid):
    return STATE / "pending" / f"{pid}.json"


def github_uploads_on_push(commit):
    result = git("show", f"{commit}:{WORKFLOW}", check=False)
    if result.returncode:
        raise RuntimeError("Cannot read the GitHub TestFlight workflow at the pushed commit")
    match = re.search(r"(?m)^on:[ \t]*(.*)$", result.stdout)
    if not match or match.group(1).split("#", 1)[0].strip():
        raise RuntimeError("Cannot identify the GitHub TestFlight workflow triggers")
    lines = []
    for line in result.stdout[match.end():].splitlines():
        if line and not line[0].isspace() and not line.startswith("#"):
            break
        lines.append(line)
    push = next((i for i, line in enumerate(lines) if re.match(r"^  push\s*:", line)), None)
    if push is None:
        return any(re.match(r"^\s+push\s*:", line) for line in lines)
    block = []
    for line in lines[push:]:
        if block and re.match(r"^  \S", line):
            break
        content = line.split("#", 1)[0].strip()
        if content:
            block.append(content)
    # Fail closed on unfamiliar push filters; only the legacy main branch may
    # trigger this workflow automatically while local native releases are enabled.
    return block != ["push:", "branches:", "- main"]


def installed_hooks_match(commit):
    for relative in ("ios-native/tool/local_testflight.py", "ios-native/tool/git-hooks/pre-push",
                     "ios-native/tool/git-hooks/reference-transaction"):
        committed = git("rev-parse", f"{commit}:{relative}", check=False)
        current = git("hash-object", str(ROOT / relative), check=False)
        if committed.returncode or current.returncode or committed.stdout != current.stdout:
            return False
    return True


def arm_push(remote, lines):
    if remote != "origin":
        return
    for line in lines:
        fields = line.split()
        if len(fields) != 4 or fields[2] != BRANCH or not fields[1].strip("0"):
            continue
        commit = fields[1]
        if not installed_hooks_match(commit):
            print("Local TestFlight: commit the installed release scripts before using them.", file=sys.stderr)
            return
        if github_uploads_on_push(commit):
            print("Local TestFlight: disable the GitHub push trigger in this commit to avoid duplicate uploads.", file=sys.stderr)
            return
        parent = os.getppid()
        started = process_start(parent)
        if not started:
            print("Local TestFlight: could not identify the Git push process.", file=sys.stderr)
            return
        marker = pending_file(parent)
        marker.parent.mkdir(parents=True, exist_ok=True)
        marker.write_text(json.dumps({"commit": commit, "started": started}))
        return


def schedule_release(phase, lines):
    if phase != "committed":
        return
    marker = pending_file(os.getppid())
    try:
        pending = json.loads(marker.read_text())
    except (FileNotFoundError, OSError, ValueError):
        return
    if pending.get("started") != process_start(os.getppid()):
        return
    commit = pending.get("commit")
    for line in lines:
        fields = line.split()
        if len(fields) == 3 and fields[1] == commit and fields[2] == TRACKING:
            marker.unlink(missing_ok=True)
            launch_release(commit)
            return


def launch_release(commit):
    logs = STATE / "logs"
    logs.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    log_path = logs / f"{timestamp}-{commit[:12]}-{os.getpid()}.log"
    with log_path.open("a") as log:
        subprocess.Popen(
            [sys.executable, str(Path(__file__).resolve()), "run", commit],
            cwd=ROOT,
            env=clean_environment(),
            stdin=subprocess.DEVNULL,
            stdout=log,
            stderr=subprocess.STDOUT,
            start_new_session=True,
        )
    print(f"Local TestFlight queued for {commit[:12]}. Log: {log_path}", file=sys.stderr)


def run_command(command):
    print("$ " + " ".join(str(part) for part in command), flush=True)
    subprocess.run(command, cwd=ROOT, env=clean_environment(), check=True, timeout=2700)


def run_contract_tests(source, directory):
    def simulator_list(kind):
        result = subprocess.run(
            ["xcrun", "simctl", "list", kind, "--json"], env=clean_environment(),
            capture_output=True, text=True, check=True, timeout=30,
        )
        return json.loads(result.stdout)

    device_types = simulator_list("devicetypes")["devicetypes"]
    runtimes = simulator_list("runtimes")["runtimes"]
    device = next((item for item in device_types if item["name"] == "iPhone 18 Pro Max"), None)
    runtimes = [item for item in reversed(runtimes)
                if item.get("isAvailable") and item["identifier"].startswith("com.apple.CoreSimulator.SimRuntime.iOS-")]
    if not device or not runtimes:
        raise RuntimeError("An iPhone 18 Pro Max device type and iOS simulator runtime are required")
    for runtime in runtimes:
        created = subprocess.run(
            ["xcrun", "simctl", "create", "InfoHub TestFlight checks", device["identifier"], runtime["identifier"]],
            env=clean_environment(), capture_output=True, text=True, timeout=60,
        )
        if created.returncode == 0:
            break
    else:
        raise RuntimeError(f"Could not create a compatible test simulator: {created.stderr.strip()}")
    simulator = created.stdout.strip()
    try:
        run_command([
            "xcodebuild", "-project", str(source / "ios-native/InfoHub.xcodeproj"),
            "-scheme", "InfoHub", "-destination", f"platform=iOS Simulator,id={simulator}",
            "-derivedDataPath", str(directory / "TestDerivedData"), "-parallel-testing-enabled", "NO",
            "-collect-test-diagnostics", "never", "-only-testing:InfoHubTests",
            "CODE_SIGNING_ALLOWED=NO", "test", "-quiet",
        ])
        print("Contract tests passed.", flush=True)
    finally:
        subprocess.run(["xcrun", "simctl", "delete", simulator], env=clean_environment(), check=True, timeout=60)


def verify_archive(archive):
    app = archive / "Products/Applications/InfoHub.app"
    with (app / "Info.plist").open("rb") as file:
        info = plistlib.load(file)
    if info.get("CFBundleIdentifier") != APP_ID:
        raise RuntimeError("Archive is not the existing InfoHub app")
    print(f"Verified {APP_ID} {info.get('CFBundleShortVersionString')}.", flush=True)


def release(commit, export_only=False):
    if git("cat-file", "-e", f"{commit}^{{commit}}", check=False).returncode:
        raise RuntimeError("The requested commit is not available locally")
    STATE.mkdir(parents=True, exist_ok=True)
    with (STATE / "release.lock").open("a") as lock:
        print("Waiting for other local releases, if any.", flush=True)
        fcntl.flock(lock, fcntl.LOCK_EX)
        completed = STATE / "uploaded"
        if not export_only and (completed / commit).is_file():
            print("This commit was already uploaded; skipping.", flush=True)
            return
        with tempfile.TemporaryDirectory(prefix="run-", dir=STATE) as temp:
            directory = Path(temp)
            source = directory / "source"
            source.mkdir()
            archive_process = subprocess.Popen(
                ["git", "-C", str(ROOT), "archive", "--format=tar", commit, "ios-native"],
                stdout=subprocess.PIPE,
                env=clean_environment(),
            )
            with archive_process.stdout:
                extracted = subprocess.run(["tar", "-xf", "-", "-C", str(source)], stdin=archive_process.stdout)
            archive_status = archive_process.wait()
            if extracted.returncode or archive_status:
                raise RuntimeError("Could not create the committed source snapshot")
            run_contract_tests(source, directory)
            archive = directory / "InfoHub.xcarchive"
            run_command([
                "xcodebuild", "-project", str(source / "ios-native/InfoHub.xcodeproj"),
                "-scheme", "InfoHub", "-configuration", "Release", "-destination", "generic/platform=iOS",
                "-archivePath", str(archive), "-derivedDataPath", str(directory / "DerivedData"),
                "-allowProvisioningUpdates", "-hideShellScriptEnvironment", f"DEVELOPMENT_TEAM={TEAM_ID}",
                "archive", "-quiet",
            ])
            verify_archive(archive)
            options = directory / "ExportOptions.plist"
            with options.open("wb") as file:
                plistlib.dump({
                    "method": "app-store-connect",
                    "destination": "export" if export_only else "upload",
                    "signingStyle": "automatic",
                    "teamID": TEAM_ID,
                    "manageAppVersionAndBuildNumber": not export_only,
                    "uploadSymbols": True,
                }, file)
            run_command([
                "xcodebuild", "-exportArchive", "-archivePath", str(archive),
                "-exportOptionsPlist", str(options), "-exportPath", str(directory / "export"),
                "-allowProvisioningUpdates",
            ])
        if export_only:
            print("Local signed export passed; nothing was uploaded.", flush=True)
        else:
            completed.mkdir(exist_ok=True)
            (completed / commit).write_text(datetime.now().isoformat() + "\n")
            print("Upload completed; check App Store Connect for processing status.", flush=True)


def install():
    configured = git("config", "--get", "core.hooksPath", check=False).stdout.strip()
    if configured:
        if (ROOT / configured).resolve() == HOOKS:
            ensure_tracking_refspec()
            print("Local TestFlight hooks are already installed.")
            return
        raise RuntimeError("A hooksPath is already configured; it was not changed")
    common_hooks = Path(git("rev-parse", "--path-format=absolute", "--git-common-dir").stdout.strip()) / "hooks"
    if common_hooks.is_dir() and any(
        path.is_file() and not path.name.endswith(".sample") and os.access(path, os.X_OK)
        for path in common_hooks.iterdir()
    ):
        raise RuntimeError("Existing Git hooks found; they were not replaced")
    ensure_tracking_refspec()
    current = git("config", "--local", "--get", "extensions.worktreeConfig", check=False).stdout.strip().lower()
    if current not in ("true", "yes", "1", "on"):
        git("config", "--local", "extensions.worktreeConfig", "true")
    git("config", "--worktree", "core.hooksPath", str(HOOKS))
    print(f"Local TestFlight hooks installed for {ROOT}.")


def ensure_tracking_refspec():
    if git("remote", "get-url", "origin", check=False).returncode:
        raise RuntimeError("The origin remote is not configured")
    refs = git("config", "--get-all", "remote.origin.fetch", check=False).stdout.splitlines()
    if any(fnmatch.fnmatchcase(BRANCH, item[1:]) for item in refs if item.startswith("^")):
        raise RuntimeError("The native branch is excluded by an origin fetch refspec")
    for ref in refs:
        source, separator, destination = ref.lstrip("+").partition(":")
        if not separator:
            continue
        if source == BRANCH and destination == TRACKING:
            return
        if source.count("*") == destination.count("*") == 1:
            before, after = source.split("*")
            if BRANCH.startswith(before) and BRANCH.endswith(after):
                matched = BRANCH[len(before):len(BRANCH) - len(after) if after else None]
                if destination.replace("*", matched) == TRACKING:
                    return
    git("config", "--local", "--add", "remote.origin.fetch", f"+{BRANCH}:{TRACKING}")
    print("Added the origin tracking refspec for the native release branch.")


def uninstall():
    configured = git("config", "--worktree", "--get", "core.hooksPath", check=False).stdout.strip()
    if not configured or (ROOT / configured).resolve() != HOOKS:
        raise RuntimeError("The local TestFlight hooks are not installed in this worktree")
    git("config", "--worktree", "--unset", "core.hooksPath")
    print("Local TestFlight hooks removed from this worktree.")


def main():
    action = sys.argv[1] if len(sys.argv) > 1 else ""
    if action == "pre-push":
        arm_push(sys.argv[2], sys.stdin)
    elif action == "reference-transaction":
        schedule_release(sys.argv[2], sys.stdin)
    elif action == "install":
        install()
    elif action == "uninstall":
        uninstall()
    elif action in ("run", "retry", "verify"):
        default = TRACKING if action == "retry" else "HEAD"
        commit = sys.argv[2] if len(sys.argv) > 2 else default
        resolved = git("rev-parse", "--verify", f"{commit}^{{commit}}").stdout.strip()
        if action == "retry" and git("merge-base", "--is-ancestor", resolved, TRACKING, check=False).returncode:
            raise RuntimeError("The commit is not on the pushed native release branch")
        if action == "retry" and github_uploads_on_push(resolved):
            raise RuntimeError("GitHub push releases are enabled for this commit; refusing a duplicate upload")
        release(resolved, export_only=action == "verify")
    elif action == "status":
        logs = sorted((STATE / "logs").glob("*.log"), reverse=True)
        if not logs:
            print("No local TestFlight releases yet.")
        else:
            for path in logs[:5]:
                contents = path.read_text(errors="replace")
                if "Upload completed;" in contents:
                    status = "uploaded; check App Store Connect"
                elif "Local TestFlight failed:" in contents:
                    status = "failed"
                elif "This commit was already uploaded" in contents:
                    status = "already uploaded"
                else:
                    status = "incomplete; check log"
                print(f"{status}: {path}")
    else:
        raise RuntimeError("Usage: local_testflight.py install|uninstall|status|verify [commit]|retry [commit]")


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError, RuntimeError, subprocess.CalledProcessError, subprocess.TimeoutExpired) as error:
        print(f"Local TestFlight failed: {error}", file=sys.stderr)
        if len(sys.argv) > 1 and sys.argv[1] in ("pre-push", "reference-transaction"):
            sys.exit(0)
        sys.exit(1)
