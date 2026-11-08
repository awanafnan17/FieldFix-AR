#!/usr/bin/env python3
"""
Empirical Hash Collision & Stream Integrity Verification Harness for Milestone 2
Challenger: challenger_m2_1 (Hash Collision Challenger)
Target: devpost/_video_build/V6_RAW_CLIPS_MANIFEST.json and all candidate V6 clips
"""

import os
import sys
import json
import hashlib
import subprocess

WORKSPACE = "/Users/afnanawan/Downloads/Hackathon/FieldFix-AR"
DEVPOST = os.path.join(WORKSPACE, "devpost")
VIDEO_BUILD = os.path.join(DEVPOST, "_video_build")
MANIFEST_PATH = os.path.join(VIDEO_BUILD, "V6_RAW_CLIPS_MANIFEST.json")

BANNED_EXPLICIT = {
    "clean_v5_take5.mp4": "8c65fe7dfe6e8d6458931f612f8df2a739f910aeedf82eeff696822726388659",
    "clean_v5_take2.mp4": "7ecf5145fb54555e747baed43c1e241c9a5e379a955aa83200efd31688403eac",
    "FieldFix-AR-Demo-V5-TraceTheFault.mp4": "5811fe2d0f02550bdbce61136692b5ee992b37b964efeca541354909b1ed597b",
    "FieldFix-AR-Demo-V6-JudgesEdition.mp4": "06f82c1668ad48b55a59a78a7af15fc19eab076761ee79bfa9b66fb32d1d84cc"
}

def calc_sha256_and_size(filepath):
    if not os.path.exists(filepath):
        return None, None, -1
    hasher = hashlib.sha256()
    size = 0
    with open(filepath, "rb") as f:
        while chunk := f.read(1024 * 1024):
            hasher.update(chunk)
            size += len(chunk)
    return hasher.hexdigest(), size

def probe_stream(filepath):
    cmd = [
        "ffprobe", "-v", "error",
        "-select_streams", "v:0",
        "-show_entries", "stream=codec_name,pix_fmt,width,height,r_frame_rate,nb_frames,duration",
        "-show_entries", "format=duration,size",
        "-of", "json",
        filepath
    ]
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if res.returncode != 0:
        return None, res.stderr
    try:
        data = json.loads(res.stdout)
        return data, None
    except Exception as e:
        return None, str(e)

def decode_check(filepath):
    # Decode entire stream with ffmpeg to detect truncated frames or corruption
    cmd = ["ffmpeg", "-v", "error", "-i", filepath, "-f", "null", "-"]
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    return res.returncode, res.stderr.strip()

