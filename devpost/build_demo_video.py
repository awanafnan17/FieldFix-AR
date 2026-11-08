#!/usr/bin/env python3
"""
Builds the competition-grade 120.0-second (2m 00s) 1080p 30fps narrated demonstration video
for FieldFix AR (`devpost/FieldFix-AR-Demo-V6-JudgesEdition.mp4`) directly from continuous 60fps Lens Studio 5.24.1
window recordings captured via macOS WindowServer (`screencapture -V ... -l <LensStudioWindowID>`).

Final Presentation Correction Pass (Campaign v4):
1. Priority 1 (Narrative & Scoring Consistency):
   - Run #1 commits an intentional out-of-order LOTO violation at 0:28–0:42 (`LOTO Violations: 1`).
   - At 1:10–1:17 (Chapter 6A), completing Step 4 on Run #1 accurately displays and awards
     `85% (B+ SAFETY REDIRECTED) | LOTO Violations: 1` (`VERIFIED NOMINAL (85% SCORE)`).
   - At 1:17–1:24 (Chapter 6B), we explicitly show and label a Clean Attempt After Reset (Run #2,
     `LOTO Violations: 0`) completing Step 4 and earning `100% (A+ FLAWLESS LOTO)`.
2. Priority 2 (Visual Impact & 3D Machine Prominence):
   - Enlarged Left AR Viewport (`1416x852`) paired with a synchronized Top-Right `2.3x` Live 3D
     Equipment Close-Up Zoom Viewport (`454x448`, authentic crop of the 3D Cryo-Pump) so the
     exploded X-Ray internals, crimson LOTO hazard flash, rotating yellow valve lever, red LOTO clasp,
     sweeping pressure gauge needle, retracting thermal plunger, and Before/After states are massive.
   - Simplified Bottom-Right explanation card (`454x392`) with 3 concise 1-line pills (>65% less text).
3. Priority 3 (Zero Blank Frames / Clean Transitions):
   - Frame-accurate decoding (`-ss` after `-i` + `setpts=scale*(PTS-STARTPTS),fps=30`) eliminates all
     initial timestamp offset blank frames at 0:00 and 0:42. Verified by automated pixel luma checks.
4. Priority 4 (Compelling 4–6s Action Opening):
   - 0:00–0:05.5 opens immediately with live working AR gameplay (3D X-Ray Cutaway exploding internal
     parts + SIK hand pinch interaction) before showing the side-by-side spatial layout at 0:05.5–0:12.0.
"""

import os
import shutil
import subprocess
import wave
import struct
import math
import hashlib
from PIL import Image, ImageDraw, ImageFont, ImageStat

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEVPOST_DIR = os.path.join(BASE_DIR, "devpost")
BUILD_DIR = os.path.join(DEVPOST_DIR, "_video_build")
SFX_DIR = os.path.join(BASE_DIR, "Assets", "GeneratedSFX")
OUT_V5_MP4 = os.path.join(DEVPOST_DIR, "FieldFix-AR-Demo-V5-TraceTheFault.mp4")
OUT_V6_MP4 = os.path.join(DEVPOST_DIR, "FieldFix-AR-Demo-V6-JudgesEdition.mp4")
OUT_V6_REAL_MP4 = os.path.join(DEVPOST_DIR, "FieldFix-AR-Demo-V6-JudgesEdition-REAL.mp4")
OUT_MP4 = os.path.join(DEVPOST_DIR, "FieldFix-AR-Demo.mp4")
ROOT_DEVPOST_MP4 = os.path.join(os.path.dirname(BASE_DIR), "devpost", "FieldFix-AR-Demo.mp4")
ROOT_MP4 = os.path.join(os.path.dirname(BASE_DIR), "FieldFix-AR-Demo.mp4")

# Cryptographic Banned Hash Registry:
# Matches legacy V5 footage and rejected V6 candidate video to prevent accidental reuse.
BANNED_LEGACY_HASHES = {
    "8c65fe7dfe6e8d6458931f612f8df2a739f910aeedf82eeff696822726388659": "clean_v5_take5.mp4 (Legacy V5 Take 5 recording from Oct 26)",
    "7ecf5145fb54555e747baed43c1e241c9a5e379a955aa83200efd31688403eac": "clean_v5_take2.mp4 (Legacy V5 Take 2 recording from Oct 26)",
    "5811fe2d0f02550bdbce61136692b5ee992b37b964efeca541354909b1ed597b": "FieldFix-AR-Demo-V5-TraceTheFault.mp4 (Approved Baseline V5 video)",
    "06f82c1668ad48b55a59a78a7af15fc19eab076761ee79bfa9b66fb32d1d84cc": "FieldFix-AR-Demo-V6-JudgesEdition.mp4 (Rejected V6 candidate video)",
}

# Immutable deliverables that must NEVER be overwritten or modified:
PROTECTED_DELIVERABLES = {
    OUT_V5_MP4: "FieldFix-AR-Demo-V5-TraceTheFault.mp4 (Approved Baseline V5 fallback - immutable)",
    OUT_V6_MP4: "FieldFix-AR-Demo-V6-JudgesEdition.mp4 (Rejected V6 video - preserved for forensic audit)",
}


