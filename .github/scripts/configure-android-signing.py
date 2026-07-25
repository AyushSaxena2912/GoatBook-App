#!/usr/bin/env python3
"""Patch Expo-generated android/app/build.gradle for release signing."""

from pathlib import Path
import re
import sys

path = Path("frontend/android/app/build.gradle")
if not path.exists():
    sys.exit(f"Missing {path}")

text = path.read_text()

release_signing = """
        release {
            if (project.hasProperty('GOATBOOK_UPLOAD_STORE_FILE')) {
                storeFile file(GOATBOOK_UPLOAD_STORE_FILE)
                storePassword GOATBOOK_UPLOAD_STORE_PASSWORD
                keyAlias GOATBOOK_UPLOAD_KEY_ALIAS
                keyPassword GOATBOOK_UPLOAD_KEY_PASSWORD
            }
        }
"""

if "GOATBOOK_UPLOAD_STORE_FILE" not in text:
    needle = "signingConfigs {\n        debug {"
    if needle not in text:
        sys.exit("Could not find signingConfigs.debug block to patch")
    text = text.replace(
        needle,
        "signingConfigs {\n" + release_signing + "        debug {",
        1,
    )

# Prefer precise replacement inside the release buildType
old = "signingConfig signingConfigs.debug\n            def enableShrinkResources"
new = "signingConfig signingConfigs.release\n            def enableShrinkResources"
if old in text:
    text = text.replace(old, new, 1)
else:
    text2, n = re.subn(
        r"(release\s*\{[\s\S]*?)signingConfig signingConfigs\.debug",
        r"\1signingConfig signingConfigs.release",
        text,
        count=1,
    )
    if n == 0:
        sys.exit("Could not switch release signingConfig to release")
    text = text2

path.write_text(text)
print("Release signing configured")
