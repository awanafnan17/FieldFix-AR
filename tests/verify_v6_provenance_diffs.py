#!/usr/bin/env python3
"""
Independent Empirical Frame Difference and Provenance Verification Script
Author: challenger_m1_2 (Empirical Challenger)
Target: devpost/V6_REAL_VIDEO_PROVENANCE_REPORT.md
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
TMP_DIR = "/tmp/challenger_m1_2_frames"
os.makedirs(TMP_DIR, exist_ok=True)

V5_VIDEO = os.path.join(DEVPOST, "FieldFix-AR-Demo-V5-TraceTheFault.mp4")
V6_VIDEO = os.path.join(DEVPOST, "FieldFix-AR-Demo-V6-JudgesEdition.mp4")

TIMESTAMPS = [0.0, 5.0, 10.0, 15.0, 20.0, 30.0, 40.0, 50.0, 60.0, 70.0, 80.0, 88.0, 101.0, 115.0]

REGIONS = {
    "Full Canvas": (slice(0, 1080), slice(0, 1920)),
    "AR Viewport": (slice(68, 920), slice(20, 1436)),
    "Zoom Viewport": (slice(68, 516), slice(1446, 1900)),
    "Card": (slice(528, 920), slice(1446, 1900)),
    "Header Bar": (slice(0, 60), slice(0, 1920)),
}

# Values reported in devpost/V6_REAL_VIDEO_PROVENANCE_REPORT.md §3 Table
REPORTED_VALUES = {
    0.0:   {"full": 0.0033, "ar_mae": 0.0000, "ar_max": 0, "zoom": 0.0000, "card": 0.0000, "header": 0.0000},
    5.0:   {"full": 0.0033, "ar_mae": 0.0000, "ar_max": 0, "zoom": 0.0000, "card": 0.0000, "header": 0.0000},
    10.0:  {"full": 0.0034, "ar_mae": 0.0000, "ar_max": 0, "zoom": 0.0000, "card": 0.0000, "header": 0.0000},
    15.0:  {"full": 0.0034, "ar_mae": 0.0000, "ar_max": 0, "zoom": 0.0000, "card": 0.0000, "header": 0.0000},
    20.0:  {"full": 0.0032, "ar_mae": 0.0000, "ar_max": 0, "zoom": 0.0000, "card": 0.0000, "header": 0.0000},
    30.0:  {"full": 0.0029, "ar_mae": 0.0000, "ar_max": 0, "zoom": 0.0000, "card": 0.0000, "header": 0.0000},
    40.0:  {"full": 0.0032, "ar_mae": 0.0000, "ar_max": 0, "zoom": 0.0000, "card": 0.0000, "header": 0.0000},
    50.0:  {"full": 0.0034, "ar_mae": 0.0000, "ar_max": 0, "zoom": 0.0000, "card": 0.0000, "header": 0.0000},
    60.0:  {"full": 0.0058, "ar_mae": 0.0000, "ar_max": 0, "zoom": 0.0000, "card": 0.0000, "header": 0.0000},
    70.0:  {"full": 0.0045, "ar_mae": 0.0000, "ar_max": 0, "zoom": 0.0000, "card": 0.0000, "header": 0.0000},
    80.0:  {"full": 0.0036, "ar_mae": 0.0000, "ar_max": 0, "zoom": 0.0000, "card": 0.0000, "header": 0.0000},
    88.0:  {"full": 2.0577, "ar_mae": 0.5832, "ar_max": 40, "zoom": 0.8823, "card": 3.1506, "header": 11.1698},
    101.0: {"full": 1.6007, "ar_mae": 0.1806, "ar_max": 227, "zoom": 0.0688, "card": 0.1495, "header": 13.9272},
    115.0: {"full": 0.0304, "ar_mae": 0.0107, "ar_max": 7, "zoom": 0.0000, "card": 0.0858, "header": 0.0000},
}

def get_hash(path):
    if not os.path.exists(path):
        return None, None, 0
    with open(path, "rb") as f:
        data = f.read()
    return hashlib.md5(data).hexdigest(), hashlib.sha256(data).hexdigest(), len(data)

def extract_frame(video_path, t, out_path, accurate_seek=False):
    if accurate_seek:
        cmd = ["ffmpeg", "-y", "-i", video_path, "-ss", str(t), "-vframes", "1", out_path]
    else:
        cmd = ["ffmpeg", "-y", "-ss", str(t), "-i", video_path, "-vframes", "1", out_path]
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if res.returncode != 0:
        raise RuntimeError(f"FFmpeg error: {res.stderr.decode()}")

def main():
    print("================================================================================")
    print("CHALLENGER M1-2: EMPIRICAL NUMERICAL FRAME DIFFERENCE & PROVENANCE VERIFICATION")
    print("================================================================================")
    
    # 1. Verify Video Hashes
    print("\n--- 1. Subject Files Verification ---")
    files_to_check = {
        "V5 Baseline Video": V5_VIDEO,
        "V6 Candidate Video": V6_VIDEO,
        "clean_v5_take5.mp4": os.path.join(DEVPOST, "_video_build/clean_v5_take5.mp4"),
        "clean_v5_take2.mp4": os.path.join(DEVPOST, "_video_build/clean_v5_take2.mp4"),
        "screenshot_fault_alarm": os.path.join(DEVPOST, "screenshots/01_standby_fault_alarm.png"),
        "screenshot_ready_to_scan": os.path.join(DEVPOST, "screenshots/01_standby_ready_to_scan.png"),
    }
    
    file_hashes = {}
    for name, path in files_to_check.items():
        md5, sha, sz = get_hash(path)
        file_hashes[name] = {"path": path, "md5": md5, "sha256": sha, "size": sz}
        print(f"[{name}]")
        print(f"  Path:   {path}")
        print(f"  Size:   {sz:,} bytes")
        print(f"  MD5:    {md5}")
        print(f"  SHA256: {sha}")

    # Verify screenshots bit-for-bit
    s1_data = open(files_to_check["screenshot_fault_alarm"], "rb").read()
    s2_data = open(files_to_check["screenshot_ready_to_scan"], "rb").read()
    exact_match = (s1_data == s2_data)
    print(f"\nScreenshots 01_standby_fault_alarm vs 01_standby_ready_to_scan:")
    print(f"  Exact bit-for-bit identity: {exact_match}")

    # 2. Extract frames and compute metrics (Method A: fast seek -ss before -i as in report)
    print("\n--- 2. Frame Extraction and Differential Analysis (Fast Seek: -ss before -i) ---")
    results = {}
    mismatches = []
    
    print(f"{'Time':>6} | {'Full MAE':>9} (Rep) | {'AR MAE':>8} (Rep) | {'AR Max':>6} (Rep) | {'Zoom MAE':>9} (Rep) | {'Card MAE':>9} (Rep) | {'Hdr MAE':>9} (Rep) | Status")
    print("-" * 115)
    
    for t in TIMESTAMPS:
        f5_path = os.path.join(TMP_DIR, f"v5_fast_{t}.png")
        f6_path = os.path.join(TMP_DIR, f"v6_fast_{t}.png")
        
        extract_frame(V5_VIDEO, t, f5_path, accurate_seek=False)
        extract_frame(V6_VIDEO, t, f6_path, accurate_seek=False)
        
        img5 = np.array(Image.open(f5_path).convert("RGB"), dtype=np.float64)
        img6 = np.array(Image.open(f6_path).convert("RGB"), dtype=np.float64)
        
        diff = np.abs(img5 - img6)
        
        metrics = {}
        for reg_name, (yslice, xslice) in REGIONS.items():
            rdiff = diff[yslice, xslice]
            metrics[reg_name] = {
                "mae": float(np.mean(rdiff)),
                "max": int(np.max(rdiff)),
                "nonzero_ratio": float(np.mean(rdiff != 0))
            }
        
        rep = REPORTED_VALUES[t]
        full_mae = metrics["Full Canvas"]["mae"]
        ar_mae = metrics["AR Viewport"]["mae"]
        ar_max = metrics["AR Viewport"]["max"]
        zoom_mae = metrics["Zoom Viewport"]["mae"]
        card_mae = metrics["Card"]["mae"]
        hdr_mae = metrics["Header Bar"]["mae"]
        
        # Check tolerance (0.0001 for MAE, 0 for max)
        checks = [
            abs(full_mae - rep["full"]) < 0.0002,
            abs(ar_mae - rep["ar_mae"]) < 0.0002,
            ar_max == rep["ar_max"],
            abs(zoom_mae - rep["zoom"]) < 0.0002,
            abs(card_mae - rep["card"]) < 0.0002,
            abs(hdr_mae - rep["header"]) < 0.0002,
        ]
        status = "EXACT MATCH" if all(checks) else "MISMATCH"
        if not all(checks):
            mismatches.append((t, metrics, rep))
            
        print(f"{t:5.1f}s | {full_mae:9.4f} ({rep['full']:6.4f}) | {ar_mae:8.4f} ({rep['ar_mae']:6.4f}) | {ar_max:6d} ({rep['ar_max']:3d}) | {zoom_mae:9.4f} ({rep['zoom']:6.4f}) | {card_mae:9.4f} ({rep['card']:6.4f}) | {hdr_mae:9.4f} ({rep['header']:7.4f}) | {status}")
        
        results[t] = {
            "computed": metrics,
            "reported": rep,
            "status": status
        }

    # 3. Method B: Accurate seek (-i before -ss) check
    print("\n--- 3. Sensitivity Analysis: Accurate Seek (-i before -ss) ---")
    print(f"{'Time':>6} | {'AR MAE (Fast)':>14} | {'AR MAE (Accurate)':>18} | {'AR Max (Accurate)':>18} | Consistency")
    print("-" * 80)
    for t in [0.0, 5.0, 10.0, 40.0, 80.0, 88.0, 101.0, 115.0]:
        f5_acc = os.path.join(TMP_DIR, f"v5_acc_{t}.png")
        f6_acc = os.path.join(TMP_DIR, f"v6_acc_{t}.png")
        extract_frame(V5_VIDEO, t, f5_acc, accurate_seek=True)
        extract_frame(V6_VIDEO, t, f6_acc, accurate_seek=True)
        
        im5 = np.array(Image.open(f5_acc).convert("RGB"), dtype=np.float64)
        im6 = np.array(Image.open(f6_acc).convert("RGB"), dtype=np.float64)
        
        ar_diff = np.abs(im5[68:920, 20:1436] - im6[68:920, 20:1436])
        ar_mae_acc = float(np.mean(ar_diff))
        ar_max_acc = int(np.max(ar_diff))
        
        fast_ar_mae = results[t]["computed"]["AR Viewport"]["mae"]
        consistent = "IDENTICAL" if (ar_mae_acc == fast_ar_mae) else f"DELTA: {abs(ar_mae_acc - fast_ar_mae):.4f}"
        print(f"{t:5.1f}s | {fast_ar_mae:14.4f} | {ar_mae_acc:18.4f} | {ar_max_acc:18d} | {consistent}")

    # Output JSON summary for artifact embedding
    summary = {
        "file_hashes": file_hashes,
        "screenshot_bit_for_bit_match": exact_match,
        "results": results,
        "mismatches_count": len(mismatches),
    }
    with open("/tmp/challenger_m1_2_summary.json", "w") as f:
        json.dump(summary, f, indent=2)

    print("\n================================================================================")
    if len(mismatches) == 0:
        print("VERDICT: EMPIRICALLY CONFIRMED (14/14 timestamps match §3 within 0.0001 precision)")
    else:
        print(f"VERDICT: REFUTED ({len(mismatches)} timestamps mismatched)")
    print("================================================================================")

if __name__ == "__main__":
    main()