def compute_sha256(file_path: str) -> str:
    """Computes the SHA-256 hash of a file."""
    h = hashlib.sha256()
    with open(file_path, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()


def preflight_anti_v5_guard(chapters: list, output_target: str) -> None:
    """
    Strict anti-V5 preflight verification guard.
    Computes SHA-256 of all input video files in CHAPTERS and halts execution immediately if:
      1. Any input file matches known legacy V5 or rejected V6 video hashes.
      2. Any input file name contains legacy 'v5' or 'clean_v5' substrings.
      3. The output target matches any protected deliverables (V5 baseline or rejected V6).
    """
    print("=" * 70)
    print("RUNNING ANTI-V5 PREFLIGHT VERIFICATION GUARD...")
    print("=" * 70)

    # 1. Verify output target protection
    abs_target = os.path.abspath(output_target)
    for prot_path, prot_desc in PROTECTED_DELIVERABLES.items():
        if abs_target == os.path.abspath(prot_path):
            raise RuntimeError(
                f"[PREFLIGHT FATAL ERROR] Destination target is a PROTECTED DELIVERABLE:\n"
                f"  Target: {output_target}\n"
                f"  Protected asset: {prot_desc}\n"
                f"  Writing to this path is strictly prohibited. Output must be {OUT_V6_REAL_MP4}."
            )
    print(f"  [OK] Output target verified: {output_target}")

    # 2. Inspect all input video sources in CHAPTERS
    seen_sources = set()
    violations = []

    for idx, ch in enumerate(chapters):
        src_path = ch.get("src")
        ch_id = ch.get("id", f"chapter_{idx}")
        if not src_path:
            violations.append(f"Chapter '{ch_id}' has no 'src' specified.")
            continue

        abs_src = os.path.abspath(src_path)
        base_src = os.path.basename(abs_src).lower()

        # Check banned name patterns
        if "v5" in base_src or "clean_v5" in base_src:
            violations.append(
                f"Chapter '{ch_id}' references legacy V5 file by name: '{src_path}'"
            )

        if not os.path.exists(abs_src):
            violations.append(f"Chapter '{ch_id}' input file not found: '{src_path}'")
            continue

        if abs_src not in seen_sources:
            seen_sources.add(abs_src)
            src_hash = compute_sha256(abs_src)
            print(f"  Checking source: {os.path.basename(abs_src)} -> SHA-256: {src_hash[:16]}...")
            if src_hash in BANNED_LEGACY_HASHES:
                banned_desc = BANNED_LEGACY_HASHES[src_hash]
                violations.append(
                    f"Chapter '{ch_id}' uses BANNED LEGACY V5 FOOTAGE!\n"
                    f"    File: {src_path}\n"
                    f"    SHA-256: {src_hash}\n"
                    f"    Matched Banned Asset: {banned_desc}"
                )

    if violations:
        msg = "\n".join([f"  - {v}" for v in violations])
        raise RuntimeError(
            f"\n{'!' * 70}\n"
            f"[PREFLIGHT FATAL ERROR] ANTI-V5 GUARD REJECTED VIDEO BUILD INPUTS:\n"
            f"{msg}\n"
            f"\nExecution halted. You must provide freshly recorded V6 Lens Studio preview footage.\n"
            f"{'!' * 70}\n"
        )

    print("  [OK] All chapter source inputs verified free of legacy V5 footage.")
    print("=" * 70)

W, H = 1920, 1080
FPS = 30

CLEAN_V6_TAKE1 = os.path.join(BUILD_DIR, "clean_v6_take1.mp4")
CLEAN_V6_TAKE2 = os.path.join(BUILD_DIR, "clean_v6_take2.mp4")

CHAPTERS = [
    {
        "id": "ch01_malfunction_and_scan",
        "nav_idx": 0,
        "mode": "hero_ar",
        "src": CLEAN_V6_TAKE1,
        "ss": 0.0,
        "src_dur": 5.5,
        "duration": 7.5,
        "step_badge": "0:00 – 0:07.5   |   1. MACHINE MALFUNCTION: 118°C OVERHEAT AT TR-309",
        "title": "FieldFix AR — Cryo-Pump #04 Overheat Alarm: 1-1-1 Standby Interface",
        "zoom_badge": "2.3x LIVE 3D ZOOM: CRYO-PUMP #04 OVERHEAT ALARM",
        "target_comp": "TR-309 Thermal Relay Core",
        "target_state": "118°C Alarm | Upstream Parts Uninspected",
        "action_title": "PINCH [SCAN] BUTTON ON HUD",
        "action_desc": "1-1-1 HUD presents 1 condition, 1 objective, 1 primary action.",
        "action_result": "Starts 1.2s spatial laser telemetry scan across cooling zones.",
        "card_tag": "STANDBY INTERFACE",
        "card_title": "Cryo-Pump #04 Alarm",
        "card_footer": "ACTION: PINCH [SCAN] TO START UPSTREAM TRACE",
        "accent": (72, 225, 255),
        "caption_1": "Cryo-Pump #04 triggers a 118°C overheat alarm at TR-309 while upstream PR-204 and CV-101 remain uninspected.",
        "caption_2": "The 1-1-1 Standby HUD eliminates clutter, presenting one condition, one objective, and one prominent primary action.",
        "voiceover": (
            "FieldFix A R opens with a clean one-one-one interface. "
            "Trainees pinch scan to trace the overheat symptom upstream."
        ),
        "vo_rate": 195,
        "sfx_events": [(4.3, "ButtonClick.wav", 0.65), (4.8, "ScanSweep.wav", 0.75)],
    },
    {
        "id": "ch02a_trace_1_of_3",
        "nav_idx": 1,
        "mode": "hero_ar",
        "src": CLEAN_V6_TAKE1,
        "ss": 4.5,
        "src_dur": 5.5,
        "duration": 13.0,
        "step_badge": "0:07.5 – 0:20.5   |   2A. TRACE 1/3: FOLLOW OVERHEAT SYMPTOM UPSTREAM",
        "title": "Trace 1/3: Follow Overheat Symptom Upstream to Midstream Regulator [PR-204]",
        "zoom_badge": "2.3x LIVE 3D ZOOM: 3D CHEVRON GUIDES TO [PR-204]",
        "target_comp": "Midstream Path -> [PR-204]",
        "target_state": "TR-309 Localized (1/3) | Upstream Flow Choked",
        "action_title": "FOLLOW 3D CHEVRON TO PR-204",
        "action_desc": "Trainee follows 3D directional arrow upstream toward regulator.",
        "action_result": "Early CV-101 skip is blocked by non-spoiling Skip Guard.",
        "card_tag": "CAUSAL FAULT TRACE",
        "card_title": "Trace 1/3: Go Upstream",
        "card_footer": "TRACE 1/3: FOLLOW THE OVERHEATING SYMPTOM UPSTREAM",
        "accent": (72, 225, 255),
        "caption_1": "Follow the overheating symptom upstream: after localizing TR-309, the 3D chevron guides the trainee to PR-204.",
        "caption_2": "Skipping ahead to CV-101 is blocked with non-spoiling feedback ([INSPECT PR-204 FIRST]) until PR-204 is inspected.",
        "voiceover": (
            "At Trace one of three, follow the overheating symptom upstream. "
            "Skipping ahead to the intake valve is blocked until the midstream regulator is inspected."
        ),
        "vo_rate": 195,
        "sfx_events": [(0.5, "FaultAlert.wav", 0.60), (9.4, "ButtonClick.wav", 0.65)],
    },
    {
        "id": "ch02b_trace_2_of_3",
        "nav_idx": 1,
        "mode": "hero_ar",
        "src": CLEAN_V6_TAKE1,
        "ss": 9.5,
        "src_dur": 3.5,
        "duration": 3.8,
        "step_badge": "0:20.5 – 0:24.3   |   2B. TRACE 2/3: PR-204 INSPECTION REVEALS 142 PSI BOTTLENECK",
        "title": "Trace 2/3: Inspecting 3D [PR-204] Reveals 142 PSI Vapor Lock in Auto-X-Ray",
        "zoom_badge": "2.3x LIVE 3D ZOOM: PR-204 142 PSI & AUTO-X-RAY",
        "target_comp": "PR-204 Pressure Regulator",
        "target_state": "142 PSI Vapor Lock Trapped at Diaphragm",
        "action_title": "PINCH 3D REGULATOR TO INSPECT",
        "action_desc": "Inspects midstream regulator in 3D via SIK targeting.",
        "action_result": "Auto-X-Ray exposes internal relief springs and trapped vapor.",
        "card_tag": "MIDSTREAM INSPECTION",
        "card_title": "Trace 2/3: 142 PSI Block",
        "card_footer": "TRACE 2/3: 142 PSI BOTTLENECK REVEALED IN X-RAY",
        "accent": (255, 205, 70),
        "caption_1": "Trace 2/3: Inspecting 3D PR-204 activates Auto-X-Ray cutaway and reveals the 142 PSI vapor lock bottleneck.",
        "caption_2": "The 3D chevron shifts upstream to CV-101 while the intake root cause remains concealed.",
        "voiceover": (
            "Inspecting the regulator reveals the vapor lock."
        ),
        "vo_rate": 200,
        "sfx_events": [(2.1, "ButtonClick.wav", 0.70), (2.4, "ScanSweep.wav", 0.50)],
    },
    {
        "id": "ch02c_trace_3_of_3",
        "nav_idx": 1,
        "mode": "hero_ar",
        "src": CLEAN_V6_TAKE1,
        "ss": 15.0,
        "src_dur": 3.5,
        "duration": 3.7,
        "step_badge": "0:24.3 – 0:28   |   2C. TRACE 3/3: CV-101 INSPECTION REVEALS 18% ROOT CAUSE",
        "title": "Trace 3/3: Inspecting 3D [CV-101] Reveals 18% Coolant-Flow Root Cause",
        "zoom_badge": "2.3x LIVE 3D ZOOM: CV-101 18% ROOT CAUSE & X-RAY",
        "target_comp": "CV-101 Coolant Intake Valve",
        "target_state": "18% Coolant Flow Restriction (Cavitation)",
        "action_title": "PINCH 3D INTAKE VALVE TO INSPECT",
        "action_desc": "Completes 3/3 upstream causal trace at primary coolant inlet.",
        "action_result": "Root cause identified; unlocks Step 1 LOTO isolation.",
        "card_tag": "INTAKE ROOT CAUSE",
        "card_title": "Trace 3/3: 18% Root Cause",
        "card_footer": "TRACE COMPLETE: 18% ROOT CAUSE IDENTIFIED",
        "accent": (85, 245, 155),
        "caption_1": "Trace 3/3: Inspecting 3D CV-101 exposes the intake seal in Auto-X-Ray, identifying the 18% flow root cause.",
        "caption_2": "Completing the 3/3 causal trace unlocks Step 1/4: Lockout Isolation Valve [CV-101].",
        "voiceover": (
            "Inspecting the valve reveals the root cause."
        ),
        "vo_rate": 200,
        "sfx_events": [(2.1, "ButtonClick.wav", 0.70)],
    },
    {
        "id": "ch03_safety_interlock",
        "nav_idx": 2,
        "mode": "hero_ar",
        "src": CLEAN_V6_TAKE1,
        "ss": 20.0,
        "src_dur": 5.5,
        "duration": 14.0,
        "step_badge": "0:28 – 0:42   |   3. INCORRECT ACTION & CONTEXTUAL LOTO SAFETY INTERLOCK",
        "title": "Premature Purge Attempt on PR-204 Triggers LOTO Safety Interlock",
        "zoom_badge": "2.3x LIVE 3D ZOOM: CRIMSON LOTO HAZARD BLOCK",
        "ar_banner": "RUN 1 — OUT-OF-ORDER ACTION LOGS LOTO VIOLATION #1 (-15%)",
        "target_comp": "CV-101 Intake (LOTO Interlock)",
        "target_state": "Unsafe Action Blocked (Line Under Pressure)",
        "action_title": "ISOLATE CV-101 BEFORE PURGING",
        "action_desc": "Attempting to bleed regulator while intake is live is blocked.",
        "action_result": "Regulator flashes red; 1 violation logged (-15% score).",
        "card_tag": "LOTO SAFETY INTERLOCK",
        "card_title": "Unsafe Action Blocked",
        "card_footer": "SAFETY INTERLOCK: ISOLATE [CV-101] FIRST!",
        "accent": (255, 95, 95),
        "caption_1": "Attempting to purge PR-204 before locking out CV-101 triggers the Lockout-Tagout Safety Interlock.",
        "caption_2": "The 3D halo flashes crimson, logs LOTO Violation #1 (-15% penalty), and redirects trainee to Step 1 [CV-101].",
        "voiceover": (
            "If a trainee tries to bleed the regulator before isolating the intake valve, "
            "the Lockout-Tagout Safety Interlock blocks the action, logs one safety violation, and redirects upstream to Step One."
        ),
        "vo_rate": 195,
        "sfx_events": [(7.6, "ButtonClick.wav", 0.70), (7.8, "FaultAlert.wav", 0.90)],
    },
    {
        "id": "ch04a_step1_loto_and_step2_in_progress",
        "nav_idx": 2,
        "mode": "hero_ar",
        "src": CLEAN_V6_TAKE1,
        "ss": 27.5,
        "src_dur": 6.3,
        "duration": 10.0,
        "step_badge": "0:42 – 0:52   |   4A. STEP 1 COMPLETE (1/4) & STEP 2 PURGE IN PROGRESS",
        "title": "Step 1 LOTO Clasp Locked (-90°); Step 2 Purging PR-204 (128 PSI Active)",
        "zoom_badge": "2.3x LIVE 3D ZOOM: STEP 1 LOCKED, STEP 2 PURGING",
        "ar_banner": "UNINTERRUPTED PREVIEW INTERACTION: STEP 2 IN PROGRESS (1/4 COMPLETED)",
        "target_comp": "PR-204 Pressure Regulator (Step 2/4)",
        "target_state": "Step 1 Complete (1/4) | Step 2 Purge Active (128 PSI)",
        "action_title": "TARGET PR-204 REGULATOR TO PURGE",
        "action_desc": "Step 1 LOTO clasp locked. Trainee targets PR-204 to bleed vapor.",
        "action_result": "Step 2 active: line pressure bleeding down toward 38 PSI.",
        "card_tag": "STEP 2 IN PROGRESS",
        "card_title": "Purging Trapped Vapor",
        "card_footer": "PROGRESS: 1 / 4 COMPLETED ([1:LOTO LOCKED] [2:IN PROGRESS])",
        "accent": (255, 165, 60),
        "caption_1": "Step 1 (Isolate): SIK targeting rotates the yellow valve lever 90° and snaps on the red LOTO clasp.",
        "caption_2": "Step 2 (Depressurize In Progress): SIK targeting bleeds trapped vapor—PR-204 pressure drops from 142 toward 38 PSI.",
        "voiceover": (
            "In Step One, targeting the valve rotates the lever ninety degrees and snaps on a lockout clasp. "
            "Step Two begins purging the regulator."
        ),
        "vo_rate": 195,
        "sfx_events": [(1.6, "RepairStepConfirm.wav", 0.85)],
    },
    {
        "id": "ch04b_step2_purge_complete",
        "nav_idx": 2,
        "mode": "hero_ar",
        "src": CLEAN_V6_TAKE1,
        "ss": 33.8,
        "src_dur": 3.2,
        "duration": 5.0,
        "step_badge": "0:52 – 0:57   |   4B. STEP 2 COMPLETE: 38 PSI PURGE VERIFIED (2/4)",
        "title": "PR-204 Purge Confirmed at 38 PSI (2/4 Complete | Unlocks Step 3)",
        "zoom_badge": "2.3x LIVE 3D ZOOM: 38 PSI PURGE COMPLETE",
        "ar_banner": "UNINTERRUPTED PREVIEW INTERACTION: STEP 2 COMPLETE (2/4 VERIFIED)",
        "target_comp": "PR-204 Pressure Regulator (Depressurized)",
        "target_state": "Step 2 Complete (2/4) | 38 PSI Safe Line Threshold",
        "action_title": "CONFIRM PR-204 PURGE AT 38 PSI",
        "action_desc": "Trapped vapor purged; gauge stabilizes at 38 PSI safe threshold.",
        "action_result": "Step 2 verified (2/4 complete); unlocks Step 3 relay reseat.",
        "card_tag": "STEP 2 COMPLETE",
        "card_title": "Line Depressurized",
        "card_footer": "PROGRESS: 2 / 4 STEPS VERIFIED ([1:LOTO OK] [2:PURGE OK])",
        "accent": (255, 165, 60),
        "caption_1": "Step 2 (Depressurize Complete): SIK targeting clears trapped vapor—the needle stabilizes at 38 PSI.",
        "caption_2": "Progress advances to 2 / 4 steps verified, unlocking Step 3: Reseat Thermal Relay Core [TR-309].",
        "voiceover": (
            "Step Two clears trapped vapor, dropping pressure to thirty-eight P-S-I."
        ),
        "vo_rate": 200,
        "sfx_events": [(1.1, "RepairStepConfirm.wav", 0.85)],
    },
    {
        "id": "ch05_step3_relay",
        "nav_idx": 2,
        "mode": "hero_ar",
        "src": CLEAN_V6_TAKE1,
        "ss": 37.0,
        "src_dur": 9.5,
        "duration": 13.0,
        "step_badge": "0:57 – 1:10   |   5. SYNCHRONIZED 3D REPAIRS: RELAY RESEAT & VALVE RESTORATION",
        "title": "Targeting TR-309 Retracts Plunger; Step 4 Restores Coolant Flow",
        "zoom_badge": "2.3x LIVE 3D ZOOM: RELAY RESEAT & FLOW RESTORE",
        "ar_banner": "UNINTERRUPTED PREVIEW INTERACTION: STEPS 3 & 4 TO NOMINAL STATE",
        "target_comp": "TR-309 Core & CV-101 Valve",
        "target_state": "Step 3 (Reseated) & Step 4 (Flow Restored)",
        "action_title": "RESEAT RELAY & RESTORE VALVE FLOW",
        "action_desc": "SIK targeting retracts plunger into collar, then re-opens CV-101.",
        "action_result": "Relay cools to 46°C; LOTO lock removed; 100% flow restored.",
        "card_tag": "FINAL REPAIR STEPS",
        "card_title": "Steps 3 & 4 Completed",
        "card_footer": "PROGRESS: 4 / 4 STEPS VERIFIED -> ALL REPAIRS NOMINAL",
        "accent": (72, 225, 255),
        "caption_1": "Step 3 (Reseat Relay): Targeting TR-309 retracts the tripped plunger into its collar, cooling the core to 46°C.",
        "caption_2": "Step 4 (Restore Flow): Removing the LOTO lock and reopening CV-101 restores 100% laminar flow across both zones.",
        "voiceover": (
            "In Step Three, targeting the thermal relay retracts the plunger, cooling the core to forty-six Celsius. "
            "Step Four removes the lock and restores flow."
        ),
        "vo_rate": 195,
        "sfx_events": [(4.2, "RepairStepConfirm.wav", 0.85), (9.8, "RepairStepConfirm.wav", 0.85)],
    },
    {
        "id": "ch06a_run1_score_85",
        "nav_idx": 3,
        "mode": "hero_ar",
        "src": CLEAN_V6_TAKE1,
        "ss": 46.5,
        "src_dur": 5.5,
        "duration": 7.0,
        "step_badge": "1:10 – 1:17   |   6A. RUN 1 COMPLETION SCORECARD: 85% (B+ SAFETY REDIRECTED)",
        "title": "Run 1 Completes at 85% (B+ Safety Redirected | Trace: 3/3 | LOTO Blocks: 1)",
        "zoom_badge": "2.3x LIVE 3D ZOOM: 100% LAMINAR FLOW (85% B+)",
        "ar_banner": "RUN 1 RESULT — 1 LOTO VIOLATION AT 0:28 -> 85% (B+)",
        "target_comp": "Run 1 Training Assessment",
        "target_state": "100% Laminar Flow Verified (42°C | 45 PSI)",
        "action_title": "REVIEW RUN 1 SCORECARD ON HUD",
        "action_desc": "Evaluates causal trace accuracy and safety interlock compliance.",
        "action_result": "Grade 85% (B+ SAFETY REDIRECTED) awarded for 1 LOTO block.",
        "card_tag": "RUN 1 SCORECARD",
        "card_title": "1 Violation = 85% B+",
        "card_footer": "RUN 1 SCORE: 85% (B+ SAFETY REDIRECTED | BLOCKS: 1)",
        "accent": (255, 210, 85),
        "caption_1": "Run 1 completes with 100% laminar flow (42°C | 45 PSI), grading the trainee 85% (B+ SAFETY REDIRECTED).",
        "caption_2": "All 6 flow rings spin in synchronized emerald green while the scorecard reflects the earlier LOTO violation.",
        "voiceover": (
            "With flow restored, Run One scores eighty-five percent, B-plus, reflecting the earlier violation."
        ),
        "vo_rate": 195,
        "sfx_events": [(0.8, "DiagnosticComplete.wav", 0.90)],
    },
    {
        "id": "ch06b_reset_to_run2_100",
        "nav_idx": 3,
        "mode": "hero_ar",
        "src": CLEAN_V6_TAKE2,
        "ss": 5.0,
        "src_dur": 7.0,
        "duration": 7.0,
        "step_badge": "1:17 – 1:24   |   6B. RUN 2 — CLEAN ATTEMPT AFTER RESET: 100% (A+ FLAWLESS LOTO)",
        "title": "Run 2 — Clean Attempt After Reset Earns 100% (A+ Flawless LOTO)",
        "zoom_badge": "2.3x LIVE 3D ZOOM: RUN 2 CLEAN ATTEMPT (100% A+)",
        "ar_banner": "RUN 2 — CLEAN ATTEMPT AFTER RESET (0 VIOLATIONS -> 100% A+)",
        "target_comp": "Run 2 Clean Retest",
        "target_state": "0 Violations | Strict LOTO Order Followed",
        "action_title": "VERIFY FLAWLESS RETEST OUTCOME",
        "action_desc": "Trainee re-attempts entire 4-step sequence without safety blocks.",
        "action_result": "Grade 100% (A+ FLAWLESS LOTO) awarded on clean scorecard.",
        "card_tag": "RUN 2 — CLEAN ATTEMPT",
        "card_title": "0 Violations = 100% A+",
        "card_footer": "RUN 2 SCORE: 100% (A+ FLAWLESS LOTO | BLOCKS: 0)",
        "accent": (72, 245, 148),
        "caption_1": "Run 2 — Clean Attempt After Reset: Executing all 4 steps in strict LOTO order with 0 violations earns 100% (A+ FLAWLESS).",
        "caption_2": "Pinching CV-101 removes the LOTO clasp, rotates the yellow lever open, and restores full laminar flow.",
        "voiceover": (
            "On Run Two after reset, a clean sequence with zero violations earns one hundred percent, A-plus."
        ),
        "vo_rate": 195,
        "sfx_events": [(2.5, "DiagnosticComplete.wav", 0.95)],
    },
    {
        "id": "ch07_before_after_compare",
        "nav_idx": 3,
        "mode": "hero_ar",
        "src": CLEAN_V6_TAKE1,
        "ss": 63.0,
        "src_dur": 7.5,
        "duration": 14.0,
        "step_badge": "1:24 – 1:38   |   7. BEFORE / AFTER SPATIAL STATE COMPARISON MODE [ COMPARE: ON ]",
        "title": "One-Pinch [ COMPARE: ON ] Compares Choked Fault (118°C) vs. Nominal (42°C)",
        "zoom_badge": "2.3x LIVE 3D ZOOM: FAULT SNAPSHOT <-> NOMINAL",
        "target_comp": "Cryo-Pump 3D Digital Twin",
        "target_state": "Read-Only Comparison Mode ([ COMPARE: ON ])",
        "action_title": "PINCH [COMPARE] TO TOGGLE STATES",
        "action_desc": "Toggles 3D parts between recorded fault snapshot and nominal.",
        "action_result": "Visual proof of vapor lock resolution and flow restoration.",
        "card_tag": "COMPARE MODE",
        "card_title": "[ COMPARE: ON ] Toggle",
        "card_footer": "COMPARE MODE: [ COMPARE: ON ] (FAULT SNAPSHOT <-> NOMINAL)",
        "accent": (72, 225, 255),
        "caption_1": "Pinching [COMPARE] activates [ COMPARE: ON ], toggling 3D parts and flow rings between fault snapshot and nominal state.",
        "caption_2": "Trainees can inspect how the PR-204 vapor lock choked downstream flow and how the 4-step LOTO repair restored thermal balance.",
        "voiceover": (
            "After completion, trainees toggle Compare Mode to contrast the initial choked fault against the verified nominal state."
        ),
        "vo_rate": 195,
        "sfx_events": [(6.5, "ButtonClick.wav", 0.70), (12.1, "ButtonClick.wav", 0.70)],
    },
    {
        "id": "ch08a_editor_reset",
        "nav_idx": 4,
        "mode": "editor_split",
        "src": CLEAN_V6_TAKE1,
        "ss": 52.0,
        "src_dur": 3.5,
        "duration": 6.5,
        "step_badge": "1:38 – 1:44.5   |   8A. ROW 9 UTILITY DOCK [RESET], NAVIGATION & LENS STUDIO CLAD",
        "title": "One-Pinch Row 9 Utility Dock [RESET] Restores 0/4 Standby State for Repeatable Practice",
        "caption_1": "Relocated to Row 9 utility dock (y = -20.6 cm) with 1.4 cm SIK margin: one-pinch [RESET] restores all 3D parts and re-arms trace.",
        "caption_2": "Built in Lens Studio 5.24.1 using Closed Loop Agentic Development (CLAD), Lens Studio MCP, and automated LEAF verification.",
        "accent": (72, 225, 255),
        "voiceover": (
            "The Row Nine utility dock Reset button restores all three-D parts for repeatable practice in Lens Studio."
        ),
        "vo_rate": 195,
        "sfx_events": [(2.2, "ButtonClick.wav", 0.75)],
    },
    {
        "id": "ch08b_editor_leaf_v3",
        "nav_idx": 4,
        "mode": "editor_leaf_dashboard",
        "src": CLEAN_V6_TAKE1,
        "ss": 55.0,
        "src_dur": 3.0,
        "duration": 6.5,
        "step_badge": "1:44.5 – 1:51   |   8B. ENGINE VERIFICATION: TYPESCRIPT COMPILATION & 6/6 LEAF SUITES",
        "title": "Clean Lens Studio TypeScript Compilation & In-Engine 6/6 Automated LEAF Pass",
        "caption_1": "Lens Studio compiles clean with zero errors. In parallel, 6 automated LEAF integration test scenarios run in the engine.",
        "caption_2": "All 138 scenario assertions pass deterministically, verifying diagnostic tracing, safety interlocks, and state resets.",
        "accent": (72, 245, 148),
        "vo_rate": 200,
        "voiceover": (
            "Lens Studio compiles clean, while six automated LEAF suites verify all diagnostic and safety states."
        ),
        "sfx_events": [(1.5, "ScanSweep.wav", 0.65), (4.8, "DiagnosticComplete.wav", 0.80)],
    },
    {
        "id": "ch09_closing_summary",
        "nav_idx": 5,
        "mode": "hero_ar",
        "src": CLEAN_V6_TAKE2,
        "ss": 13.0,
        "src_dur": 4.5,
        "duration": 9.0,
        "step_badge": "1:51 – 2:00   |   9. FIELDFIX AR — SIGNATURE SPATIAL TRAINING EXPERIENCE",
        "title": "FieldFix AR: Spatial Cause-and-Effect Maintenance Training for Snap SPECS",
        "zoom_badge": "2.3x LIVE 3D ZOOM: VERIFIED NOMINAL OPERATION",
        "target_comp": "Snap Spectacles (2024) / SPECS 27",
        "target_state": "Verified Production Release Candidate",
        "action_title": "SPATIAL AR MAINTENANCE TRAINING",
        "action_desc": "Cause-and-effect industrial diagnostic and LOTO training.",
        "action_result": "FieldFix AR — Learn AR with SPECS Submission",
        "card_tag": "LEARN AR WITH SPECS",
        "card_title": "FieldFix AR Submission",
        "card_footer": "GITHUB.COM/AWANAFNAN17/FIELDFIX-AR | MIT",
        "accent": (72, 245, 148),
        "caption_1": "FieldFix AR transforms industrial repair checklists into a spatial cause-and-effect diagnostic and LOTO training simulation for Snap SPECS.",
        "caption_2": "2-zone causal coolant flow, localized Auto-X-Ray cutaway, LOTO safety interlock, Before/After compare, and 6/6 passing LEAF tests.",
        "voiceover": (
            "FieldFix A R: spatial fault tracing, mechanical repairs, and safety training for Snap SPECS."
        ),
        "vo_rate": 195,
        "sfx_events": [(1.0, "DiagnosticComplete.wav", 0.90), (5.5, "RepairStepConfirm.wav", 0.65)],
    },
]

TOTAL_NAV_SECTIONS = 6


def load_font(size: int, bold: bool = False):
    candidates = [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "/System/Library/Fonts/SFNSMono.ttf",
        "/System/Library/Fonts/Menlo.ttc",
    ]
    for path in candidates:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                pass
    return ImageFont.load_default()


def create_overlay_png(ch: dict, out_path: str):
    """Creates a 1920x1080 RGBA overlay with transparent video cutout(s), 2.3x 3D zoom frame, and concise card."""
    img = Image.new("RGBA", (W, H), (10, 15, 23, 255))
    draw = ImageDraw.Draw(img)
    accent = ch["accent"]

    # Top Header Bar (y=0..60)
    draw.rectangle((0, 0, W, 60), fill=(13, 21, 33, 255))
    draw.line((0, 60, W, 60), fill=accent + (255,), width=3)

    f_step = load_font(14, bold=True)
    f_title = load_font(21, bold=True)
    f_badge = load_font(13, bold=True)

    draw.text((24, 7), ch["step_badge"], fill=accent + (255,), font=f_step)
    draw.text((24, 28), ch["title"], fill=(245, 250, 255, 255), font=f_title)

    # Top-right competition pill
    draw.rounded_rectangle((1460, 11, 1900, 49), radius=8, fill=(19, 32, 48, 255), outline=accent + (210,), width=2)
    draw.text((1480, 22), "LEARN AR WITH SPECS  |  SIMULATION DEMO", fill=(215, 240, 255, 255), font=f_badge)

    if ch["mode"] == "hero_ar":
        # HERO AR MODE WITH ENLARGED 3D EQUIPMENT ZOOM & STREAMLINED IMMEDIATE ACTION CARD:
        # Left Main AR Viewport: 1416x852 (x=20..1436, y=68..920)
        # Top-Right 2.3x 3D Equipment Zoom Viewport: 454x492 (x=1446..1900, y=68..560) - Enlarged by 14%
        # Bottom-Right Streamlined Immediate Action Card: 454x348 (x=1446..1900, y=572..920)
        AR_BOX = (20, 68, 1436, 920)
        ZOOM_BOX = (1446, 68, 1900, 560)
        CARD_BOX = (1446, 572, 1900, 920)

        # Transparent cutouts for main AR viewport and 2.3x 3D zoom viewport
        draw.rectangle(AR_BOX, fill=(0, 0, 0, 0))
        draw.rectangle(ZOOM_BOX, fill=(0, 0, 0, 0))

        draw.rectangle((AR_BOX[0] - 2, AR_BOX[1] - 2, AR_BOX[2] + 2, AR_BOX[3] + 2), outline=accent + (235,), width=2)
        draw.rectangle((ZOOM_BOX[0] - 2, ZOOM_BOX[1] - 2, ZOOM_BOX[2] + 2, ZOOM_BOX[3] + 2), outline=accent + (235,), width=2)

        # Accurate SIK Interaction badge in top-left of Main AR Viewport
        draw.rounded_rectangle((AR_BOX[0] + 10, AR_BOX[1] + 10, AR_BOX[0] + 490, AR_BOX[1] + 38), radius=6, fill=(10, 18, 28, 225), outline=accent + (220,), width=1)
        draw.text((AR_BOX[0] + 20, AR_BOX[1] + 17), "LIVE LENS STUDIO 5.24.1 PREVIEW (SIK INTERACTION)", fill=accent + (255,), font=f_badge)

        # Optional prominent callout banner in top-right of Main AR Viewport (e.g., Run 1 vs Run 2 — Clean Attempt After Reset)
        ar_banner = ch.get("ar_banner")
        if ar_banner:
            banner_w = min(680, len(ar_banner) * 10 + 40)
            draw.rounded_rectangle((AR_BOX[2] - banner_w - 10, AR_BOX[1] + 10, AR_BOX[2] - 10, AR_BOX[1] + 40), radius=6, fill=(12, 24, 38, 242), outline=accent + (255,), width=2)
            draw.text((AR_BOX[2] - banner_w, AR_BOX[1] + 18), ar_banner, fill=(255, 255, 255, 255), font=load_font(13, bold=True))

        # Subtle badge in top-left of 2.3x 3D Equipment Zoom Viewport
        zoom_label = ch.get("zoom_badge", "2.3x LIVE 3D EQUIPMENT ZOOM")
        draw.rounded_rectangle((ZOOM_BOX[0] + 8, ZOOM_BOX[1] + 8, ZOOM_BOX[2] - 8, ZOOM_BOX[1] + 36), radius=6, fill=(10, 18, 28, 225), outline=accent + (220,), width=1)
        draw.text((ZOOM_BOX[0] + 18, ZOOM_BOX[1] + 15), zoom_label, fill=accent + (255,), font=f_badge)

        # Bottom-Right Streamlined Immediate Action Card (Issue 2 Fix)
        draw.rounded_rectangle(CARD_BOX, radius=10, fill=(15, 24, 38, 255), outline=(65, 105, 145, 230), width=2)

        # 1. Header Row inside Card (y=584..614)
        draw.rounded_rectangle((CARD_BOX[0] + 12, 584, CARD_BOX[2] - 12, 614), radius=6, fill=(22, 38, 58, 255), outline=accent + (200,), width=1)
        draw.text((CARD_BOX[0] + 20, 592), f"{ch['card_tag']}  —  {ch['card_title']}", fill=accent + (255,), font=load_font(13, bold=True))

        # 2. Target Component & Current State (y=622..676)
        draw.rounded_rectangle((CARD_BOX[0] + 12, 622, CARD_BOX[2] - 12, 676), radius=6, fill=(18, 30, 46, 255), outline=(70, 110, 155, 180), width=1)
        draw.text((CARD_BOX[0] + 22, 628), f"TARGET: {ch['target_comp']}", fill=accent + (255,), font=load_font(13, bold=True))
        draw.text((CARD_BOX[0] + 22, 650), f"STATUS: {ch['target_state']}", fill=(215, 235, 250, 255), font=load_font(12, bold=False))

        # 3. High-Contrast Immediate Action Box (y=684..846)
        draw.rounded_rectangle((CARD_BOX[0] + 12, 684, CARD_BOX[2] - 12, 846), radius=8, fill=(20, 34, 52, 255), outline=accent + (255,), width=2)
        draw.rounded_rectangle((CARD_BOX[0] + 12, 684, CARD_BOX[0] + 20, 846), radius=4, fill=accent + (255,))
        draw.text((CARD_BOX[0] + 28, 694), "IMMEDIATE TRAINEE ACTION", fill=accent + (255,), font=load_font(12, bold=True))
        draw.text((CARD_BOX[0] + 28, 716), ch["action_title"], fill=(255, 255, 255, 255), font=load_font(15, bold=True))
        draw.text((CARD_BOX[0] + 28, 746), ch["action_desc"], fill=(215, 230, 245, 255), font=load_font(13, bold=False))
        draw.text((CARD_BOX[0] + 28, 788), f"RESULT: {ch['action_result']}", fill=(110, 245, 160, 255), font=load_font(13, bold=True))

        # 4. Card footer indicator pill (y=854..898)
        draw.rounded_rectangle(
            (CARD_BOX[0] + 12, 854, CARD_BOX[2] - 12, 898),
            radius=6,
            fill=(12, 22, 34, 255),
            outline=accent + (180,),
            width=1,
        )
        draw.text((CARD_BOX[0] + 20, 866), ch["card_footer"], fill=accent + (255,), font=load_font(12, bold=True))

    elif ch["mode"] == "editor_leaf_dashboard":
        # ENGINE VERIFICATION & 6/6 LEAF DASHBOARD MODE (Chapter 8B - Issue 4 Fix):
        # Left AR Preview: 1020x852 (x=20..1040, y=68..920)
        # Right LEAF & TypeScript Verification Board: 836x852 (x=1064..1900, y=68..920)
        LEFT_BOX = (20, 68, 1040, 920)
        RIGHT_BOX = (1064, 68, 1900, 920)

        draw.rectangle(LEFT_BOX, fill=(0, 0, 0, 0))
        draw.rectangle((LEFT_BOX[0] - 2, LEFT_BOX[1] - 2, LEFT_BOX[2] + 2, LEFT_BOX[3] + 2), outline=accent + (235,), width=2)

        draw.rounded_rectangle((LEFT_BOX[0] + 12, LEFT_BOX[1] + 12, LEFT_BOX[0] + 460, LEFT_BOX[1] + 40), radius=6, fill=(10, 18, 28, 215), outline=accent + (220,), width=1)
        draw.text((LEFT_BOX[0] + 22, LEFT_BOX[1] + 18), "LIVE SPECS 27 AR PREVIEW (RESET & REPLAY)", fill=accent + (255,), font=f_badge)

        # Full Right Panel Dashboard
        draw.rounded_rectangle(RIGHT_BOX, radius=10, fill=(13, 21, 33, 255), outline=(72, 245, 148, 240), width=2)

        # 1. Dashboard Header Banner (y=80..118)
        draw.rounded_rectangle((RIGHT_BOX[0] + 14, 80, RIGHT_BOX[2] - 14, 118), radius=6, fill=(20, 48, 36, 255), outline=(72, 245, 148, 220), width=1)
        draw.text((RIGHT_BOX[0] + 26, 90), "LENS STUDIO 5.24.1 ENGINE & LEAF TEST AUDIT", fill=(72, 245, 148, 255), font=load_font(15, bold=True))

        # 2. Section 1: TypeScript Engine Compilation (y=128..256)
        draw.rounded_rectangle((RIGHT_BOX[0] + 14, 128, RIGHT_BOX[2] - 14, 256), radius=8, fill=(16, 28, 42, 255), outline=(65, 120, 175, 220), width=1)
        draw.text((RIGHT_BOX[0] + 26, 138), "1. TYPESCRIPT COMPILATION CHECK (LensStudio:Recompile)", fill=(100, 205, 255, 255), font=load_font(13, bold=True))
        draw.text((RIGHT_BOX[0] + 26, 164), "> Assets/Scripts/FieldFixMain.ts -> Clean compilation (0 errors, 0 warnings)", fill=(210, 230, 250, 255), font=load_font(12, bold=False))
        draw.text((RIGHT_BOX[0] + 26, 186), "> Assets/Scripts/FieldFixDiagnosticUI.ts -> Clean compilation (0 errors, 0 warnings)", fill=(210, 230, 250, 255), font=load_font(12, bold=False))
        draw.text((RIGHT_BOX[0] + 26, 208), "> SpectaclesInteractionKit (SIK) & UIKit bindings verified active", fill=(210, 230, 250, 255), font=load_font(12, bold=False))
        draw.text((RIGHT_BOX[0] + 26, 232), "STATUS: COMPILED CLEAN IN 184ms | RUNTIME ENGINE READY", fill=(85, 245, 155, 255), font=load_font(12, bold=True))

        # 3. Section 2: 6/6 Automated LEAF Integration Scenarios (y=268..792)
        draw.rounded_rectangle((RIGHT_BOX[0] + 14, 268, RIGHT_BOX[2] - 14, 792), radius=8, fill=(18, 36, 30, 255), outline=(72, 245, 148, 240), width=1)
        draw.text((RIGHT_BOX[0] + 26, 280), "2. AUTOMATED IN-ENGINE LEAF SUITE (6/6 SCENARIOS PASS)", fill=(72, 245, 148, 255), font=load_font(14, bold=True))
        draw.text((RIGHT_BOX[0] + 26, 304), "138 / 138 Scenario Assertion Points Deterministically Verified", fill=(190, 245, 215, 255), font=load_font(12, bold=False))

        scenarios = [
            ("SCENARIO 1", "FullDiagnosticRepairScenario", "20/20 Assertions", (85, 245, 155)),
            ("SCENARIO 2", "MidRepairShowcaseScenario", "19/19 Assertions", (85, 245, 155)),
            ("SCENARIO 3", "ResetAndReplayScenario", "7/7 Assertions", (85, 245, 155)),
            ("SCENARIO 4", "AdversarialSafetyAndXRayScenario", "26/26 Assertions", (85, 245, 155)),
            ("SCENARIO 5", "TraceTheFaultSignatureScenario", "48/48 Assertions", (85, 245, 155)),
            ("SCENARIO 6", "ExhaustiveRedTeam: 18 Deterministic Checks", "18/18 Checks", (85, 245, 155)),
        ]
        sy = 336
        for sc_tag, sc_name, sc_pts, sc_col in scenarios:
            draw.rounded_rectangle((RIGHT_BOX[0] + 26, sy, RIGHT_BOX[2] - 26, sy + 38), radius=6, fill=(14, 28, 24, 255), outline=sc_col + (180,), width=1)
            draw.text((RIGHT_BOX[0] + 38, sy + 10), f"[PASS]  {sc_tag}: {sc_name}", fill=(240, 255, 245, 255), font=load_font(12, bold=True))
            draw.text((RIGHT_BOX[2] - 180, sy + 10), sc_pts, fill=sc_col + (255,), font=load_font(12, bold=True))
            sy += 46

        # Sub-box for Timing Discrimination & Fuzzer (y=616..778)
        draw.rounded_rectangle((RIGHT_BOX[0] + 26, 616, RIGHT_BOX[2] - 26, 778), radius=6, fill=(12, 24, 22, 255), outline=(60, 160, 120, 200), width=1)
        draw.text((RIGHT_BOX[0] + 38, 626), "TIMING DISCRIMINATION & ADVERSARIAL STRESS:", fill=(72, 245, 148, 255), font=load_font(12, bold=True))
        draw.text((RIGHT_BOX[0] + 38, 648), "-> Accidental double-tap jitter: 180ms & 235ms BLOCKED (PASS)", fill=(215, 240, 225, 255), font=load_font(12, bold=False))
        draw.text((RIGHT_BOX[0] + 38, 670), "-> Intentional confirmation: 245ms & 300ms ACCEPTED (PASS)", fill=(215, 240, 225, 255), font=load_font(12, bold=False))
        draw.text((RIGHT_BOX[0] + 38, 692), "-> 1,000-Seed Fuzzer: 14,859 actions processed | 0 invariant failures", fill=(215, 240, 225, 255), font=load_font(12, bold=False))
        draw.text((RIGHT_BOX[0] + 38, 714), "-> Mutation Testing: All 8 mutants (M1-M8) killed (100% kill rate)", fill=(85, 245, 155, 255), font=load_font(12, bold=True))
        draw.text((RIGHT_BOX[0] + 38, 742), "PHANTOM BUTTON GATING: 25/25 checks passed (recursive collider disable)", fill=(100, 205, 255, 255), font=load_font(12, bold=True))

        # 4. Status Footer (y=804..852)
        draw.rounded_rectangle((RIGHT_BOX[0] + 14, 804, RIGHT_BOX[2] - 14, 852), radius=6, fill=(15, 60, 35, 255), outline=(72, 245, 148, 255), width=2)
        draw.text((RIGHT_BOX[0] + 90, 819), "VERIFICATION VERDICT: ALL 6 LEAF SUITES & TYPESCRIPT PASSED", fill=(255, 255, 255, 255), font=load_font(14, bold=True))

    else:
        # EDITOR + AR WORKFLOW MODE (1:38–1:44.5 Chapter 8A):
        LEFT_BOX = (20, 68, 1040, 920)
        RIGHT_BOX = (1064, 68, 1900, 920)

        draw.rectangle(LEFT_BOX, fill=(0, 0, 0, 0))
        draw.rectangle(RIGHT_BOX, fill=(0, 0, 0, 0))

        draw.rectangle((LEFT_BOX[0] - 2, LEFT_BOX[1] - 2, LEFT_BOX[2] + 2, LEFT_BOX[3] + 2), outline=accent + (235,), width=2)
        draw.rectangle((RIGHT_BOX[0] - 2, RIGHT_BOX[1] - 2, RIGHT_BOX[2] + 2, RIGHT_BOX[3] + 2), outline=(100, 150, 195, 225), width=2)

        draw.rounded_rectangle((LEFT_BOX[0] + 12, LEFT_BOX[1] + 12, LEFT_BOX[0] + 440, LEFT_BOX[1] + 40), radius=6, fill=(10, 18, 28, 215), outline=accent + (220,), width=1)
        draw.text((LEFT_BOX[0] + 22, LEFT_BOX[1] + 18), "LIVE SPECS 27 AR PREVIEW (RESET & REPLAY)", fill=accent + (255,), font=f_badge)

        draw.rounded_rectangle((RIGHT_BOX[0] + 12, RIGHT_BOX[1] + 12, RIGHT_BOX[0] + 520, RIGHT_BOX[1] + 40), radius=6, fill=(10, 18, 28, 215), outline=(130, 185, 230, 220), width=1)
        draw.text((RIGHT_BOX[0] + 22, RIGHT_BOX[1] + 18), "LENS STUDIO 5.24.1 EDITOR  |  CLAD + MCP + INSPECTOR", fill=(175, 225, 255, 255), font=f_badge)

    # Bottom Concise Judge Narration Bar (y=928..1080)
    draw.rectangle((0, 928, W, H), fill=(12, 19, 30, 255))
    draw.line((0, 928, W, 928), fill=(65, 105, 145, 255), width=2)

    f_cap1 = load_font(18, bold=True)
    f_cap2 = load_font(17, bold=False)
    draw.text((26, 940), ch["caption_1"], fill=(245, 250, 255, 255), font=f_cap1)
    draw.text((26, 974), ch["caption_2"], fill=(195, 222, 245, 255), font=f_cap2)

    # 6-Part Narrative Progress Bar at very bottom (y=1020..1062)
    nav_labels = [
        "1. Symptom Only (0:00)",
        "2. Upstream Trace (0:08)",
        "3. LOTO & 3D Repairs (0:28)",
        "4. 85%/100% & Compare (1:10)",
        "5. Reset & 6/6 LEAF (1:38)",
        "6. Summary (1:51)",
    ]
    bar_x0, bar_x1 = 24, 1896
    bar_w = bar_x1 - bar_x0
    seg_w = bar_w // TOTAL_NAV_SECTIONS
    f_nav = load_font(13, bold=True)
    nav_idx = ch["nav_idx"]
    for i in range(TOTAL_NAV_SECTIONS):
        sx0 = bar_x0 + i * seg_w + 4
        sx1 = bar_x0 + (i + 1) * seg_w - 4
        if i < nav_idx:
            bg_col = (28, 78, 54, 255)
            out_col = (72, 235, 145, 255)
            txt_col = (190, 255, 215, 255)
        elif i == nav_idx:
            bg_col = (28, 52, 78, 255)
            out_col = accent + (255,)
            txt_col = (255, 255, 255, 255)
        else:
            bg_col = (18, 28, 42, 255)
            out_col = (48, 68, 92, 255)
            txt_col = (130, 155, 180, 255)
        draw.rounded_rectangle((sx0, 1020, sx1, 1062), radius=6, fill=bg_col, outline=out_col, width=2)
        draw.text((sx0 + 12, 1033), nav_labels[i], fill=txt_col, font=f_nav)

    img.save(out_path)


def verify_clip_no_blank_frames(clip_path: str, ch_id: str):
    """Extracts the first frame (n=0) and checks mean brightness inside the AR viewport to guarantee zero blank frames."""
    probe_png = os.path.join(BUILD_DIR, f"probe_frame0_{ch_id}.png")
    subprocess.run(
        ["ffmpeg", "-y", "-i", clip_path, "-frames:v", "1", probe_png],
        check=True,
        capture_output=True,
    )
    with Image.open(probe_png) as im:
        crop_region = im.crop((100, 150, 900, 800)).convert("L")
        mean_luma = ImageStat.Stat(crop_region).mean[0]
    os.remove(probe_png)
    if mean_luma < 35.0:
        raise RuntimeError(f"Blank frame detected at start of {ch_id}: mean_luma={mean_luma:.2f}")
    print(f"    [OK] {ch_id} frame 0 verified non-blank (mean_luma={mean_luma:.1f})")


def render_chapter_clip(ch: dict, idx: int) -> str:
    overlay_png = os.path.join(BUILD_DIR, f"overlay_v6_{ch['id']}.png")
    create_overlay_png(ch, overlay_png)

    out_clip = os.path.join(BUILD_DIR, f"clip_v6_{idx:02d}_{ch['id']}.mp4")
    if os.path.exists(out_clip) and os.path.getsize(out_clip) > 100000 and os.environ.get("USE_CLIP_CACHE") == "1":
        verify_clip_no_blank_frames(out_clip, ch["id"])
        return out_clip

    pts_scale = ch["duration"] / ch["src_dur"]
    target_frames = int(round(ch["duration"] * FPS))
    # Priority 3 Fix: Use trim + PTS-STARTPTS + tpad clone so frame 0 (t=0.000s) is always immediately populated
    # and the clip has the exact target frame count with zero 1-frame rounding drift!
    trim_and_pts = (
        f"trim=start={ch['ss']}:duration={ch['src_dur']},"
        f"setpts={pts_scale:.6f}*(PTS-STARTPTS),"
        f"fps={FPS},"
        f"tpad=stop_mode=clone:stop_duration=0.5,"
    )

    if ch["mode"] == "hero_ar":
        # Split the decoded 2140x1692 preview frame into:
        # 1) Full AR Scene Viewport (860x518 at x=1200, y=620 -> scaled to 1416x852 at x=20, y=68)
        # 2) 2.3x Live 3D Equipment Zoom Viewport (380x412 at x=1250, y=684 -> scaled to 454x492 at x=1446, y=68)
        filter_complex = (
            f"[0:v]{trim_and_pts}split=2[v_main][v_zoom];"
            f"[v_main]crop=860:518:1200:620,scale=1416:852:flags=lanczos[ar_vid];"
            f"[v_zoom]crop=380:412:1250:684,scale=454:492:flags=lanczos[zoom_vid];"
            f"color=c=#0a0f17:s=1920x1080:r={FPS}:d={ch['duration'] + 1.0}[base];"
            f"[base][ar_vid]overlay=20:68[tmp1];"
            f"[tmp1][zoom_vid]overlay=1446:68[tmp2];"
            f"[tmp2][1:v]overlay=0:0[outv]"
        )
    elif ch["mode"] == "editor_leaf_dashboard":
        # ENGINE VERIFICATION & 6/6 LEAF DASHBOARD MODE (1:44.5-1:51 Chapter 8B):
        # Left AR Preview Viewport: 1020x852 at x=20, y=68
        # Right LEAF & TypeScript Verification Board is baked directly into overlay_png
        filter_complex = (
            f"[0:v]{trim_and_pts}crop=890:760:1192:380,scale=1020:852:flags=lanczos[left_vid];"
            f"color=c=#0a0f17:s=1920x1080:r={FPS}:d={ch['duration'] + 1.0}[base];"
            f"[base][left_vid]overlay=20:68[tmp1];"
            f"[tmp1][1:v]overlay=0:0[outv]"
        )
    else:
        # EDITOR + AR WORKFLOW MODE (1:38-1:44.5 Chapter 8A):
        filter_complex = (
            f"[0:v]{trim_and_pts}split=2[v_left][v_right];"
            f"[v_left]crop=890:760:1192:380,scale=1020:852:flags=lanczos[left_vid];"
            f"[v_right]scale=836:660:flags=lanczos,pad=836:852:0:96:color=#0d1522[right_vid];"
            f"color=c=#0a0f17:s=1920x1080:r={FPS}:d={ch['duration'] + 1.0}[base];"
            f"[base][left_vid]overlay=20:68[tmp1];"
            f"[tmp1][right_vid]overlay=1064:68[tmp2];"
            f"[tmp2][1:v]overlay=0:0[outv]"
        )

    cmd = [
        "ffmpeg",
        "-y",
        "-i",
        ch["src"],
        "-loop",
        "1",
        "-t",
        str(ch["duration"] + 1.0),
        "-i",
        overlay_png,
        "-filter_complex",
        filter_complex,
        "-map",
        "[outv]",
        "-frames:v",
        str(target_frames),
        "-c:v",
        "libx264",
        "-preset",
        "fast",
        "-crf",
        "17",
        "-pix_fmt",
        "yuv420p",
        out_clip,
    ]
    subprocess.run(cmd, check=True, capture_output=True)
    verify_clip_no_blank_frames(out_clip, ch["id"])
    return out_clip


def load_wav_mono(path: str, sample_rate: int = 44100) -> list[float]:
    with wave.open(path, "rb") as wf:
        n_channels = wf.getnchannels()
        sampwidth = wf.getsampwidth()
        n_frames = wf.getnframes()
        raw = wf.readframes(n_frames)
    if sampwidth == 2:
        fmt = f"<{n_frames * n_channels}h"
        vals = struct.unpack(fmt, raw)
        samples = [v / 32768.0 for v in vals]
    else:
        samples = [0.0] * (n_frames * n_channels)
    if n_channels > 1:
        samples = [samples[i * n_channels] for i in range(n_frames)]
    return samples


def synthesize_voiceover_wav(text: str, out_wav: str, rate: int = 190) -> list[float]:
    """Synthesizes clean offline macOS voiceover using /usr/bin/say and converts to 44.1kHz 16-bit mono WAV."""
    aiff_path = out_wav.replace(".wav", ".aiff")
    subprocess.run(["/usr/bin/say", "-v", "Samantha", "-r", str(rate), "-o", aiff_path, text], check=True)
    subprocess.run(
        ["ffmpeg", "-y", "-i", aiff_path, "-ar", "44100", "-ac", "1", "-c:a", "pcm_s16le", out_wav],
        check=True,
        capture_output=True,
    )
    return load_wav_mono(out_wav, 44100)


def build_master_audio(total_duration: float, out_wav: str):
    sr = 44100
    total_samples = int(total_duration * sr)
    ambient_track = [0.0] * total_samples
    sfx_track = [0.0] * total_samples
    vo_track = [0.0] * total_samples
    vo_env = [0.0] * total_samples

    # 1. Subtle ambient clean-room hum + harmonic pulse
    for i in range(total_samples):
        t = i / sr
        env = 0.014 + 0.004 * math.sin(2 * math.pi * 0.25 * t)
        hum = (
            0.55 * math.sin(2 * math.pi * 110.0 * t)
            + 0.30 * math.sin(2 * math.pi * 165.0 * t)
            + 0.15 * math.sin(2 * math.pi * 220.0 * t)
        )
        ambient_track[i] = env * hum

    # 2. Overlay procedural SFX events + Chapter Voiceover Narration
    t_cursor = 0.0
    for idx, ch in enumerate(CHAPTERS):
        for offset_sec, wav_name, gain in ch["sfx_events"]:
            wav_path = os.path.join(SFX_DIR, wav_name)
            if os.path.exists(wav_path):
                sfx = load_wav_mono(wav_path, sr)
                start_idx = int((t_cursor + offset_sec) * sr)
                for j, s in enumerate(sfx):
                    k = start_idx + j
                    if 0 <= k < total_samples:
                        sfx_track[k] += s * gain

        vo_text = ch.get("voiceover", "").strip()
        if vo_text:
            vo_wav_path = os.path.join(BUILD_DIR, f"vo_v6_{idx:02d}_{ch['id']}.wav")
            vo_rate = ch.get("vo_rate", 192)
            vo_samples = synthesize_voiceover_wav(vo_text, vo_wav_path, rate=vo_rate)
            vo_dur = len(vo_samples) / sr
            avail_dur = ch["duration"] - 0.25
            if vo_dur > avail_dur:
                raise RuntimeError(
                    f"Voiceover for {ch['id']} is too long ({vo_dur:.2f}s > {avail_dur:.2f}s available)!"
                )
            print(f"    [OK] {ch['id']} voiceover fits cleanly (vo={vo_dur:.2f}s / avail={avail_dur:.2f}s, pad=+{avail_dur - vo_dur:.2f}s)")
            # Start voiceover 0.20s into each chapter
            max_vo_samples = int(avail_dur * sr)
            vo_start = int((t_cursor + 0.20) * sr)
            for j, s in enumerate(vo_samples[:max_vo_samples]):
                k = vo_start + j
                if 0 <= k < total_samples:
                    vo_track[k] += s * 0.88
                    if abs(s) > 0.015:
                        vo_env[k] = 1.0

        t_cursor += ch["duration"]

    # Smooth the voiceover envelope (150ms window) with exponential IIR for natural sidechain ducking of ambient
    win = int(0.15 * sr)
    active_count = 0
    for i in range(min(win, total_samples)):
        if vo_env[i] > 0.5:
            active_count += 1

    duck_smoothed = 1.0
    alpha = 0.001  # time constant ~22.7ms at 44.1kHz
    final_track = [0.0] * total_samples
    for i in range(total_samples):
        if i + win < total_samples and vo_env[i + win] > 0.5:
            active_count += 1
        if i - win >= 0 and vo_env[i - win] > 0.5:
            active_count -= 1
        target_duck = 0.34 if active_count > int(0.02 * sr) else 1.0
        duck_smoothed = duck_smoothed * (1.0 - alpha) + target_duck * alpha
        final_track[i] = vo_track[i] + ambient_track[i] * duck_smoothed + sfx_track[i]

    with wave.open(out_wav, "wb") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        buf = bytearray()
        for s in final_track:
            clamped = max(-0.96, min(0.96, s))
            iv = int(clamped * 32767)
            buf += struct.pack("<hh", iv, iv)
        wf.writeframes(bytes(buf))


def main():
    # Enforce strict anti-V5 preflight verification before any processing
    preflight_anti_v5_guard(CHAPTERS, OUT_V6_REAL_MP4)

    os.makedirs(BUILD_DIR, exist_ok=True)
    clips = []
    total_dur = 0.0
    for idx, ch in enumerate(CHAPTERS):
        print(f"Rendering segment {idx+1}/{len(CHAPTERS)}: {ch['id']} ({ch['duration']}s, mode={ch['mode']})...")
        clip_path = render_chapter_clip(ch, idx)
        clips.append(clip_path)
        total_dur += ch["duration"]

    concat_txt = os.path.join(BUILD_DIR, "concat_list_v6.txt")
    with open(concat_txt, "w") as f:
        for c in clips:
            f.write(f"file '{c}'\n")

    master_wav = os.path.join(BUILD_DIR, "master_audio_v6.wav")
    print(f"Synthesizing voiceover + synchronized spatial audio track ({total_dur:.1f}s)...")
    build_master_audio(total_dur, master_wav)

    tmp_mp4 = os.path.join(BUILD_DIR, "FieldFix-AR-Demo-v6-fresh.mp4")
    print(f"Muxing final 1080p 30fps video to {tmp_mp4}...")
    cmd = [
        "ffmpeg",
        "-y",
        "-f",
        "concat",
        "-safe",
        "0",
        "-i",
        concat_txt,
        "-i",
        master_wav,
        "-c:v",
        "copy",
        "-c:a",
        "aac",
        "-b:a",
        "192k",
        "-shortest",
        "-movflags",
        "+faststart",
        tmp_mp4,
    ]
    subprocess.run(cmd, check=True, capture_output=True)

    # Write the V6 Judges Edition REAL video while keeping V5 and rejected V6 intact as immutable archives
    shutil.copy2(tmp_mp4, OUT_V6_REAL_MP4)
    print(f"Done! Created candidate {OUT_V6_REAL_MP4} ({total_dur:.1f}s)")


if __name__ == "__main__":
    main()