def run_challenge():
    print("=" * 80)
    print("STARTING EMPIRICAL HASH COLLISION & INTEGRITY HARNESS (challenger_m2_1)")
    print("=" * 80)

    # 1. Load Manifest
    if not os.path.exists(MANIFEST_PATH):
        print(f"FAIL: Manifest not found at {MANIFEST_PATH}")
        sys.exit(1)
    
    with open(MANIFEST_PATH, "r") as f:
        manifest = json.load(f)

    manifest_clips = manifest.get("clips", [])
    print(f"Loaded manifest with {len(manifest_clips)} clips cataloged.")

    # 2. Gather All Legacy Video Files in devpost and devpost/_video_build
    legacy_hashes = {}
    
    # Check explicit banned files first
    for name, expected_hash in BANNED_EXPLICIT.items():
        found = False
        for root in [DEVPOST, VIDEO_BUILD]:
            p = os.path.join(root, name)
            if os.path.exists(p):
                actual_hash, sz = calc_sha256_and_size(p)
                legacy_hashes[actual_hash] = f"EXPLICIT_BANNED:{name} ({p})"
                found = True
        if not found:
            # Still record expected hash
            legacy_hashes[expected_hash] = f"EXPLICIT_BANNED_OFFLINE:{name}"

    # Also crawl all legacy files in _video_build (v5, v4, v3, v2, v1 legacy takes)
    for root, dirs, files in os.walk(DEVPOST):
        for f in files:
            if not f.endswith((".mp4", ".mov", ".m4v", ".avi", ".mkv")):
                continue
            # If it's one of the 11 new V6 clips, skip collecting as legacy
            if f in [c["file_name"] for c in manifest_clips]:
                continue
            # If it's a legacy or old clip
            full_path = os.path.join(root, f)
            h, sz = calc_sha256_and_size(full_path)
            if h:
                rel = os.path.relpath(full_path, DEVPOST)
                legacy_hashes[h] = f"LEGACY_FILE:{rel}"

    print(f"Compiled legacy banned hash database: {len(legacy_hashes)} unique video hashes found.")

    # 3. Test each V6 clip
    results = []
    v6_hashes_seen = {}
    failures = []

    for idx, c in enumerate(manifest_clips, 1):
        cid = c.get("clip_id")
        fname = c.get("file_name")
        abs_path = c.get("absolute_path")
        claimed_sha256 = c.get("sha256")
        claimed_size = c.get("file_size_bytes")
        claimed_w = c.get("width")
        claimed_h = c.get("height")
        claimed_dur = c.get("duration_sec")

        print(f"\n[{idx}/{len(manifest_clips)}] Testing clip: {cid} ({fname})")
        print(f"  Path: {abs_path}")

        # Check existence
        if not os.path.exists(abs_path):
            msg = f"CLIP MISSING ON DISK: {abs_path}"
            print(f"  FAIL: {msg}")
            failures.append(msg)
            continue

        # Check size > 0
        actual_hash, actual_size = calc_sha256_and_size(abs_path)
        print(f"  Disk Size: {actual_size:,} bytes | Claimed: {claimed_size:,} bytes")
        if actual_size <= 0:
            msg = f"ZERO-BYTE CLIP: {fname} has size {actual_size}"
            print(f"  FAIL: {msg}")
            failures.append(msg)

        if actual_size != claimed_size:
            msg = f"SIZE MISMATCH: {fname} disk size {actual_size} != manifest claimed {claimed_size}"
            print(f"  FAIL: {msg}")
            failures.append(msg)

        # Check Hash
        print(f"  Disk SHA-256: {actual_hash}")
        print(f"  Claimed SHA:  {claimed_sha256}")
        if actual_hash.lower() != claimed_sha256.lower():
            msg = f"HASH MISMATCH on {fname}: disk {actual_hash} != manifest {claimed_sha256}"
            print(f"  FAIL: {msg}")
            failures.append(msg)

        # Check Collision against Banned Legacy
        if actual_hash in legacy_hashes:
            collided_with = legacy_hashes[actual_hash]
            msg = f"COLLISION DETECTED! {fname} ({actual_hash}) matches legacy file: {collided_with}"
            print(f"  CRITICAL FAIL: {msg}")
            failures.append(msg)
        else:
            print("  Legacy Collision Check: PASS (0 collisions with legacy database)")

        # Check Duplicate among V6 clips
        if actual_hash in v6_hashes_seen:
            msg = f"INTERNAL DUPLICATE! {fname} has exact same hash as {v6_hashes_seen[actual_hash]}"
            print(f"  CRITICAL FAIL: {msg}")
            failures.append(msg)
        else:
            v6_hashes_seen[actual_hash] = fname

        # Probe container stream
        probe_data, probe_err = probe_stream(abs_path)
        if probe_err or not probe_data:
            msg = f"FFPROBE ERROR on {fname}: {probe_err}"
            print(f"  FAIL: {msg}")
            failures.append(msg)
            continue

        streams = probe_data.get("streams", [])
        format_info = probe_data.get("format", {})
        if not streams:
            msg = f"NO VIDEO STREAM FOUND in {fname}"
            print(f"  FAIL: {msg}")
            failures.append(msg)
            continue

        vstream = streams[0]
        actual_w = vstream.get("width")
        actual_h = vstream.get("height")
        actual_codec = vstream.get("codec_name")
        actual_dur = float(format_info.get("duration", 0))

        print(f"  Stream probe: codec={actual_codec}, {actual_w}x{actual_h}, dur={actual_dur:.2f}s")
        if actual_w != claimed_w or actual_h != claimed_h:
            msg = f"DIMENSION MISMATCH on {fname}: {actual_w}x{actual_h} != claimed {claimed_w}x{claimed_h}"
            print(f"  FAIL: {msg}")
            failures.append(msg)

        # Decode full file to check for truncation or corrupt frames
        decode_rc, decode_stderr = decode_check(abs_path)
        if decode_rc != 0 or decode_stderr:
            msg = f"DECODE ERROR/CORRUPTION on {fname}: rc={decode_rc}, stderr={decode_stderr}"
            print(f"  FAIL: {msg}")
            failures.append(msg)
        else:
            print("  Stream Decode & Non-truncation: PASS (0 decode errors, stream cleanly terminated)")

        results.append({
            "clip_id": cid,
            "file_name": fname,
            "actual_size": actual_size,
            "actual_hash": actual_hash,
            "probe_codec": actual_codec,
            "probe_resolution": f"{actual_w}x{actual_h}",
            "probe_duration": actual_dur,
            "status": "PASS"
        })

    print("\n" + "=" * 80)
    print("CHALLENGE SUMMARY")
    print("=" * 80)
    print(f"Total clips tested: {len(manifest_clips)}")
    print(f"Unique V6 hashes:   {len(v6_hashes_seen)}")
    print(f"Failures / Defects: {len(failures)}")

    if failures:
        print("\nFAILURES LIST:")
        for f in failures:
            print(f" - {f}")
        print("\nFINAL VERDICT: REFUTED")
        return False, results, failures
    else:
        print("\nALL CHECKS PASSED: 100% NOVEL, NON-ZERO, NON-TRUNCATED, COLLISION-FREE.")
        print("\nFINAL VERDICT: CONFIRMED")
        return True, results, failures

if __name__ == "__main__":
    success, results, failures = run_challenge()
    sys.exit(0 if success else 1)
