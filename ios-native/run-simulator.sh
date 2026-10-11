#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"
simulator_device="${1:-iPhone 18 Pro Max}"
derived_data="$PWD/build/simulator"

xcrun simctl bootstatus "$simulator_device" -b
xcodebuild -quiet \
  -project InfoHub.xcodeproj -scheme InfoHub -configuration Debug \
  -destination "platform=iOS Simulator,name=$simulator_device" \
  -derivedDataPath "$derived_data" CODE_SIGNING_ALLOWED=NO build

xcode_developer_dir="$(xcode-select -p)"
simulator_app="$xcode_developer_dir/../Applications/DeviceHub.app"
if [[ ! -d "$simulator_app" ]]; then
  simulator_app="$xcode_developer_dir/Applications/Simulator.app"
fi
open "$simulator_app"
xcrun simctl install "$simulator_device" "$derived_data/Build/Products/Debug-iphonesimulator/InfoHub.app"
xcrun simctl launch --terminate-running-process "$simulator_device" cn.zchengb.infohub.native
