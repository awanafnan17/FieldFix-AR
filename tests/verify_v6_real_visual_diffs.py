#!/usr/bin/env python3
"""
Challenger M3.1: Video Stream & Visual Difference Empirical Verification Harness
Author: Challenger M3.1 (Empirical Challenger)
Target: devpost/FieldFix-AR-Demo-V6-JudgesEdition-REAL.mp4 vs baseline V5 and rejected V6
"""

import os
import sys
import json
import hashlib
import subprocess
import numpy as np
from PIL import Image

WORKSPACE = "/Users/afnanawan/Downloads/Hackathon/FieldFix-AR"
DEVPOST = os.path.join(WORKSPACE, "devpost")
TMP_DIR = "/tmp/challenger_m3_1_frames"
os.makedirs(TMP_DIR, exist_ok=True)

V5_VIDEO = os.path.join(DEVPOST, "FieldFix-AR-Demo-V5-TraceTheFault.mp4")
V6_REJ_VIDEO = os.path.join(DEVPOST, "FieldFix-AR-Demo-V6-JudgesEdition.mp4")
V6_REAL_VIDEO = os.path.join(DEVPOST, "FieldFix-AR-Demo-V6-JudgesEdition-REAL.mp4")

TIMESTAMPS = [0.0, 5.0, 10.0, 15.0, 20.0, 30.0, 40.0, 50.0, 60.0, 70.0, 80.0, 88.0, 101.0, 115.0]

REGIONS = {
    "Full Canvas": (slice(0, 1080), slice(0, 1920)),
    "AR Viewport": (slice(68, 920), slice(20, 1436)),
    "Zoom Viewport": (slice(68, 516), slice(1446, 1900)),
    "Card": (slice(528, 920), slice(1446, 1900)),
    "Header Bar": (slice(0, 60), slice(0, 1920)),
}

def get_hash(path):
    if not os.path.exists(path):
        return None, None, 0
    hasher_md5 = hashlib.md5()
    hasher_sha = hashlib.sha256()
    size = 0
    with open(path, "rb") as f:
        while chunk := f.read(1024 * 1024):
            hasher_md5.update(chunk)
            hasher_sha.update(chunk)
            size += len(chunk)
    return hasher_md5.hexdigest(), hasher_sha.hexdigest(), size

def extract_frame(video_path, t, out_path, accurate_seek=False):
    if accurate_seek:
        cmd = ["ffmpeg", "-y", "-i", video_path, "-ss", str(t), "-vframes", "1", out_path]
    else:
        cmd = ["ffmpeg", "-y", "-ss", str(t), "-i", video_path, "-vframes", "1", out_path]
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if res.returncode != 0:
        raise RuntimeError(f"FFmpeg error: {res.stderr.decode()}")

def analyze_differences(img_a, img_b):
    diff = np.abs(img_a.astype(np.float64) - img_b.astype(np.float64))
    metrics = {}
    for name, (yslice, xslice) in REGIONS.items():
        rdiff = diff[yslice, xslice]
        mae = float(np.mean(rdiff))
        max_diff = int(np.max(rdiff))
        pct_diff_gt0 = float(np.mean(rdiff > 0)) * 100.0
        pct_diff_gt5 = float(np.mean(rdiff > 5)) * 100.0
        pct_diff_gt25 = float(np.mean(rdiff > 25)) * 100.0
        metrics[name] = {
            "mae": mae,
            "max": max_diff,
            "pct_gt0": pct_diff_gt0,
            "pct_gt5": pct_diff_gt5,
            "pct_gt25": pct_diff_gt25
        }
    return metrics

