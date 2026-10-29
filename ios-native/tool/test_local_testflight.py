#!/usr/bin/env python3
"""Integration checks for the local Git-triggered TestFlight workflow."""

import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import time
import unittest


TOOL = Path(__file__).resolve().parent


class LocalTestFlightTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="infohub-local-release-test-")
        self.directory = Path(self.temp.name)
        self.repo = self.directory / "repo"
        self.main_repo = self.directory / "main"
        self.remote = self.directory / "remote.git"
        self.bin = self.directory / "bin"
        self.main_repo.mkdir()
        self.bin.mkdir()
        self.env = dict(os.environ, PATH=f"{self.bin}:{os.environ['PATH']}")
        self.env["FAKE_XCODE_RECORD"] = str(self.directory / "xcode.jsonl")
        self.command("git", "init", "--bare", str(self.remote), cwd=self.directory)
        self.command("git", "init", "-b", "main", cwd=self.main_repo)
        self.command("git", "config", "user.name", "Test", cwd=self.main_repo)
        self.command("git", "config", "user.email", "test@example.invalid", cwd=self.main_repo)
        self.command("git", "remote", "add", "origin", str(self.remote), cwd=self.main_repo)
        self.command("git", "config", "remote.origin.fetch", "+refs/heads/main:refs/remotes/origin/main", cwd=self.main_repo)
        tool = self.main_repo / "ios-native/tool"
        tool.mkdir(parents=True)
        shutil.copy(TOOL / "local_testflight.py", tool)
        shutil.copytree(TOOL / "git-hooks", tool / "git-hooks")
        for hook in (tool / "git-hooks").iterdir():
            hook.chmod(0o755)
        (self.main_repo / "ios-native/InfoHub.xcodeproj").mkdir()
        (self.main_repo / "ios-native/InfoHub.xcodeproj/project.pbxproj").write_text("CURRENT_PROJECT_VERSION = 26;\n")
        (self.main_repo / "ios-native/snapshot.txt").write_text("committed\n")
        workflow = self.main_repo / ".github/workflows/ios-release.yml"
        workflow.parent.mkdir(parents=True)
        workflow.write_text("name: TestFlight\non:\n  push:\n    branches:\n      - main\n  workflow_dispatch:\n")
        self.install_fake_xcode()
        self.command("git", "add", "ios-native", ".github", cwd=self.main_repo)
        self.command("git", "commit", "-m", "Initial", cwd=self.main_repo)
        self.command("git", "worktree", "add", "-b", "feature/ios-native-rebuild", str(self.repo), cwd=self.main_repo)
        self.command("python3", str(self.repo / "ios-native/tool/local_testflight.py"), "install", cwd=self.repo)

    def tearDown(self):
        self.temp.cleanup()

    def command(self, *args, cwd, check=True):
        return subprocess.run(args, cwd=cwd, env=self.env, capture_output=True, text=True, check=check)

    def install_fake_xcode(self):
        simulator = self.bin / "xcrun"
        simulator.write_text('''#!/usr/bin/env python3
import json, os, pathlib, sys
args = sys.argv[1:]
if "devicetypes" in args:
    print(json.dumps({"devicetypes": [{"name": "iPhone 18 Pro Max", "identifier": "test-device"}]}))
elif "runtimes" in args:
    runtimes = [{"isAvailable": True, "identifier": "com.apple.CoreSimulator.SimRuntime.iOS-test"}]
    if os.environ.get("FAKE_INCOMPATIBLE_RUNTIME"):
        runtimes.append({"isAvailable": True, "identifier": "com.apple.CoreSimulator.SimRuntime.iOS-incompatible"})
    print(json.dumps({"runtimes": runtimes}))
elif "create" in args:
    if "com.apple.CoreSimulator.SimRuntime.iOS-incompatible" in args:
        sys.exit(147)
    print("test-simulator")
elif "delete" in args:
    pathlib.Path(os.environ["FAKE_XCODE_RECORD"] + ".deleted").write_text("yes")
else:
    sys.exit(1)
''')
        simulator.chmod(0o755)
        executable = self.bin / "xcodebuild"
        executable.write_text('''#!/usr/bin/env python3
import json, os, pathlib, plistlib, sys, time
args = sys.argv[1:]
record = pathlib.Path(os.environ["FAKE_XCODE_RECORD"])
if "test" in args:
    source = pathlib.Path(args[args.index("-project") + 1]).parent
    event = {"action": "test", "snapshot": (source / "snapshot.txt").read_text()}
elif "-exportArchive" in args:
    with open(args[args.index("-exportOptionsPlist") + 1], "rb") as f:
        options = plistlib.load(f)
    event = {"action": "export", "options": options}
else:
    source = pathlib.Path(args[args.index("-project") + 1]).parent
    archive = pathlib.Path(args[args.index("-archivePath") + 1])
    app = archive / "Products/Applications/InfoHub.app"
    app.mkdir(parents=True)
    app_id = "wrong.app" if os.environ.get("FAKE_BAD_ID") else "cn.zchengb.infohub"
    build = next((arg.split("=", 1)[1] for arg in args if arg.startswith("CURRENT_PROJECT_VERSION=")), "26")
    with (app / "Info.plist").open("wb") as f:
        plistlib.dump({"CFBundleIdentifier": app_id, "CFBundleShortVersionString": "1.1.0", "CFBundleVersion": build}, f)
    event = {"action": "archive", "snapshot": (source / "snapshot.txt").read_text(), "build": build}
with record.open("a") as f:
    f.write(json.dumps(event) + "\\n")
if event["action"] == "archive" and os.environ.get("FAKE_XCODE_DELAY"):
    time.sleep(float(os.environ["FAKE_XCODE_DELAY"]))
if event["action"] == "test" and os.environ.get("FAKE_TEST_FAIL"):
    sys.exit(1)
if event["action"] == "export" and os.environ.get("FAKE_EXPORT_FAIL"):
    sys.exit(1)
print("Fake xcodebuild completed")
''')
        executable.chmod(0o755)

    def wait_for_log(self, message, timeout=15):
        logs = self.repo / "ios-native/build/local-testflight/logs"
        deadline = time.monotonic() + timeout
        while time.monotonic() < deadline:
            for path in logs.glob("*.log"):
                if message in path.read_text():
                    return path.read_text()
            time.sleep(0.05)
        self.fail(f"Did not see {message!r} in release logs")

    def events(self):
        path = Path(self.env["FAKE_XCODE_RECORD"])
        return [json.loads(line) for line in path.read_text().splitlines()] if path.exists() else []

    def push(self):
        return self.command("git", "push", "origin", "HEAD:refs/heads/feature/ios-native-rebuild", cwd=self.repo, check=False)

    def test_successful_push_releases_the_committed_snapshot_once(self):
        (self.repo / "ios-native/snapshot.txt").write_text("uncommitted\n")
        result = self.push()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("Local TestFlight queued", result.stderr)
        self.wait_for_log("Upload completed")
        self.assertEqual(self.events()[0], {"action": "test", "snapshot": "committed\n"})
        self.assertEqual(self.events()[1], {"action": "archive", "snapshot": "committed\n", "build": "31"})
        options = self.events()[2]["options"]
        self.assertEqual(options["destination"], "upload")
        self.assertEqual(options["teamID"], "UPDM24DCXU")
        self.assertTrue(options["manageAppVersionAndBuildNumber"])
        self.assertEqual(self.push().returncode, 0)
        time.sleep(0.3)
        self.assertEqual(len(self.events()), 3)

    def test_rejected_push_does_not_release(self):
        hook = self.remote / "hooks/pre-receive"
        hook.write_text("#!/bin/sh\nexit 1\n")
        hook.chmod(0o755)
        self.assertNotEqual(self.push().returncode, 0)
        time.sleep(0.3)
        self.assertEqual(self.events(), [])

    def test_wrong_branch_does_not_release(self):
        result = self.command("git", "push", "origin", "HEAD:refs/heads/other", cwd=self.repo, check=False)
        self.assertEqual(result.returncode, 0, result.stderr)
        time.sleep(0.3)
        self.assertEqual(self.events(), [])

    def test_github_push_trigger_prevents_duplicate_uploads(self):
        workflow = self.repo / ".github/workflows/ios-release.yml"
        workflow.write_text("name: TestFlight\non:\n  push:\n    branches:\n      - main\n      - feature/ios-native-rebuild\n  workflow_dispatch:\n")
        self.command("git", "add", str(workflow), cwd=self.repo)
        self.command("git", "commit", "-m", "Enable duplicate workflow", cwd=self.repo)
        result = self.push()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("disable the GitHub push trigger", result.stderr)
        time.sleep(0.3)
        self.assertEqual(self.events(), [])

    def test_wrong_app_identity_stops_before_upload(self):
        self.env["FAKE_BAD_ID"] = "1"
        self.assertEqual(self.push().returncode, 0)
        self.wait_for_log("Archive is not the existing InfoHub app")
        self.assertEqual([event["action"] for event in self.events()], ["test", "archive"])

    def test_failed_contract_tests_stop_before_archive_and_upload(self):
        self.env["FAKE_TEST_FAIL"] = "1"
        self.assertEqual(self.push().returncode, 0)
        self.wait_for_log("Local TestFlight failed:")
        self.assertEqual([event["action"] for event in self.events()], ["test"])
        self.assertTrue(Path(self.env["FAKE_XCODE_RECORD"] + ".deleted").exists())

    def test_incompatible_latest_runtime_falls_back_to_compatible_runtime(self):
        self.env["FAKE_INCOMPATIBLE_RUNTIME"] = "1"
        self.assertEqual(self.push().returncode, 0)
        self.wait_for_log("Upload completed")
        self.assertEqual([event["action"] for event in self.events()], ["test", "archive", "export"])

    def test_verify_exports_without_uploading(self):
        script = self.repo / "ios-native/tool/local_testflight.py"
        result = self.command("python3", str(script), "verify", cwd=self.repo)
        self.assertIn("nothing was uploaded", result.stdout)
        self.assertEqual(self.events()[2]["options"]["destination"], "export")
        self.assertFalse(self.events()[2]["options"]["manageAppVersionAndBuildNumber"])
        self.assertFalse((self.repo / "ios-native/build/local-testflight/last-build-number").exists())

    def test_can_seed_build_number_after_an_external_release(self):
        script = self.repo / "ios-native/tool/local_testflight.py"
        self.command("python3", str(script), "seed-build-number", "45", cwd=self.repo)
        self.assertEqual(self.push().returncode, 0)
        self.wait_for_log("Upload completed")
        self.assertEqual(self.events()[1]["build"], "46")
        result = self.command("python3", str(script), "seed-build-number", "44", cwd=self.repo, check=False)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("cannot be lower", result.stderr)

    def test_no_verify_does_not_release(self):
        result = self.command("git", "push", "--no-verify", "origin",
                              "HEAD:refs/heads/feature/ios-native-rebuild", cwd=self.repo, check=False)
        self.assertEqual(result.returncode, 0, result.stderr)
        time.sleep(0.3)
        self.assertEqual(self.events(), [])

    def test_uncommitted_release_script_is_not_used(self):
        script = self.repo / "ios-native/tool/local_testflight.py"
        script.write_text(script.read_text() + "\n# local change\n")
        result = self.push()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("commit the installed release scripts", result.stderr)
        time.sleep(0.3)
        self.assertEqual(self.events(), [])

    def test_consecutive_pushes_wait_for_the_first_upload(self):
        self.env["FAKE_XCODE_DELAY"] = "0.7"
        self.assertEqual(self.push().returncode, 0)
        (self.repo / "ios-native/snapshot.txt").write_text("second\n")
        self.command("git", "add", "ios-native/snapshot.txt", cwd=self.repo)
        self.command("git", "commit", "-m", "Second", cwd=self.repo)
        self.assertEqual(self.push().returncode, 0)
        completed = self.repo / "ios-native/build/local-testflight/uploaded"
        deadline = time.monotonic() + 15
        while time.monotonic() < deadline and len(list(completed.glob("*"))) < 2:
            time.sleep(0.05)
        self.assertEqual(len(list(completed.glob("*"))), 2)
        self.assertEqual([event["action"] for event in self.events()], ["test", "archive", "export", "test", "archive", "export"])
        self.assertEqual([event["snapshot"] for event in self.events() if event["action"] == "archive"], ["committed\n", "second\n"])
        self.assertEqual([event["build"] for event in self.events() if event["action"] == "archive"], ["31", "32"])

    def test_failed_upload_can_be_retried(self):
        self.env["FAKE_EXPORT_FAIL"] = "1"
        self.assertEqual(self.push().returncode, 0)
        self.wait_for_log("Local TestFlight failed:")
        self.env.pop("FAKE_EXPORT_FAIL")
        script = self.repo / "ios-native/tool/local_testflight.py"
        result = self.command("python3", str(script), "retry", cwd=self.repo)
        self.assertIn("Upload completed", result.stdout)
        self.assertEqual([event["action"] for event in self.events()], ["test", "archive", "export", "test", "archive", "export"])
        self.command("python3", str(script), "retry", cwd=self.repo)
        self.assertEqual(len(self.events()), 6)

    def test_retry_rejects_an_unpushed_commit(self):
        self.assertEqual(self.push().returncode, 0)
        self.wait_for_log("Upload completed")
        (self.repo / "ios-native/snapshot.txt").write_text("not pushed\n")
        self.command("git", "add", "ios-native/snapshot.txt", cwd=self.repo)
        self.command("git", "commit", "-m", "Not pushed", cwd=self.repo)
        script = self.repo / "ios-native/tool/local_testflight.py"
        result = self.command("python3", str(script), "retry", "HEAD", cwd=self.repo, check=False)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("not on the pushed native release branch", result.stderr)
        self.assertEqual(len(self.events()), 3)

    def test_installer_preserves_other_worktree_configuration(self):
        result = self.command("git", "config", "--get", "core.hooksPath", cwd=self.main_repo, check=False)
        self.assertEqual(result.returncode, 1)
        fetch = self.command("git", "config", "--get-all", "remote.origin.fetch", cwd=self.main_repo).stdout.splitlines()
        self.assertEqual(fetch, ["+refs/heads/main:refs/remotes/origin/main",
                                 "+refs/heads/feature/ios-native-rebuild:refs/remotes/origin/feature/ios-native-rebuild"])

    def test_installer_rejects_a_negative_refspec(self):
        script = self.repo / "ios-native/tool/local_testflight.py"
        self.command("python3", str(script), "uninstall", cwd=self.repo)
        self.command("git", "config", "--add", "remote.origin.fetch", "^refs/heads/feature/*", cwd=self.repo)
        result = self.command("python3", str(script), "install", cwd=self.repo, check=False)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("excluded by an origin fetch refspec", result.stderr)
        hooks = self.command("git", "config", "--get", "core.hooksPath", cwd=self.repo, check=False)
        self.assertEqual(hooks.returncode, 1)

    def test_installer_does_not_replace_existing_hooks(self):
        script = self.repo / "ios-native/tool/local_testflight.py"
        self.command("python3", str(script), "uninstall", cwd=self.repo)
        self.command("git", "config", "--worktree", "core.hooksPath", "custom-hooks", cwd=self.repo)
        result = self.command("python3", str(script), "install", cwd=self.repo, check=False)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("already configured", result.stderr)
        self.assertEqual(self.command("git", "config", "--get", "core.hooksPath", cwd=self.repo).stdout.strip(), "custom-hooks")


if __name__ == "__main__":
    unittest.main()
