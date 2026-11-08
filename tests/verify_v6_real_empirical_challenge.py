#!/usr/bin/env python3
"""
Empirical Hash Collision & Stream Decode Integrity Verification Harness for Milestone 3
Challenger: Challenger M3.2 (Hash Collision & Decode Integrity Challenger)
Target: FieldFix-AR/devpost/FieldFix-AR-Demo-V6-JudgesEdition-REAL.mp4
"""

import os
import sys
import json
import hashlib
import subprocess

WORKSPACE = "/Users/afnanawan/Downloads/Hackathon/FieldFix-AR"
DEVPOST = os.path.join(WORKSPACE, "devpost")
TARGET = os.path.join(DEVPOST, "FieldFix-AR-Demo-V6-JudgesEdition-REAL.mp4")
HACKATHON_ROOT = "/Users/afnanawan/Downloads/Hackathon"

BANNED_EXPLICIT = {
    "V5-Submitted": ("FieldFix-AR-Demo-V5-TraceTheFault.mp4", "5811fe2d0f02550bdbce61136692b5ee992b37b964efeca541354909b1ed597b"),
    "V6-Rejected": ("FieldFix-AR-Demo-V6-JudgesEdition.mp4", "06f82c1668ad48b55a59a78a7af15fc19eab076761ee79bfa9b66fb32d1d84cc"),
    "V5-Clean-Take5": ("clean_v5_take5.mp4", "8c65fe7dfe6e8d6458931f612f8df2a739f910aeedf82eeff696822726388659"),
    "V5-Clean-Take2": ("clean_v5_take2.mp4", "7ecf5145fb54555e747baed43c1e241c9a5e379a955aa83200efd31688403eac")
}

def calc_sha256_and_size(path):
    if not os.path.exists(path):
        return None, -1
    h = hashlib.sha256()
    sz = 0
    with open(path, "rb") as f:
        while chunk := f.read(1024 * 1024):
            h.update(chunk)
            sz += len(chunk)
    return h.hexdigest(), sz