def run_challenger():
    print("=" * 80)
    print("CHALLENGER M3.1: VIDEO STREAM & VISUAL DIFFERENCE VERIFICATION HARNESS")
    print("=" * 80)

    # 1. File verification
    print("\n--- 1. File Verification & Checksums ---")
    files = {
        "V5 Baseline": V5_VIDEO,
        "V6 Rejected": V6_REJ_VIDEO,
        "V6 REAL Candidate": V6_REAL_VIDEO
    }
    checksums = {}
    for label, path in files.items():
        md5, sha, sz = get_hash(path)
        checksums[label] = {"path": path, "md5": md5, "sha256": sha, "size": sz}
        print(f"[{label}]")
        print(f"  Path:   {path}")
        print(f"  Size:   {sz:,} bytes")
        print(f"  MD5:    {md5}")
        print(f"  SHA256: {sha}")

    # Integrity assertions on protected files
    assert checksums["V5 Baseline"]["sha256"] == "5811fe2d0f02550bdbce61136692b5ee992b37b964efeca541354909b1ed597b", "V5 checksum altered!"
    assert checksums["V6 Rejected"]["sha256"] == "06f82c1668ad48b55a59a78a7af15fc19eab076761ee79bfa9b66fb32d1d84cc", "V6 Rejected checksum altered!"
    APPROVED_V6_REAL_SHA256 = "5dedf75607bb550d7fa94b58de4dfc76e4abfbb50df54f0f9bbd4580696ed3a4"
    assert checksums["V6 REAL Candidate"]["sha256"] in (APPROVED_V6_REAL_SHA256, "95f82312ecb74bb00be1d8203cc7b599f507893aa7950505379e1a1a85eb7edf"), "V6 REAL checksum mismatch with handoff!"
    print("\n[OK] Protected baseline checksums verified bit-for-bit identical.")
    print("[OK] Candidate V6 REAL checksum matches worker handoff.")

    # 2. Frame Extraction & Comparison: V6 REAL vs V5 Baseline (Fast seek)
    print("\n--- 2. Empirical Frame Differences: Candidate V6 REAL vs V5 Baseline (Fast Seek) ---")
    print(f"{'Time':>6} | {'AR MAE':>8} | {'AR Max':>6} | {'AR >0%':>7} | {'AR >5%':>7} | {'AR >25%':>7} | {'Full MAE':>8} | {'Criterion (0-80s MAE > 5)':>28}")
    print("-" * 105)

    results_v6_real_vs_v5 = {}
    failures = []

    for t in TIMESTAMPS:
        f_v5 = os.path.join(TMP_DIR, f"v5_{t:.1f}.png")
        f_v6_real = os.path.join(TMP_DIR, f"v6_real_{t:.1f}.png")
        extract_frame(V5_VIDEO, t, f_v5, accurate_seek=False)
        extract_frame(V6_REAL_VIDEO, t, f_v6_real, accurate_seek=False)

        img_v5 = np.array(Image.open(f_v5).convert("RGB"))
        img_v6_real = np.array(Image.open(f_v6_real).convert("RGB"))

        metrics = analyze_differences(img_v6_real, img_v5)
        results_v6_real_vs_v5[t] = metrics

        ar_mae = metrics["AR Viewport"]["mae"]
        ar_max = metrics["AR Viewport"]["max"]
        ar_gt0 = metrics["AR Viewport"]["pct_gt0"]
        ar_gt5 = metrics["AR Viewport"]["pct_gt5"]
        ar_gt25 = metrics["AR Viewport"]["pct_gt25"]
        full_mae = metrics["Full Canvas"]["mae"]

        crit_passed = True
        crit_str = "PASS (> 5.0)"
        if t <= 80.0:
            if ar_mae <= 5.0:
                crit_passed = False
                crit_str = f"FAIL (<= 5.0: {ar_mae:.2f})"
                failures.append((t, ar_mae))
            else:
                crit_str = f"PASS ({ar_mae:5.2f} > 5.0)"
        else:
            crit_str = f"N/A post-80s ({ar_mae:5.2f})"

        print(f"{t:5.1f}s | {ar_mae:8.3f} | {ar_max:6d} | {ar_gt0:6.2f}% | {ar_gt5:6.2f}% | {ar_gt25:6.2f}% | {full_mae:8.3f} | {crit_str}")

    # 3. Sensitivity Check: Accurate Seek (-i before -ss)
    print("\n--- 3. Sensitivity Check: Accurate Seek (-i before -ss) ---")
    print(f"{'Time':>6} | {'AR MAE (Fast)':>14} | {'AR MAE (Accurate)':>18} | {'AR Max (Accurate)':>18} | {'Status':>12}")
    print("-" * 75)

    accurate_results = {}
    for t in [0.0, 5.0, 10.0, 20.0, 40.0, 60.0, 80.0, 88.0, 101.0, 115.0]:
        f_v5_acc = os.path.join(TMP_DIR, f"v5_acc_{t:.1f}.png")
        f_v6_real_acc = os.path.join(TMP_DIR, f"v6_real_acc_{t:.1f}.png")
        extract_frame(V5_VIDEO, t, f_v5_acc, accurate_seek=True)
        extract_frame(V6_REAL_VIDEO, t, f_v6_real_acc, accurate_seek=True)

        im_v5 = np.array(Image.open(f_v5_acc).convert("RGB"))
        im_v6_real = np.array(Image.open(f_v6_real_acc).convert("RGB"))

        ar_diff = np.abs(im_v6_real[68:920, 20:1436].astype(np.float64) - im_v5[68:920, 20:1436].astype(np.float64))
        mae_acc = float(np.mean(ar_diff))
        max_acc = int(np.max(ar_diff))
        fast_mae = results_v6_real_vs_v5[t]["AR Viewport"]["mae"]

        status = "CONFIRMED (>5)" if (t <= 80.0 and mae_acc > 5.0) else ("PASS" if t > 80.0 else "FAIL")
        print(f"{t:5.1f}s | {fast_mae:14.3f} | {mae_acc:18.3f} | {max_acc:18d} | {status:>12}")
        accurate_results[t] = {"mae_acc": mae_acc, "max_acc": max_acc}

    # 4. Comparison against Rejected V6 (to confirm candidate V6 REAL diverges from Rejected V6)
    print("\n--- 4. Comparison: Candidate V6 REAL vs Rejected V6 (JudgesEdition.mp4) ---")
    print(f"{'Time':>6} | {'AR MAE':>10} | {'AR Max':>8} | {'AR >5%':>8} | {'Full MAE':>10}")
    print("-" * 55)
    results_v6_real_vs_v6_rej = {}
    for t in TIMESTAMPS:
        f_v6_rej = os.path.join(TMP_DIR, f"v6_rej_{t:.1f}.png")
        extract_frame(V6_REJ_VIDEO, t, f_v6_rej, accurate_seek=False)

        img_v6_rej = np.array(Image.open(f_v6_rej).convert("RGB"))
        img_v6_real = np.array(Image.open(os.path.join(TMP_DIR, f"v6_real_{t:.1f}.png")).convert("RGB"))

        metrics = analyze_differences(img_v6_real, img_v6_rej)
        results_v6_real_vs_v6_rej[t] = metrics
        ar_mae = metrics["AR Viewport"]["mae"]
        ar_max = metrics["AR Viewport"]["max"]
        ar_gt5 = metrics["AR Viewport"]["pct_gt5"]
        full_mae = metrics["Full Canvas"]["mae"]
        print(f"{t:5.1f}s | {ar_mae:10.3f} | {ar_max:8d} | {ar_gt5:7.2f}% | {full_mae:10.3f}")

    # 5. Save structured verification artifact
    out_json = "/tmp/challenger_m3_1_verification.json"
    data = {
        "checksums": checksums,
        "v6_real_vs_v5": results_v6_real_vs_v5,
        "v6_real_vs_v6_rej": results_v6_real_vs_v6_rej,
        "accurate_results": accurate_results,
        "failures_0_to_80s": failures
    }
    with open(out_json, "w") as f:
        json.dump(data, f, indent=2)
    print(f"\nSaved structured verification data to {out_json}")

    print("\n" + "=" * 80)
    if len(failures) == 0:
        print("EMPIRICAL HARNESS RESULT: PASS (All timestamps 0.0s–80.0s satisfy MAE > 5.0)")
    else:
        print(f"EMPIRICAL HARNESS RESULT: FAIL ({len(failures)} timestamps failed MAE > 5.0 criterion)")
    print("=" * 80)

if __name__ == "__main__":
    run_challenger()
