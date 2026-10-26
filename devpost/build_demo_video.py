#!/usr/bin/env python3
"""
Builds the competition-grade 120.0-second (2m 00s) 1080p 30fps narrated demonstration video
for FieldFix AR (`devpost/FieldFix-AR-Demo.mp4`) directly from continuous 60fps Lens Studio 5.24.1
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
from PIL import Image, ImageDraw, ImageFont, ImageStat

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEVPOST_DIR = os.path.join(BASE_DIR, "devpost")
BUILD_DIR = os.path.join(DEVPOST_DIR, "_video_build")
SFX_DIR = os.path.join(BASE_DIR, "Assets", "GeneratedSFX")
OUT_V5_MP4 = os.path.join(DEVPOST_DIR, "FieldFix-AR-Demo-V5-TraceTheFault.mp4")
OUT_MP4 = os.path.join(DEVPOST_DIR, "FieldFix-AR-Demo.mp4")
ROOT_DEVPOST_MP4 = os.path.join(os.path.dirname(BASE_DIR), "devpost", "FieldFix-AR-Demo.mp4")
ROOT_MP4 = os.path.join(os.path.dirname(BASE_DIR), "FieldFix-AR-Demo.mp4")

W, H = 1920, 1080
FPS = 30

CHAPTERS = [
    {
        "id": "ch01a_action_hook",
        "nav_idx": 0,
        "mode": "hero_ar",
        "src": os.path.join(BUILD_DIR, "clean_v5_take5.mp4"),
        "ss": 10.5,
        "src_dur": 3.3,
        "duration": 5.5,
        "step_badge": "0:00 – 0:05.5   |   1A. SIGNATURE INTERACTION: 'TRACE THE FAULT' IN LIVE SPECS AR",
        "title": "FieldFix AR — Spatial Cause-and-Effect Fault Tracing & Safety Training on Snap SPECS",
        "zoom_badge": "2.3x LIVE 3D ZOOM: SPATIAL SCAN & UPSTREAM TRACE",
        "caption_1": "FieldFix AR turns industrial maintenance into a spatial cause-and-effect investigation: trainees trace a 2-zone coolant fault upstream in 3D.",
        "caption_2": "Pinching 3D components reveals localized X-Ray internals, enforces LOTO safety interlocks, and restores laminar flow step by step.",
        "card_tag": "SIGNATURE AR EXPERIENCE",
        "card_title": "Trace The Fault",
        "card_items": [
            ("2-ZONE COOLANT LOOP", "Fast upstream vs. choked 18% downstream.", (72, 225, 255)),
            ("AUTO-X-RAY CUTAWAY", "Pinching a part exposes internal fault.", (255, 205, 75)),
            ("LOTO INTERLOCK", "Blocks unsafe out-of-order repair steps.", (85, 245, 155)),
        ],
        "card_footer": "GENUINE LENS STUDIO 5.24.1 SPECS PREVIEW",
        "accent": (72, 225, 255),
        "voiceover": (
            "FieldFix A R brings spatial fault tracing and X-Ray training to Snap SPECS."
        ),
        "sfx_events": [(0.4, "ScanSweep.wav", 0.65), (2.8, "ButtonClick.wav", 0.60)],
    },
    {
        "id": "ch01b_spatial_concept",
        "nav_idx": 0,
        "mode": "hero_ar",
        "src": os.path.join(BUILD_DIR, "clean_v5_take5.mp4"),
        "ss": 1.0,
        "src_dur": 5.5,
        "duration": 6.5,
        "step_badge": "0:05.5 – 0:12   |   1B. PROGRESSIVE DISCOVERY: VISIBLE SYMPTOM AT TR-309 ONLY",
        "title": "Progressive Discovery: Only TR-309's 116°C Overheat Symptom Is Visible Before Tracing",
        "zoom_badge": "2.3x LIVE 3D ZOOM: TR-309 SYMPTOM & UNINSPECTED PARTS",
        "caption_1": "First-run onboarding withholds upstream answers: only the TR-309 overheat symptom (116°C) is shown while PR-204 and CV-101 read [UNINSPECTED].",
        "caption_2": "Trainees must scan and follow the 3D chevron upstream to discover the PR-204 bottleneck and CV-101 root cause through investigation.",
        "card_tag": "PROGRESSIVE DISCOVERY",
        "card_title": "No Premature Spoilers",
        "card_items": [
            ("SYMPTOM: TR-309", "116°C overheat crown visible initially.", (255, 95, 95)),
            ("UPSTREAM: PR-204", "Marked [UNINSPECTED] until traced.", (255, 195, 85)),
            ("INTAKE: CV-101", "Root cause hidden until trace completes.", (72, 225, 255)),
        ],
        "card_footer": "TRACE: [TR-309 SYMPTOM] -> [? UPSTREAM] -> [? ROOT CAUSE]",
        "accent": (72, 225, 255),
        "voiceover": (
            "Initially, only the overheated relay symptom is shown while upstream parts remain uninspected."
        ),
        "sfx_events": [(0.5, "ButtonClick.wav", 0.50)],
    },
    {
        "id": "ch02_scan_and_xray",
        "nav_idx": 1,
        "mode": "hero_ar",
        "src": os.path.join(BUILD_DIR, "clean_v5_take5.mp4"),
        "ss": 11.0,
        "src_dur": 12.6,
        "duration": 16.0,
        "step_badge": "0:12 – 0:28   |   2. UPSTREAM SPATIAL FAULT TRACE & LOCALIZED AUTO-X-RAY CUTAWAY",
        "title": "Inspecting Upstream Reveals PR-204's 142 PSI Bottleneck & CV-101's Root Cause",
        "zoom_badge": "2.3x LIVE 3D ZOOM: UPSTREAM TRACE & AUTO-X-RAY",
        "caption_1": "Pinching [SCAN] localizes the TR-309 overheat (1/3) and guides the trainee upstream to PR-204 without spoiling the answer.",
        "caption_2": "Inspecting PR-204 (2/3) reveals the 142 PSI vapor lock via Auto-X-Ray; tracing upstream to CV-101 (3/3) uncovers the 18% cavitation root cause.",
        "card_tag": "UPSTREAM FAULT TRACE",
        "card_title": "Step-by-Step Discovery",
        "card_items": [
            ("TRACE 1/3: TR-309", "Overheat symptom localized; guides upstream.", (255, 95, 95)),
            ("TRACE 2/3: PR-204", "Inspection reveals 142 PSI vapor lock.", (255, 165, 65)),
            ("TRACE 3/3: CV-101", "Completed trace reveals 18% root cause.", (72, 225, 255)),
        ],
        "card_footer": "LOCALIZED AUTO-X-RAY: REVEALED ON INSPECTION",
        "accent": (255, 205, 70),
        "voiceover": (
            "Scanning localizes the relay symptom and guides the trainee upstream. "
            "Inspecting the regulator reveals the vapor lock in X-Ray before tracing to the intake valve root cause."
        ),
        "sfx_events": [(0.8, "ScanSweep.wav", 0.80), (2.4, "FaultAlert.wav", 0.65), (5.2, "ButtonClick.wav", 0.65), (9.8, "ButtonClick.wav", 0.60)],
    },
    {
        "id": "ch03_safety_interlock",
        "nav_idx": 2,
        "mode": "hero_ar",
        "src": os.path.join(BUILD_DIR, "clean_v5_take5.mp4"),
        "ss": 24.2,
        "src_dur": 3.5,
        "duration": 14.0,
        "step_badge": "0:28 – 0:42   |   3. INCORRECT ACTION & CONTEXTUAL LOTO SAFETY INTERLOCK",
        "title": "Attempting to Bleed PR-204 Before Isolating CV-101 Triggers LOTO Safety Interlock",
        "zoom_badge": "2.3x LIVE 3D ZOOM: CRIMSON LOTO HAZARD BLOCK",
        "ar_banner": "RUN 1 — OUT-OF-ORDER PINCH LOGS LOTO VIOLATION #1 (-15%)",
        "caption_1": "Attempting to purge the 142 PSI Regulator (Step 2) before locking out the CV-101 Intake Valve (Step 1) triggers the LOTO Safety Interlock.",
        "caption_2": "The 3D regulator halo flashes crimson, logs LOTO Violation #1 (-15% score penalty), and redirects focus upstream to Step 1/4 [CV-101].",
        "card_tag": "LOTO SAFETY INTERLOCK",
        "card_title": "Unsafe Action Blocked",
        "card_items": [
            ("OUT-OF-ORDER PINCH", "Blocks PR-204 purge while intake is live.", (255, 95, 95)),
            ("3D HAZARD FLASH", "Regulator flashes red; redirects to CV-101.", (255, 165, 65)),
            ("VIOLATION LOGGED", "Records LOTO Violation #1 (-15% score).", (72, 225, 255)),
        ],
        "card_footer": "LOTO BLOCKED: PINCH [CV-101] FIRST!",
        "accent": (255, 95, 95),
        "voiceover": (
            "If a trainee tries to bleed the regulator before isolating the intake valve, "
            "the Lockout-Tagout Safety Interlock blocks the action, logs one safety violation, and redirects upstream to Step One."
        ),
        "sfx_events": [(1.5, "ButtonClick.wav", 0.65), (6.2, "FaultAlert.wav", 0.85)],
    },
    {
        "id": "ch04_steps1_and_2",
        "nav_idx": 2,
        "mode": "hero_ar",
        "src": os.path.join(BUILD_DIR, "clean_v5_take5.mp4"),
        "ss": 29.5,
        "src_dur": 6.3,
        "duration": 15.0,
        "step_badge": "0:42 – 0:57   |   4. SYNCHRONIZED 3D REPAIRS: VALVE LOTO & REGULATOR PURGE",
        "title": "Direct 3D Hand Pinches Lock CV-101 (-90°) & Purge PR-204 (142 -> 38 PSI)",
        "zoom_badge": "2.3x LIVE 3D ZOOM: LEVER LOTO & GAUGE PURGE",
        "caption_1": "Step 1 (Isolate): Pinching 3D CV-101 rotates the yellow lever 90° clockwise, snaps on the red LOTO clasp, and halts pipe flow to 0%.",
        "caption_2": "Step 2 (Depressurize): Pinching 3D PR-204 purges trapped vapor—the gauge needle sweeps to 38 PSI (green) and clears the bottleneck ring.",
        "card_tag": "3D MECHANICAL RESPONSE",
        "card_title": "Steps 1 & 2 Executed",
        "card_items": [
            ("STEP 1: CV-101 VALVE", "Lever rotates -90°; red LOTO clasp snaps on.", (72, 225, 255)),
            ("STEP 2: PR-204 GAUGE", "Needle sweeps 142 PSI (red) -> 38 PSI (green).", (85, 245, 155)),
            ("BOTTLENECK CLEARED", "Vapor lock cleared; manifold cools to 82°C.", (255, 200, 75)),
        ],
        "card_footer": "PROGRESS: 2 / 4 STEPS VERIFIED ([1:LOTO OK] [2:PURGE OK])",
        "accent": (255, 165, 60),
        "voiceover": (
            "In Step One, pinching the three-D valve rotates the yellow lever ninety degrees, snaps on a Lockout clasp, and halts flow. "
            "In Step Two, pinching the regulator purges trapped vapor from one-forty-two to thirty-eight P-S-I."
        ),
        "sfx_events": [(1.8, "RepairStepConfirm.wav", 0.85), (8.2, "RepairStepConfirm.wav", 0.85)],
    },
    {
        "id": "ch05_step3_relay",
        "nav_idx": 2,
        "mode": "hero_ar",
        "src": os.path.join(BUILD_DIR, "clean_v5_take5.mp4"),
        "ss": 35.8,
        "src_dur": 3.4,
        "duration": 13.0,
        "step_badge": "0:57 – 1:10   |   5. SYNCHRONIZED 3D REPAIRS: THERMAL RELAY CORE RESEAT",
        "title": "Pinching 3D TR-309 Retracts the Plunger, Extinguishes Overheat & Cools to 46°C",
        "zoom_badge": "2.3x LIVE 3D ZOOM: RELAY PLUNGER RETRACTION",
        "caption_1": "Step 3 (Reseat Relay): Pinching the 3D TR-309 relay core retracts the tripped plunger into its collar and extinguishes the overheat crown.",
        "caption_2": "The spatial badge updates to [46C LATCH RESET] and the 3D target chevron returns to CV-101 for final re-pressurization.",
        "card_tag": "3D MECHANICAL RESPONSE",
        "card_title": "Step 3: Relay Reseated",
        "card_items": [
            ("STEP 3: TR-309 RELAY", "Pinch retracts raised thermal trip plunger.", (85, 245, 155)),
            ("OVERHEAT CLEARED", "Core temperature drops 118°C -> 46°C.", (72, 225, 255)),
            ("NEXT TARGET", "3D chevron guides back to CV-101 (Step 4).", (255, 210, 85)),
        ],
        "card_footer": "PROGRESS: 3 / 4 STEPS VERIFIED ([3:RESEAT OK])",
        "accent": (72, 225, 255),
        "voiceover": (
            "With pressure safely bled, pinching the three-D thermal relay core in Step Three retracts the tripped plunger into its cooling sleeve, "
            "dropping core temperature to forty-six Celsius."
        ),
        "sfx_events": [(2.6, "RepairStepConfirm.wav", 0.85)],
    },
    {
        "id": "ch06a_run1_score_85",
        "nav_idx": 3,
        "mode": "hero_ar",
        "src": os.path.join(BUILD_DIR, "clean_v5_take5.mp4"),
        "ss": 39.2,
        "src_dur": 3.5,
        "duration": 7.0,
        "step_badge": "1:10 – 1:17   |   6A. RUN 1 COMPLETION SCORECARD: 85% (B+ SAFETY REDIRECTED)",
        "title": "Run 1 Completes at 85% (B+ Safety Redirected | Trace: 3/3 | LOTO Blocks: 1)",
        "zoom_badge": "2.3x LIVE 3D ZOOM: 100% LAMINAR FLOW (85% B+)",
        "ar_banner": "RUN 1 RESULT — 1 LOTO VIOLATION AT 0:28 -> 85% (B+)",
        "caption_1": "Completing Step 4 on Run 1 restores 100% laminar flow (42°C | 45 PSI) and grades the trainee 85% (B+ SAFETY REDIRECTED | LOTO Blocks: 1).",
        "caption_2": "All 6 flow rings spin in synchronized emerald green while the scorecard reflects the earlier out-of-order LOTO violation.",
        "card_tag": "RUN 1 SCORECARD (85% B+)",
        "card_title": "1 Violation = 85% B+",
        "card_items": [
            ("RUN 1 GRADE", "85% (B+ SAFETY REDIRECTED) on HUD.", (255, 210, 85)),
            ("TRACE & LOTO", "Trace: 3/3 | LOTO Blocks: 1 (-15%).", (255, 140, 95)),
            ("NOMINAL TELEMETRY", "42°C | 45 PSI | 100% Laminar Flow.", (85, 245, 155)),
        ],
        "card_footer": "RUN 1 SCORE: 85% (B+ SAFETY REDIRECTED | BLOCKS: 1)",
        "accent": (255, 210, 85),
        "voiceover": (
            "Completing Run One restores laminar flow and scores eighty-five percent, B-plus, for the earlier violation."
        ),
        "sfx_events": [(1.0, "DiagnosticComplete.wav", 0.90)],
    },
    {
        "id": "ch06b_reset_to_run2_100",
        "nav_idx": 3,
        "mode": "hero_ar",
        "src": os.path.join(BUILD_DIR, "clean_v5_take2.mp4"),
        "ss": 6.5,
        "src_dur": 4.5,
        "duration": 7.0,
        "step_badge": "1:17 – 1:24   |   6B. RUN 2 — CLEAN ATTEMPT AFTER RESET: 100% (A+ FLAWLESS LOTO)",
        "title": "Run 2 — Clean Attempt After Reset Earns 100% (A+ Flawless LOTO)",
        "zoom_badge": "2.3x LIVE 3D ZOOM: RUN 2 — CLEAN ATTEMPT (100% A+)",
        "ar_banner": "RUN 2 — CLEAN ATTEMPT AFTER RESET (0 VIOLATIONS -> 100% A+)",
        "caption_1": "Run 2 — Clean Attempt After Reset: Tracing and executing all 4 steps in strict LOTO order with 0 violations earns 100% (A+ FLAWLESS LOTO).",
        "caption_2": "Pinching 3D CV-101 removes the LOTO clasp, rotates the yellow lever +90° open, and restores 100% laminar flow across both zones.",
        "card_tag": "RUN 2 — CLEAN ATTEMPT",
        "card_title": "0 Violations = 100% A+",
        "card_items": [
            ("RUN 2 (AFTER RESET)", "Clean attempt after Reset with 0 violations.", (85, 245, 155)),
            ("FLAWLESS GRADE", "100% (A+ FLAWLESS LOTO) on Scorecard.", (72, 225, 255)),
            ("FULL RESTORATION", "CV-101 opens +90°; all halos turn green.", (85, 245, 155)),
        ],
        "card_footer": "RUN 2 SCORE: 100% (A+ FLAWLESS LOTO | BLOCKS: 0)",
        "accent": (72, 245, 148),
        "voiceover": (
            "On Run Two after reset, a clean sequence with zero violations earns one hundred percent, A-plus."
        ),
        "sfx_events": [(1.8, "DiagnosticComplete.wav", 0.95)],
    },
    {
        "id": "ch07_before_after_compare",
        "nav_idx": 3,
        "mode": "hero_ar",
        "src": os.path.join(BUILD_DIR, "clean_v5_take2.mp4"),
        "ss": 9.5,
        "src_dur": 5.0,
        "duration": 14.0,
        "step_badge": "1:24 – 1:38   |   7. BEFORE / AFTER SPATIAL STATE COMPARISON MODE",
        "title": "One-Pinch Before/After Toggle Compares Choked Fault (118°C) vs. Nominal (42°C)",
        "zoom_badge": "2.3x LIVE 3D ZOOM: BEFORE (FAULT) <-> AFTER (NOMINAL)",
        "caption_1": "Pinching [COMPARE BEFORE/AFTER] toggles the 3D machine and flow rings between the choked fault snapshot and verified 100% laminar state.",
        "caption_2": "Trainees can inspect how the PR-204 vapor lock choked downstream flow and how the 4-step LOTO repair restored thermal balance.",
        "card_tag": "BEFORE / AFTER COMPARE",
        "card_title": "Fault vs. Nominal Toggle",
        "card_items": [
            ("BEFORE (FAULT VIEW)", "118°C Overheat | 142 PSI | 18% Choked.", (255, 165, 65)),
            ("AFTER (NOMINAL VIEW)", "42°C Cooled | 45 PSI | 100% Laminar.", (85, 245, 155)),
            ("COMBINES WITH X-RAY", "Inspect internal parts in both states.", (72, 225, 255)),
        ],
        "card_footer": "COMPARE MODE: FAULT SNAPSHOT <-> VERIFIED NOMINAL",
        "accent": (72, 225, 255),
        "voiceover": (
            "After completion, trainees can pinch Compare Before and After to toggle the three-D machine and flow rings "
            "between the initial choked fault snapshot and the verified nominal state."
        ),
        "sfx_events": [(1.2, "ButtonClick.wav", 0.70), (6.5, "ButtonClick.wav", 0.70), (10.5, "ButtonClick.wav", 0.65)],
    },
    {
        "id": "ch08a_editor_reset",
        "nav_idx": 4,
        "mode": "editor_split",
        "src": os.path.join(BUILD_DIR, "clean_v5_take5.mp4"),
        "ss": 40.5,
        "src_dur": 3.5,
        "duration": 6.5,
        "step_badge": "1:38 – 1:44.5   |   8A. STEP NAVIGATION, [RESET UNIT] & LENS STUDIO CLAD WORKFLOW",
        "title": "One-Pinch [RESET UNIT] Restores 0/4 Standby State for Repeatable Practice",
        "caption_1": "One-pinch [RESET UNIT] restores all 3D parts (116°C, 140 PSI, 0/4), re-arms the causal trace, and clears violations.",
        "caption_2": "Built in Lens Studio 5.24.1 using Closed Loop Agentic Development (CLAD), Lens Studio MCP, and automated LEAF verification.",
        "accent": (72, 225, 255),
        "voiceover": (
            "Pinching Reset Unit restores all three-D parts for repeatable practice in Lens Studio."
        ),
        "sfx_events": [(2.2, "ButtonClick.wav", 0.75)],
    },
    {
        "id": "ch08b_editor_leaf_v3",
        "nav_idx": 4,
        "mode": "editor_split",
        "src": os.path.join(BUILD_DIR, "clean_v5_take5.mp4"),
        "ss": 41.5,
        "src_dur": 2.5,
        "duration": 6.5,
        "step_badge": "1:44.5 – 1:51   |   8B. 5/5 AUTOMATED IN-PREVIEW LEAF INTEGRATION SCENARIOS",
        "title": "5/5 Automated LEAF Scenarios Verify Trace-The-Fault, Auto-X-Ray & LOTO Paths",
        "caption_1": "Five automated LEAF scenarios verify the full repair loop, mid-repair LOTO state, reset loop, 85% safety interlock, and Trace-The-Fault signature flow.",
        "caption_2": "Live in-preview execution confirms [FieldFixTraceTheFaultSignatureScenario] PASSED with zero TypeScript or runtime errors.",
        "accent": (72, 245, 148),
        "voiceover": (
            "Five automated LEAF scenarios verify the Trace the Fault flow, Auto X-Ray, and safety interlock."
        ),
        "sfx_events": [(1.5, "ScanSweep.wav", 0.65), (4.8, "DiagnosticComplete.wav", 0.80)],
    },
    {
        "id": "ch09_closing_summary",
        "nav_idx": 5,
        "mode": "hero_ar",
        "src": os.path.join(BUILD_DIR, "clean_v5_take2.mp4"),
        "ss": 8.2,
        "src_dur": 2.8,
        "duration": 9.0,
        "step_badge": "1:51 – 2:00   |   9. FIELDFIX AR — SIGNATURE SPATIAL TRAINING EXPERIENCE",
        "title": "FieldFix AR: Spatial Cause-and-Effect Maintenance Training for Snap SPECS",
        "zoom_badge": "2.3x LIVE 3D ZOOM: VERIFIED NOMINAL OPERATION",
        "caption_1": "FieldFix AR transforms industrial repair checklists into a spatial cause-and-effect diagnostic and LOTO training simulation for Snap SPECS.",
        "caption_2": "2-zone causal coolant flow, localized Auto-X-Ray cutaway, LOTO safety interlock, Before/After compare, and 5/5 passing LEAF tests.",
        "card_tag": "LEARN AR WITH SPECS",
        "card_title": "FieldFix AR Summary",
        "card_items": [
            ("TRACE THE FAULT", "Symptom -> Bottleneck -> Root Cause in 3D.", (85, 245, 155)),
            ("AUTO-X-RAY & COMPARE", "Localized 3D internals & Before/After view.", (72, 225, 255)),
            ("LOTO + 5/5 LEAF", "Dynamic LOTO grading (85%/100%) + 5 suites.", (255, 210, 85)),
        ],
        "card_footer": "GITHUB.COM/AWANAFNAN17/FIELDFIX-AR | MIT",
        "accent": (72, 245, 148),
        "voiceover": (
            "FieldFix A R: spatial fault tracing, three-D repairs, and safety training for Snap SPECS."
        ),
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
        # HERO AR MODE WITH LIVE 2.3x 3D EQUIPMENT ZOOM:
        # Left Main AR Viewport: 1416x852 (x=20..1436, y=68..920)
        # Top-Right 2.3x 3D Equipment Zoom Viewport: 454x448 (x=1446..1900, y=68..516)
        # Bottom-Right Simplified Explanation Card: 454x392 (x=1446..1900, y=528..920)
        AR_BOX = (20, 68, 1436, 920)
        ZOOM_BOX = (1446, 68, 1900, 516)
        CARD_BOX = (1446, 528, 1900, 920)

        # Transparent cutouts for main AR viewport and 2.3x 3D zoom viewport
        draw.rectangle(AR_BOX, fill=(0, 0, 0, 0))
        draw.rectangle(ZOOM_BOX, fill=(0, 0, 0, 0))

        draw.rectangle((AR_BOX[0] - 2, AR_BOX[1] - 2, AR_BOX[2] + 2, AR_BOX[3] + 2), outline=accent + (235,), width=2)
        draw.rectangle((ZOOM_BOX[0] - 2, ZOOM_BOX[1] - 2, ZOOM_BOX[2] + 2, ZOOM_BOX[3] + 2), outline=accent + (235,), width=2)

        # Subtle badge in top-left of Main AR Viewport
        draw.rounded_rectangle((AR_BOX[0] + 10, AR_BOX[1] + 10, AR_BOX[0] + 430, AR_BOX[1] + 38), radius=6, fill=(10, 18, 28, 215), outline=accent + (220,), width=1)
        draw.text((AR_BOX[0] + 20, AR_BOX[1] + 17), "LIVE SPECS 27 AR PREVIEW (3D TWIN + HUD)", fill=accent + (255,), font=f_badge)

        # Optional prominent callout banner in top-right of Main AR Viewport (e.g., Run 1 vs Run 2 — Clean Attempt After Reset)
        ar_banner = ch.get("ar_banner")
        if ar_banner:
            draw.rounded_rectangle((AR_BOX[2] - 565, AR_BOX[1] + 10, AR_BOX[2] - 10, AR_BOX[1] + 40), radius=6, fill=(12, 24, 38, 242), outline=accent + (255,), width=2)
            draw.text((AR_BOX[2] - 550, AR_BOX[1] + 18), ar_banner, fill=(255, 255, 255, 255), font=load_font(14, bold=True))

        # Subtle badge in top-left of 2.3x 3D Equipment Zoom Viewport
        zoom_label = ch.get("zoom_badge", "2.3x LIVE 3D EQUIPMENT ZOOM")
        draw.rounded_rectangle((ZOOM_BOX[0] + 8, ZOOM_BOX[1] + 8, ZOOM_BOX[2] - 8, ZOOM_BOX[1] + 36), radius=6, fill=(10, 18, 28, 225), outline=accent + (220,), width=1)
        draw.text((ZOOM_BOX[0] + 18, ZOOM_BOX[1] + 15), zoom_label, fill=accent + (255,), font=f_badge)

        # Bottom-Right Simplified Visual Summary Card
        draw.rounded_rectangle(CARD_BOX, radius=10, fill=(15, 24, 38, 255), outline=(65, 105, 145, 230), width=2)

        # Compact Header Row inside Card
        draw.rounded_rectangle((CARD_BOX[0] + 14, CARD_BOX[1] + 12, CARD_BOX[2] - 14, CARD_BOX[1] + 40), radius=6, fill=(22, 38, 58, 255), outline=accent + (200,), width=1)
        draw.text((CARD_BOX[0] + 24, CARD_BOX[1] + 19), f"{ch['card_tag']}  —  {ch['card_title']}", fill=accent + (255,), font=load_font(14, bold=True))

        y_cursor = CARD_BOX[1] + 50
        f_ihdr = load_font(15, bold=True)
        f_ibody = load_font(14, bold=False)

        for item_hdr, item_body, item_col in ch["card_items"][:3]:
            box_h = 86
            draw.rounded_rectangle(
                (CARD_BOX[0] + 14, y_cursor, CARD_BOX[2] - 14, y_cursor + box_h),
                radius=8,
                fill=(20, 33, 50, 255),
                outline=item_col + (190,),
                width=2,
            )
            draw.rounded_rectangle(
                (CARD_BOX[0] + 14, y_cursor, CARD_BOX[0] + 22, y_cursor + box_h),
                radius=4,
                fill=item_col + (255,),
            )
            draw.text((CARD_BOX[0] + 32, y_cursor + 12), item_hdr, fill=item_col + (255,), font=f_ihdr)

            # Wrap to at most 2 short lines
            words = item_body.split()
            lines = []
            cur = ""
            for w in words:
                if len(cur) + len(w) + 1 <= 42:
                    cur = f"{cur} {w}".strip()
                else:
                    lines.append(cur)
                    cur = w
            if cur:
                lines.append(cur)
            by = y_cursor + 38
            for ln in lines[:2]:
                draw.text((CARD_BOX[0] + 32, by), ln, fill=(230, 240, 252, 255), font=f_ibody)
                by += 20

            y_cursor += box_h + 10

        # Card footer pill
        draw.rounded_rectangle(
            (CARD_BOX[0] + 14, CARD_BOX[3] - 44, CARD_BOX[2] - 14, CARD_BOX[3] - 10),
            radius=6,
            fill=(12, 22, 34, 255),
            outline=accent + (180,),
            width=1,
        )
        draw.text((CARD_BOX[0] + 24, CARD_BOX[3] - 34), ch["card_footer"], fill=accent + (255,), font=load_font(12, bold=True))

    else:
        # EDITOR + AR WORKFLOW MODE (1:38–1:51 Chapter 8):
        LEFT_BOX = (20, 68, 1040, 920)
        RIGHT_BOX = (1064, 68, 1900, 920)

        draw.rectangle(LEFT_BOX, fill=(0, 0, 0, 0))
        draw.rectangle(RIGHT_BOX, fill=(0, 0, 0, 0))

        draw.rectangle((LEFT_BOX[0] - 2, LEFT_BOX[1] - 2, LEFT_BOX[2] + 2, LEFT_BOX[3] + 2), outline=accent + (235,), width=2)
        draw.rectangle((RIGHT_BOX[0] - 2, RIGHT_BOX[1] - 2, RIGHT_BOX[2] + 2, RIGHT_BOX[3] + 2), outline=(100, 150, 195, 225), width=2)

        draw.rounded_rectangle((LEFT_BOX[0] + 12, LEFT_BOX[1] + 12, LEFT_BOX[0] + 440, LEFT_BOX[1] + 40), radius=6, fill=(10, 18, 28, 215), outline=accent + (220,), width=1)
        draw.text((LEFT_BOX[0] + 22, LEFT_BOX[1] + 18), "LIVE SPECS 27 AR PREVIEW (RESET & LEAF PASS)", fill=accent + (255,), font=f_badge)

        draw.rounded_rectangle((RIGHT_BOX[0] + 12, RIGHT_BOX[1] + 12, RIGHT_BOX[0] + 520, RIGHT_BOX[1] + 40), radius=6, fill=(10, 18, 28, 215), outline=(130, 185, 230, 220), width=1)
        draw.text((RIGHT_BOX[0] + 22, RIGHT_BOX[1] + 18), "LENS STUDIO 5.24.1 EDITOR  |  CLAD + MCP + 5/5 LEAF", fill=(175, 225, 255, 255), font=f_badge)

    # Bottom Concise Judge Narration Bar (y=928..1080)
    draw.rectangle((0, 928, W, H), fill=(12, 19, 30, 255))
    draw.line((0, 928, W, 928), fill=(65, 105, 145, 255), width=2)

    f_cap1 = load_font(18, bold=True)
    f_cap2 = load_font(17, bold=False)
    draw.text((26, 940), ch["caption_1"], fill=(245, 250, 255, 255), font=f_cap1)
    draw.text((26, 974), ch["caption_2"], fill=(195, 222, 245, 255), font=f_cap2)

    # 6-Part Narrative Progress Bar at very bottom (y=1020..1062)
    nav_labels = [
        "1. Choked Flow Hook (0:00)",
        "2. Trace & Auto-X-Ray (0:12)",
        "3. LOTO & 3D Repairs (0:28)",
        "4. 85%/100% & Compare (1:10)",
        "5. Reset & 5/5 LEAF (1:38)",
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
    overlay_png = os.path.join(BUILD_DIR, f"overlay_v5_{ch['id']}.png")
    create_overlay_png(ch, overlay_png)

    out_clip = os.path.join(BUILD_DIR, f"clip_v5_{idx:02d}_{ch['id']}.mp4")
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
        # 2) 2.3x Live 3D Equipment Zoom Viewport (380x340 at x=1224, y=720 -> scaled to 454x448 at x=1446, y=68)
        filter_complex = (
            f"[0:v]{trim_and_pts}split=2[v_main][v_zoom];"
            f"[v_main]crop=860:518:1200:620,scale=1416:852:flags=lanczos[ar_vid];"
            f"[v_zoom]crop=380:340:1224:720,scale=454:448:flags=lanczos[zoom_vid];"
            f"color=c=#0a0f17:s=1920x1080:r={FPS}:d={ch['duration']}[base];"
            f"[base][ar_vid]overlay=20:68:shortest=1[tmp1];"
            f"[tmp1][zoom_vid]overlay=1446:68:shortest=1[tmp2];"
            f"[tmp2][1:v]overlay=0:0:shortest=1[outv]"
        )
    else:
        # EDITOR + AR WORKFLOW MODE (1:38-1:51):
        filter_complex = (
            f"[0:v]{trim_and_pts}split=2[v_left][v_right];"
            f"[v_left]crop=890:760:1192:380,scale=1020:852:flags=lanczos[left_vid];"
            f"[v_right]scale=836:660:flags=lanczos,pad=836:852:0:96:color=#0d1522[right_vid];"
            f"color=c=#0a0f17:s=1920x1080:r={FPS}:d={ch['duration']}[base];"
            f"[base][left_vid]overlay=20:68:shortest=1[tmp1];"
            f"[tmp1][right_vid]overlay=1064:68:shortest=1[tmp2];"
            f"[tmp2][1:v]overlay=0:0:shortest=1[outv]"
        )

    cmd = [
        "ffmpeg",
        "-y",
        "-i",
        ch["src"],
        "-loop",
        "1",
        "-t",
        str(ch["duration"]),
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
    ambient_and_sfx = [0.0] * total_samples
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
        ambient_and_sfx[i] = env * hum

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
                        ambient_and_sfx[k] += s * gain

        vo_text = ch.get("voiceover", "").strip()
        if vo_text:
            vo_wav_path = os.path.join(BUILD_DIR, f"vo_v5_{idx:02d}_{ch['id']}.wav")
            vo_samples = synthesize_voiceover_wav(vo_text, vo_wav_path, rate=192)
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

    # Smooth the voiceover envelope (150ms window) for natural sidechain ducking of SFX/ambient
    win = int(0.15 * sr)
    active_count = 0
    for i in range(min(win, total_samples)):
        if vo_env[i] > 0.5:
            active_count += 1

    final_track = [0.0] * total_samples
    for i in range(total_samples):
        if i + win < total_samples and vo_env[i + win] > 0.5:
            active_count += 1
        if i - win >= 0 and vo_env[i - win] > 0.5:
            active_count -= 1
        duck = 0.34 if active_count > int(0.02 * sr) else 1.0
        final_track[i] = vo_track[i] + ambient_and_sfx[i] * duck

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
    os.makedirs(BUILD_DIR, exist_ok=True)
    clips = []
    total_dur = 0.0
    for idx, ch in enumerate(CHAPTERS):
        print(f"Rendering segment {idx+1}/{len(CHAPTERS)}: {ch['id']} ({ch['duration']}s, mode={ch['mode']})...")
        clip_path = render_chapter_clip(ch, idx)
        clips.append(clip_path)
        total_dur += ch["duration"]

    concat_txt = os.path.join(BUILD_DIR, "concat_list_v5.txt")
    with open(concat_txt, "w") as f:
        for c in clips:
            f.write(f"file '{c}'\n")

    master_wav = os.path.join(BUILD_DIR, "master_audio_v5.wav")
    print(f"Synthesizing voiceover + synchronized spatial audio track ({total_dur:.1f}s)...")
    build_master_audio(total_dur, master_wav)

    tmp_mp4 = os.path.join(BUILD_DIR, "FieldFix-AR-Demo-v5-fresh.mp4")
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

    # First write the V5 candidate video without touching the approved V4 MP4 backup
    shutil.copy2(tmp_mp4, OUT_V5_MP4)
    print(f"Done! Created candidate {OUT_V5_MP4} ({total_dur:.1f}s)")


if __name__ == "__main__":
    main()