def run_empirical_challenge():
    print("=" * 80)
    print("CHALLENGER M3.2: EMPIRICAL HASH COLLISION & DECODE INTEGRITY VERIFICATION")
    print("=" * 80)

    failures = []

    # 1. Physical existence and file size
    if not os.path.exists(TARGET):
        print(f"CRITICAL FAIL: Target not found at {TARGET}")
        sys.exit(1)

    target_hash, target_size = calc_sha256_and_size(TARGET)
    print(f"Target Artifact:  {TARGET}")
    print(f"Target File Size: {target_size:,} bytes ({target_size / (1024*1024):.2f} MB)")
    print(f"Target SHA-256:   {target_hash}")

    if target_size <= 0:
        failures.append("Target file is empty (0 bytes)")

    # 2. Probe format with ffprobe
    print("\n--- [TEST 1] FFPROBE FORMAT & STREAM METRICS ---")
    probe_cmd = [
        "ffprobe", "-v", "error",
        "-show_format", "-show_streams",
        "-of", "json",
        TARGET
    ]
    res = subprocess.run(probe_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if res.returncode != 0:
        failures.append(f"ffprobe failed: {res.stderr}")
        probe_data = {}
    else:
        probe_data = json.loads(res.stdout)

    fmt = probe_data.get("format", {})
    streams = probe_data.get("streams", [])

    duration_str = fmt.get("duration", "0")
    duration = float(duration_str)
    print(f"Format Duration:  {duration:.6f}s (Claimed: 120.000000s)")
    if abs(duration - 120.0) > 1e-4:
        failures.append(f"Duration is {duration}s, expected exactly 120.000000s")

    v_stream = next((s for s in streams if s.get("codec_type") == "video"), None)
    a_stream = next((s for s in streams if s.get("codec_type") == "audio"), None)

    if not v_stream:
        failures.append("No video stream found")
    else:
        width = v_stream.get("width")
        height = v_stream.get("height")
        v_codec = v_stream.get("codec_name")
        v_dur = float(v_stream.get("duration", 0))
        r_fps = v_stream.get("r_frame_rate")
        avg_fps = v_stream.get("avg_frame_rate")
        v_nb_frames = v_stream.get("nb_frames")

        print(f"Video Codec:      {v_codec} ({v_stream.get('profile', '')})")
        print(f"Video Resolution: {width}x{height} (Expected: 1920x1080)")
        print(f"Video Frame Rate: r={r_fps}, avg={avg_fps} (Expected: 30/1)")
        print(f"Video Stream Dur: {v_dur:.6f}s")
        print(f"Stream Header nb: {v_nb_frames} frames (Expected: 3600)")

        if width != 1920 or height != 1080:
            failures.append(f"Resolution mismatch: {width}x{height} != 1920x1080")
        if r_fps != "30/1" or avg_fps != "30/1":
            failures.append(f"Frame rate mismatch: r={r_fps}, avg={avg_fps} != 30/1")
        if abs(v_dur - 120.0) > 1e-4:
            failures.append(f"Video stream duration mismatch: {v_dur} != 120.0")

    if not a_stream:
        failures.append("No audio stream found")
    else:
        a_codec = a_stream.get("codec_name")
        sample_rate = a_stream.get("sample_rate")
        channels = a_stream.get("channels")
        a_dur = float(a_stream.get("duration", 0))
        print(f"Audio Codec:      {a_codec}, {sample_rate} Hz, channels={channels}")
        print(f"Audio Stream Dur: {a_dur:.6f}s")
        if a_codec != "aac" or sample_rate != "44100" or channels != 2:
            failures.append(f"Audio spec mismatch: {a_codec}, {sample_rate}Hz, channels={channels}")
        if abs(a_dur - 120.0) > 1e-4:
            failures.append(f"Audio stream duration mismatch: {a_dur} != 120.0")

    # 3. Exact Frame Count and Read Test
    print("\n--- [TEST 2] EXACT FRAME COUNT VIA FFPROBE -COUNT_FRAMES ---")
    frame_cmd = [
        "ffprobe", "-v", "error",
        "-count_frames",
        "-select_streams", "v:0",
        "-show_entries", "stream=nb_read_frames",
        "-of", "default=nokey=1:noprint_wrappers=1",
        TARGET
    ]
    res_frames = subprocess.run(frame_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    nb_read = res_frames.stdout.strip()
    print(f"Total Decoded Video Frames Read: {nb_read} (Expected: 3600)")
    if nb_read != "3600":
        failures.append(f"Exact frame count read: {nb_read} != 3600")

    # 4. ffmpeg Full Bitstream Decode Null Test
    print("\n--- [TEST 3] FFMPEG FULL BITSTREAM DECODE (NULL SINK) ---")
    decode_cmd = [
        "ffmpeg", "-v", "error",
        "-i", TARGET,
        "-f", "null", "-"
    ]
    res_dec = subprocess.run(decode_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    print(f"ffmpeg exit code: {res_dec.returncode}")
    if res_dec.returncode != 0 or res_dec.stderr.strip():
        msg = f"Decode error encountered: exit {res_dec.returncode}, stderr: {res_dec.stderr.strip()}"
        print(f"FAIL: {msg}")
        failures.append(msg)
    else:
        print("PASS: 0 decode errors encountered across all 3,600 frames.")

    # 5. Cross-reference SHA-256 against all legacy video files
    print("\n--- [TEST 4] SHA-256 COLLISION CROSS-REFERENCE ---")
    exts = {".mp4", ".mov", ".mkv", ".webm", ".avi", ".m4v"}
    all_videos = []
    for dirpath, dirnames, filenames in os.walk(HACKATHON_ROOT):
        for f in filenames:
            if os.path.splitext(f)[1].lower() in exts:
                all_videos.append(os.path.join(dirpath, f))

    # Banned files verification
    print("Checking explicit banned files:")
    for label, (fname, banned_hash) in BANNED_EXPLICIT.items():
        if target_hash.lower() == banned_hash.lower():
            msg = f"CRITICAL COLLISION: Target SHA matches banned {label} ({banned_hash})!"
            print(f"  FAIL: {msg}")
            failures.append(msg)
        else:
            print(f"  [OK] Target SHA differs from {label} ({fname}): {banned_hash[:16]}...")

    # Check against all legacy files
    # Exclude target itself and the temporary mux file FieldFix-AR-Demo-v6-fresh.mp4 which was copied to target
    legacy_files = [
        p for p in all_videos
        if os.path.abspath(p) != os.path.abspath(TARGET)
        and os.path.basename(p) != "FieldFix-AR-Demo-v6-fresh.mp4"
    ]
    print(f"\nScanning {len(legacy_files)} legacy video files across entire workspace...")
    collisions = []
    for p in legacy_files:
        h, sz = calc_sha256_and_size(p)
        if h == target_hash:
            rel = os.path.relpath(p, HACKATHON_ROOT)
            collisions.append((rel, h))

    if collisions:
        for rel, h in collisions:
            msg = f"COLLISION DETECTED with legacy file: {rel} (SHA: {h})"
            print(f"  FAIL: {msg}")
            failures.append(msg)
    else:
        print(f"PASS: 0 hash collisions detected across all {len(legacy_files)} legacy video files.")

    # 6. Verify Immutability of Protected Deliverables
    print("\n--- [TEST 5] IMMUTABILITY OF PROTECTED DELIVERABLES ---")
    v5_path = os.path.join(DEVPOST, "FieldFix-AR-Demo-V5-TraceTheFault.mp4")
    v6_rej_path = os.path.join(DEVPOST, "FieldFix-AR-Demo-V6-JudgesEdition.mp4")

    v5_hash, _ = calc_sha256_and_size(v5_path)
    v6_rej_hash, _ = calc_sha256_and_size(v6_rej_path)

    expected_v5 = BANNED_EXPLICIT["V5-Submitted"][1]
    expected_v6_rej = BANNED_EXPLICIT["V6-Rejected"][1]

    print(f"V5 Submitted Demo: {v5_hash}")
    print(f"Expected:          {expected_v5}")
    if v5_hash != expected_v5:
        failures.append(f"Protected V5 demo was mutated! Hash: {v5_hash}")
    else:
        print("PASS: V5 demo is 100% byte-for-byte immutable.")

    print(f"V6 Rejected Demo:  {v6_rej_hash}")
    print(f"Expected:          {expected_v6_rej}")
    if v6_rej_hash != expected_v6_rej:
        failures.append(f"Protected rejected V6 demo was mutated! Hash: {v6_rej_hash}")
    else:
        print("PASS: V6 rejected demo is 100% byte-for-byte immutable.")

    # Final Verdict
    print("\n" + "=" * 80)
    print("CHALLENGER M3.2 FINAL EVALUATION")
    print("=" * 80)
    if failures:
        print(f"VERDICT: REJECT ({len(failures)} defects identified)")
        for f in failures:
            print(f" - {f}")
        return False
    else:
        print("VERDICT: CONFIRM_CORRECTNESS")
        print("All empirical tests PASSED:")
        print(" 1. Exactly 3,600 frames decoded with 0 errors via ffmpeg -v error -f null -")
        print(" 2. Exact duration: 120.000000s, resolution: 1920x1080 @ 30fps")
        print(f" 3. Exactly 0 hash collisions against {len(legacy_files)} legacy video files")
        print(" 4. Immutable protection of legacy V5 and rejected V6 confirmed")
        return True

if __name__ == "__main__":
    success = run_empirical_challenge()
    sys.exit(0 if success else 1)
