#!/usr/bin/env python3
"""Patch Expo-generated android/app/build.gradle for release signing via env vars."""

from pathlib import Path
import re
import sys

path = Path("frontend/android/app/build.gradle")
if not path.exists():
    sys.exit(f"Missing {path}")

text = path.read_text()

# Use System.getenv so passwords with special chars (e.g. @) are not mangled by gradle.properties
release_signing = """
        release {
            storeFile file('release.keystore')
            storePassword System.getenv('ANDROID_KEYSTORE_PASSWORD')
            keyAlias System.getenv('ANDROID_KEY_ALIAS')
            keyPassword System.getenv('ANDROID_KEY_PASSWORD')
        }
"""

if "System.getenv('ANDROID_KEYSTORE_PASSWORD')" not in text:
    needle = "signingConfigs {\n        debug {"
    if needle not in text:
        sys.exit("Could not find signingConfigs.debug block to patch")
    text = text.replace(
        needle,
        "signingConfigs {\n" + release_signing + "        debug {",
        1,
    )

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
print("Release signing configured (env-based)")
