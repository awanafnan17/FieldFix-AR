#!/usr/bin/env python3
"""
Builds the competition-grade 120.0-second (2m 00s) 1080p 30fps narrated demonstration video
for FieldFix AR (`devpost/FieldFix-AR-Demo.mp4`) directly from continuous 60fps Lens Studio 5.24.1
window recordings captured via macOS WindowServer (`screencapture -V ... -l <LensStudioWindowID>`).

Upgrades in Campaign v3:
- 75–85% of visual attention is dedicated to the enlarged, tightly cropped live SPECS 27 AR
  experience (`1380x844` hero viewport showing all 9 UIKit rows including X-Ray Cutaway and
  Before/After Comparison) so the 3D machine, asymmetric yellow-tipped valve lever, 3D LOTO clasp,
  exploded X-Ray internal sub-assemblies, gauge needle, thermal relay core, floating spatial callouts,
  SIK pinch cursor, and SpectaclesUIKit checklist are crisp and readable at normal 1080p playback.
- Zero scan-rewind glitch in 0:00–0:12 (pure READY_TO_SCAN standby) and zero reset bleed in
  Before/After Comparison.
- Free local macOS voiceover narration (`/usr/bin/say -v Samantha -r 184`) synthesized per chapter
  and sidechain-ducked over the continuous spatial ambient pad + 5 procedural 44.1 kHz WAV SFX cues.
"""

import os
import shutil
import subprocess
import wave
import struct
import math
from PIL import Image, ImageDraw, ImageFont

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEVPOST_DIR = os.path.join(BASE_DIR, "devpost")
BUILD_DIR = os.path.join(DEVPOST_DIR, "_video_build")
SFX_DIR = os.path.join(BASE_DIR, "Assets", "GeneratedSFX")
OUT_MP4 = os.path.join(DEVPOST_DIR, "FieldFix-AR-Demo.mp4")
ROOT_DEVPOST_MP4 = os.path.join(os.path.dirname(BASE_DIR), "devpost", "FieldFix-AR-Demo.mp4")

W, H = 1920, 1080
FPS = 30

CHAPTERS = [
    {
        "id": "ch01_opening_concept",
        "nav_idx": 0,
        "mode": "hero_ar",
        "src": os.path.join(BUILD_DIR, "raw_campaign_v3_full_journey.mov"),
        "ss": 0.2,
        "src_dur": 4.8,
        "duration": 12.0,
        "step_badge": "0:00 – 0:12   |   1. THE PROBLEM, SOLUTION & SPATIAL AR CONCEPT",
        "title": "FieldFix AR — Hands-Free Industrial Maintenance Training Simulation",
        "caption_1": "Technicians need both hands free during complex repairs. FieldFix AR anchors a 3D equipment twin and guided checklist in space.",
        "caption_2": "Unlike flat screen overlays, trainees pinch 3D equipment components directly to practice fault diagnosis, LOTO safety, and repair.",
        "card_tag": "WHY FIELDFIX AR?",
        "card_title": "Hands-Free Spatial\nMaintenance Training",
        "card_items": [
            ("THE PROBLEM", "Paper manuals & tablets occupy hands needed for tools and valves.", (255, 195, 85)),
            ("THE SOLUTION", "FieldFix AR places a 3D machine twin & step guide side-by-side.", (72, 225, 255)),
            ("KEY DISTINCTION", "Pinch 3D valves, gauges & relays directly with visible 3D feedback.", (85, 245, 155)),
            ("SIMULATED SAFETY", "Safe training simulation for Lockout-Tagout & pressure bleed.", (200, 225, 255)),
        ],
        "card_footer": "SIMULATED TELEMETRY: 116°C  |  140 PSI  |  18% FLOW",
        "accent": (72, 225, 255),
        "voiceover": (
            "FieldFix A R is a hands-free spatial maintenance training simulation for Snap SPECS. "
            "Instead of holding paper manuals, technicians interact directly with a three-D equipment twin and floating repair checklist."
        ),
        "sfx_events": [(0.6, "ButtonClick.wav", 0.50)],
    },
    {
        "id": "ch02_scan_and_xray",
        "nav_idx": 1,
        "mode": "hero_ar",
        "src": os.path.join(BUILD_DIR, "raw_campaign_v3_full_journey.mov"),
        "ss": 5.5,
        "src_dur": 26.0,
        "duration": 16.0,
        "step_badge": "0:12 – 0:28   |   2. DIAGNOSTIC SCAN & 3D X-RAY CUTAWAY INSPECTION",
        "title": "3D Laser Scan Pinpoints Faults & X-Ray Cutaway Explodes Internal Parts",
        "caption_1": "Pinching [SCAN EQUIPMENT TELEMETRY] sweeps a 3D laser ring across Unit #04 to localize three simulated subsystem faults.",
        "caption_2": "Pinching [X-RAY CUTAWAY] explodes the internal cryo-ball seal, relief spring diaphragm, and copper stator coil in 3D space.",
        "card_tag": "SCAN + 3D X-RAY MODE",
        "card_title": "3 Faults Localized &\nInternal Cutaway View",
        "card_items": [
            ("CV-101 INTAKE VALVE", "X-RAY: Internal cryo-ball seal & venturi exposed (18% restricted flow).", (255, 200, 75)),
            ("PR-204 REGULATOR", "X-RAY: Internal relief spring & diaphragm spool exposed (142 PSI spike).", (255, 165, 65)),
            ("TR-309 RELAY CORE", "X-RAY: Copper stator coil & tripped plunger exposed (118°C overheat).", (255, 95, 95)),
            ("3D TARGET CHEVRON", "Bobs above CV-101 to guide the trainee to Step 1/4 (LOTO Lockout).", (72, 225, 255)),
        ],
        "card_footer": "X-RAY CUTAWAY: INTERNAL SUB-ASSEMBLIES EXPLODED",
        "accent": (255, 205, 70),
        "voiceover": (
            "Pinching Scan Equipment Telemetry sweeps a three-D laser ring across the cryo-pump to pinpoint three simulated faults. "
            "Toggling X-Ray Cutaway explodes the internal valve seal, regulator spring, and copper stator coil in three-D space."
        ),
        "sfx_events": [(0.8, "ScanSweep.wav", 0.80), (2.4, "FaultAlert.wav", 0.65), (5.2, "ButtonClick.wav", 0.65), (9.8, "ButtonClick.wav", 0.60)],
    },
    {
        "id": "ch03_safety_interlock",
        "nav_idx": 2,
        "mode": "hero_ar",
        "src": os.path.join(BUILD_DIR, "raw_campaign_v3_full_journey.mov"),
        "ss": 31.8,
        "src_dur": 6.0,
        "duration": 14.0,
        "step_badge": "0:28 – 0:42   |   3. INDUSTRIAL LOTO SAFETY INTERLOCK & SMART REDIRECTION",
        "title": "Out-of-Order Repair Attempts Trigger LOTO Safety Interlock & Auto-Redirect",
        "caption_1": "Attempting to unseat the overheated TR-309 Relay Core (Step 3) before isolating CV-101 triggers an immediate Safety Interlock.",
        "caption_2": "The 3D relay halo flashes red, an audio alert sounds, and the system automatically redirects the trainee back to Step 1/4 [CV-101].",
        "card_tag": "ACTIVE SAFETY TRAINING",
        "card_title": "Sequential LOTO\nSafety Interlock",
        "card_items": [
            ("UNSAFE ACTION BLOCKED", "Blocks unseating TR-309 while 142 PSI pressure is still trapped.", (255, 95, 95)),
            ("3D HAZARD FLASH", "Relay halo flashes crimson and plays a spatial hazard alert cue.", (255, 165, 65)),
            ("AUTO-REDIRECTION", "3D target chevron & checklist redirect automatically to Step 1 CV-101.", (72, 225, 255)),
            ("COMPETENCY SCORING", "Tracks safety violations to grade trainee LOTO discipline at completion.", (85, 245, 155)),
        ],
        "card_footer": "LOTO BLOCKED: COMPLETE STEP 1 [CV-101] FIRST!",
        "accent": (255, 95, 95),
        "voiceover": (
            "If a trainee attempts to unseat the overheated relay core before isolating the intake valve, "
            "the Lockout-Tagout Safety Interlock blocks the unsafe action, flashes a red hazard alert, and redirects focus to Step One."
        ),
        "sfx_events": [(1.5, "ButtonClick.wav", 0.65), (6.2, "FaultAlert.wav", 0.85)],
    },
    {
        "id": "ch04_steps1_and_2",
        "nav_idx": 2,
        "mode": "hero_ar",
        "src": os.path.join(BUILD_DIR, "raw_campaign_v3_full_journey.mov"),
        "ss": 38.0,
        "src_dur": 7.0,
        "duration": 15.0,
        "step_badge": "0:42 – 0:57   |   4. REAL 3D COMPONENT REPAIRS: VALVE LOTO & REGULATOR PURGE",
        "title": "Direct 3D Hand Pinches Rotate the Valve Lever, Snap LOTO & Sweep the Gauge",
        "caption_1": "Step 1 (Isolate): Pinching 3D CV-101 rotates the yellow lever 90° clockwise, snaps on the red LOTO clasp, and stops pipe flow.",
        "caption_2": "Step 2 (Depressurize): Pinching 3D PR-204 purges trapped pressure—the gauge needle sweeps from red (142 PSI) to green (38 PSI).",
        "card_tag": "3D MECHANICAL RESPONSE",
        "card_title": "Steps 1 & 2: Visible\nPhysical State Changes",
        "card_items": [
            ("STEP 1: CV-101 VALVE", "Yellow lever rotates -90° clockwise; red 3D LOTO safety clasp snaps on.", (72, 225, 255)),
            ("PIPE FLOW HALTS", "Animated cryo-coolant rings pause at 0% flow to confirm isolation.", (255, 200, 75)),
            ("STEP 2: PR-204 GAUGE", "3D gauge needle sweeps from red left (142 PSI) to green right (38 PSI).", (85, 245, 155)),
            ("SIMULATED COOLING", "Bleeding trapped vapor drops simulated manifold temp to 82°C.", (190, 230, 255)),
        ],
        "card_footer": "PROGRESS: 2 / 4 STEPS VERIFIED  ([1:LOTO OK] [2:PURGE OK])",
        "accent": (255, 165, 60),
        "voiceover": (
            "In Step One, pinching the three-D isolation valve rotates the yellow lever ninety degrees clockwise, snaps on a red Lockout clasp, and halts pipe flow. "
            "In Step Two, pinching the three-D regulator bleeds trapped pressure from one-forty-two P-S-I down to thirty-eight P-S-I."
        ),
        "sfx_events": [(1.8, "RepairStepConfirm.wav", 0.85), (8.2, "RepairStepConfirm.wav", 0.85)],
    },
    {
        "id": "ch05_step3_relay",
        "nav_idx": 2,
        "mode": "hero_ar",
        "src": os.path.join(BUILD_DIR, "raw_campaign_v3_part2.mov"),
        "ss": 3.0,
        "src_dur": 6.0,
        "duration": 13.0,
        "step_badge": "0:57 – 1:10   |   5. REAL 3D COMPONENT REPAIRS: THERMAL RELAY CORE RESEAT",
        "title": "Pinching the 3D Thermal Relay Retracts the Plunger & Cools the Core to 46°C",
        "caption_1": "Step 3 (Reseat Relay): Pinching the glowing 3D TR-309 relay core retracts the tripped plunger into its collar and cools the unit.",
        "caption_2": "The spatial badge updates to [COOLED 46°C] and the 3D target chevron moves back to CV-101 for final re-pressurization.",
        "card_tag": "3D MECHANICAL RESPONSE",
        "card_title": "Step 3: Thermal Relay\nCore Latch Reseated",
        "card_items": [
            ("STEP 3: TR-309 RELAY", "Pinching the 3D relay core physically retracts the raised plunger.", (85, 245, 155)),
            ("THERMAL RECOVERY", "Simulated core temperature drops from 118°C critical to 46°C.", (72, 225, 255)),
            ("DYNAMIC LOTO STATUS", "CV-101 displays 'LOTO ISOLATED: INTAKE LOCKED (0% FLOW)'.", (255, 210, 85)),
            ("NEXT TARGET", "3D chevron guides trainee back to CV-101 for Step 4/4.", (190, 230, 255)),
        ],
        "card_footer": "PROGRESS: 3 / 4 STEPS VERIFIED  ([3:RESEAT OK])",
        "accent": (72, 225, 255),
        "voiceover": (
            "With pressure safely bled, pinching the three-D thermal relay core in Step Three physically retracts the tripped plunger into its cooling sleeve, "
            "dropping core temperature to forty-six Celsius."
        ),
        "sfx_events": [(2.6, "RepairStepConfirm.wav", 0.85)],
    },
    {
        "id": "ch06_step4_and_scorecard",
        "nav_idx": 3,
        "mode": "hero_ar",
        "src": os.path.join(BUILD_DIR, "raw_campaign_v3_part2.mov"),
        "ss": 9.0,
        "src_dur": 6.0,
        "duration": 14.0,
        "step_badge": "1:10 – 1:24   |   6. STEP 4 COMPLETION, NOMINAL TELEMETRY & TRAINEE SCORECARD",
        "title": "Step 4 Restores 100% Flow, Verifies Nominal Operation & Grades Competency",
        "caption_1": "Step 4 (Restore Flow): Pinching 3D CV-101 clears the LOTO clasp, rotates the yellow lever +90° open, and restores 100% flow.",
        "caption_2": "All 3D halos, beacon, and flow rings turn emerald green (42°C | 45 PSI | 100% FLOW) and award the Trainee Competency Scorecard.",
        "card_tag": "REPAIR COMPLETE + SCORECARD",
        "card_title": "Verified Nominal State\n& Trainee Scorecard",
        "card_items": [
            ("TEMPERATURE", "118°C Overheat  -->  42°C Nominal (Relay Core Cooled)", (85, 245, 155)),
            ("MANIFOLD PRESSURE", "142 PSI Spike   -->  45 PSI Regulated (Gauge in Green Zone)", (85, 245, 155)),
            ("COOLANT FLOW", "18% Restricted  -->  100% Balanced Flow (Lever +90° Open)", (85, 245, 155)),
            ("TRAINEE SCORECARD", "100% (A+ FLAWLESS LOTO) — All 4 steps verified in sequence.", (72, 225, 255)),
        ],
        "card_footer": "SYSTEM NOMINAL — 100% (A+ FLAWLESS LOTO)",
        "accent": (72, 245, 148),
        "voiceover": (
            "In Step Four, pinching Valve CV-101 removes the lockout clasp, rotates the lever open, and restores one hundred percent balanced flow. "
            "All three-D halos turn emerald green and award the trainee competency scorecard."
        ),
        "sfx_events": [(2.0, "DiagnosticComplete.wav", 0.95)],
    },
    {
        "id": "ch07_before_after_compare",
        "nav_idx": 3,
        "mode": "hero_ar",
        "src": os.path.join(BUILD_DIR, "raw_campaign_v3_part2.mov"),
        "ss": 15.0,
        "src_dur": 12.5,
        "duration": 14.0,
        "step_badge": "1:24 – 1:38   |   7. BEFORE / AFTER SPATIAL STATE COMPARISON MODE",
        "title": "One-Pinch Before/After Toggle Compares Fault (118°C) vs. Nominal (42°C)",
        "caption_1": "Pinching [COMPARE BEFORE/AFTER] toggles the 3D machine and telemetry between the initial fault snapshot and verified nominal state.",
        "caption_2": "Trainees can also combine X-Ray Cutaway with nominal operation to inspect healthy internal flow across all three subsystems.",
        "card_tag": "BEFORE / AFTER COMPARE",
        "card_title": "Instant 3D Fault vs.\nNominal Comparison",
        "card_items": [
            ("BEFORE (FAULT VIEW)", "118°C Overheat | 142 PSI Spike | 18% Restricted Flow.", (255, 165, 65)),
            ("AFTER (NOMINAL VIEW)", "42°C Cooled Core | 45 PSI Regulated | 100% Balanced Flow.", (85, 245, 155)),
            ("PRESERVES PROGRESS", "Compares 3D mechanical states without losing 4/4 completion.", (72, 225, 255)),
            ("COMBINES WITH X-RAY", "Inspect internal sub-assemblies in both fault and repaired states.", (195, 230, 255)),
        ],
        "card_footer": "COMPARE MODE: FAULT SNAPSHOT <-> VERIFIED NOMINAL",
        "accent": (72, 225, 255),
        "voiceover": (
            "After completion, trainees can pinch Compare Before and After to toggle the entire three-D machine and telemetry "
            "between the initial overheated fault snapshot and the verified nominal state."
        ),
        "sfx_events": [(1.2, "ButtonClick.wav", 0.70), (6.5, "ButtonClick.wav", 0.70), (10.5, "ButtonClick.wav", 0.65)],
    },
    {
        "id": "ch08a_editor_reset",
        "nav_idx": 4,
        "mode": "editor_split",
        "src": os.path.join(BUILD_DIR, "raw_polished_leaf_and_reset.mov"),
        "ss": 7.5,
        "src_dur": 7.5,
        "duration": 6.5,
        "step_badge": "1:38 – 1:51   |   8. STEP NAVIGATION, RESET, CLAD + MCP & 4/4 LEAF TESTS",
        "title": "Built & Verified in Lens Studio 5.24.1 with CLAD, Lens Studio MCP & LEAF",
        "caption_1": "Step navigation (< PREV / NEXT >) and one-pinch [RESET UNIT] restore all 3D parts (116°C, 140 PSI, 0/4) for repeatable practice.",
        "caption_2": "Developed using Closed Loop Agentic Development (CLAD), Lens Studio MCP, and 4 automated in-preview LEAF integration scenarios.",
        "accent": (72, 225, 255),
        "voiceover": (
            "Built in Lens Studio five-point-twenty-four using Closed Loop Agentic Development and the Lens Studio M-C-P,"
        ),
        "sfx_events": [(2.2, "ButtonClick.wav", 0.75)],
    },
    {
        "id": "ch08b_editor_leaf_v3",
        "nav_idx": 4,
        "mode": "editor_split",
        "src": os.path.join(BUILD_DIR, "raw_campaign_v3_leaf.mov"),
        "ss": 0.5,
        "src_dur": 8.0,
        "duration": 6.5,
        "step_badge": "1:38 – 1:51   |   8. STEP NAVIGATION, RESET, CLAD + MCP & 4/4 LEAF TESTS",
        "title": "4/4 Automated LEAF Scenarios Verify Full Repair, X-Ray, Safety & Comparison",
        "caption_1": "Four automated LEAF scenarios verify the full 0/4 -> 4/4 repair flow, mid-repair LOTO state, reset loop, and adversarial safety interlock.",
        "caption_2": "Live in-preview execution confirms [FieldFixAdversarialSafetyAndXRayScenario] PASSED with zero TypeScript or runtime errors.",
        "accent": (72, 245, 148),
        "voiceover": (
            "FieldFix A R is verified by four automated LEAF integration scenarios covering the full repair loop, X-Ray cutaway, and safety interlock."
        ),
        "sfx_events": [(1.5, "ScanSweep.wav", 0.65), (4.8, "DiagnosticComplete.wav", 0.80)],
    },
    {
        "id": "ch09_closing_summary",
        "nav_idx": 5,
        "mode": "hero_ar",
        "src": os.path.join(BUILD_DIR, "raw_campaign_v3_part2.mov"),
        "ss": 22.0,
        "src_dur": 5.5,
        "duration": 9.0,
        "step_badge": "1:51 – 2:00   |   9. FIELDFIX AR — COMPLETED SPATIAL TRAINING EXPERIENCE",
        "title": "FieldFix AR: Hands-Free Maintenance Training Simulation for Snap SPECS",
        "caption_1": "FieldFix AR transforms industrial repair checklists into an intuitive, safety-interlocked 3D training simulation for Snap SPECS.",
        "caption_2": "100% self-contained procedural 3D meshes, 3D X-Ray cutaway, LOTO safety interlock, Before/After compare, and 4/4 passing LEAF tests.",
        "card_tag": "LEARN AR WITH SPECS",
        "card_title": "FieldFix AR\nSubmission Summary",
        "card_items": [
            ("SPATIAL INTERACTION", "Direct SIK hand pinches on 3D valves, regulator & thermal relay.", (85, 245, 155)),
            ("3D X-RAY & COMPARE", "Exploded internal sub-assemblies & instant Before/After toggle.", (72, 225, 255)),
            ("LOTO SAFETY INTERLOCK", "Blocks unsafe out-of-order actions & grades trainee competency.", (255, 210, 85)),
            ("CLAD + 4/4 LEAF PASS", "Closed Loop Agentic Development + Lens Studio MCP + 4 LEAF tests.", (195, 230, 255)),
        ],
        "card_footer": "GITHUB.COM/AWANAFNAN17/FIELDFIX-AR   |   MIT LICENSE",
        "accent": (72, 245, 148),
        "voiceover": (
            "FieldFix A R: hands-free spatial diagnostics, interactive three-D repairs, and safety-first training built natively for Snap SPECS."
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
    """Creates a 1920x1080 RGBA overlay with transparent video cutout(s) and high-contrast judge captions."""
    img = Image.new("RGBA", (W, H), (10, 15, 23, 255))
    draw = ImageDraw.Draw(img)
    accent = ch["accent"]

    # Top Header Bar (y=0..64)
    draw.rectangle((0, 0, W, 64), fill=(13, 21, 33, 255))
    draw.line((0, 64, W, 64), fill=accent + (255,), width=3)

    f_step = load_font(15, bold=True)
    f_title = load_font(22, bold=True)
    f_badge = load_font(14, bold=True)

    draw.text((26, 8), ch["step_badge"], fill=accent + (255,), font=f_step)
    draw.text((26, 30), ch["title"], fill=(245, 250, 255, 255), font=f_title)

    # Top-right competition pill
    draw.rounded_rectangle((1470, 12, 1896, 52), radius=8, fill=(19, 32, 48, 255), outline=accent + (210,), width=2)
    draw.text((1490, 24), "LEARN AR WITH SPECS  |  SIMULATION DEMO", fill=(215, 240, 255, 255), font=f_badge)

    if ch["mode"] == "hero_ar":
        # HERO AR MODE:
        # Enlarged Live SPECS 27 AR Viewport occupies 1380x844 on the left (x=24..1404, y=74..918)
        # Right Visual Summary Card occupies 468x844 on the right (x=1428..1896, y=74..918)
        AR_BOX = (24, 74, 1404, 918)
        CARD_BOX = (1428, 74, 1896, 918)

        draw.rectangle(AR_BOX, fill=(0, 0, 0, 0))
        draw.rectangle((AR_BOX[0] - 2, AR_BOX[1] - 2, AR_BOX[2] + 2, AR_BOX[3] + 2), outline=accent + (235,), width=2)

        # Subtle badge in top-left of AR viewport
        draw.rounded_rectangle((AR_BOX[0] + 12, AR_BOX[1] + 12, AR_BOX[0] + 455, AR_BOX[1] + 42), radius=6, fill=(10, 18, 28, 215), outline=accent + (220,), width=1)
        draw.text((AR_BOX[0] + 22, AR_BOX[1] + 19), "LIVE SPECS 27 AR PREVIEW (ENLARGED VIEW)", fill=accent + (255,), font=f_badge)

        # Right-hand Visual Summary Card
        draw.rounded_rectangle(CARD_BOX, radius=12, fill=(15, 24, 38, 255), outline=(65, 105, 145, 230), width=2)

        # Card top tag pill
        draw.rounded_rectangle((CARD_BOX[0] + 22, CARD_BOX[1] + 20, CARD_BOX[2] - 22, CARD_BOX[1] + 54), radius=7, fill=(22, 38, 58, 255), outline=accent + (200,), width=1)
        draw.text((CARD_BOX[0] + 36, CARD_BOX[1] + 29), ch["card_tag"], fill=accent + (255,), font=load_font(15, bold=True))

        # Card main title (2 lines)
        f_ctitle = load_font(25, bold=True)
        y_cursor = CARD_BOX[1] + 70
        for line in ch["card_title"].split("\n"):
            draw.text((CARD_BOX[0] + 24, y_cursor), line, fill=(245, 250, 255, 255), font=f_ctitle)
            y_cursor += 32

        draw.line((CARD_BOX[0] + 24, y_cursor + 10, CARD_BOX[2] - 24, y_cursor + 10), fill=(55, 88, 122, 255), width=2)
        y_cursor += 26

        # 4 visual highlight boxes inside the card
        f_ihdr = load_font(16, bold=True)
        f_ibody = load_font(15, bold=False)
        for item_hdr, item_body, item_col in ch["card_items"]:
            box_h = 132
            draw.rounded_rectangle(
                (CARD_BOX[0] + 20, y_cursor, CARD_BOX[2] - 20, y_cursor + box_h),
                radius=9,
                fill=(20, 33, 50, 255),
                outline=item_col + (190,),
                width=2,
            )
            # Left accent stripe
            draw.rounded_rectangle(
                (CARD_BOX[0] + 20, y_cursor, CARD_BOX[0] + 28, y_cursor + box_h),
                radius=4,
                fill=item_col + (255,),
            )
            draw.text((CARD_BOX[0] + 40, y_cursor + 14), item_hdr, fill=item_col + (255,), font=f_ihdr)

            words = item_body.split()
            lines = []
            cur = ""
            for w in words:
                if len(cur) + len(w) + 1 <= 40:
                    cur = f"{cur} {w}".strip()
                else:
                    lines.append(cur)
                    cur = w
            if cur:
                lines.append(cur)
            by = y_cursor + 44
            for ln in lines[:3]:
                draw.text((CARD_BOX[0] + 40, by), ln, fill=(228, 238, 250, 255), font=f_ibody)
                by += 24

            y_cursor += box_h + 16

        # Card footer pill
        draw.rounded_rectangle(
            (CARD_BOX[0] + 20, CARD_BOX[3] - 58, CARD_BOX[2] - 20, CARD_BOX[3] - 18),
            radius=7,
            fill=(12, 22, 34, 255),
            outline=accent + (180,),
            width=1,
        )
        draw.text((CARD_BOX[0] + 32, CARD_BOX[3] - 46), ch["card_footer"], fill=accent + (255,), font=load_font(13, bold=True))

    else:
        # EDITOR + AR WORKFLOW MODE (used only briefly in 1:38–1:51 Chapter 8):
        LEFT_BOX = (24, 74, 1044, 918)
        RIGHT_BOX = (1068, 74, 1896, 918)

        draw.rectangle(LEFT_BOX, fill=(0, 0, 0, 0))
        draw.rectangle(RIGHT_BOX, fill=(0, 0, 0, 0))

        draw.rectangle((LEFT_BOX[0] - 2, LEFT_BOX[1] - 2, LEFT_BOX[2] + 2, LEFT_BOX[3] + 2), outline=accent + (235,), width=2)
        draw.rectangle((RIGHT_BOX[0] - 2, RIGHT_BOX[1] - 2, RIGHT_BOX[2] + 2, RIGHT_BOX[3] + 2), outline=(100, 150, 195, 225), width=2)

        draw.rounded_rectangle((LEFT_BOX[0] + 12, LEFT_BOX[1] + 12, LEFT_BOX[0] + 440, LEFT_BOX[1] + 42), radius=6, fill=(10, 18, 28, 215), outline=accent + (220,), width=1)
        draw.text((LEFT_BOX[0] + 22, LEFT_BOX[1] + 19), "LIVE SPECS 27 AR PREVIEW (RESET & LEAF PASS)", fill=accent + (255,), font=f_badge)

        draw.rounded_rectangle((RIGHT_BOX[0] + 12, RIGHT_BOX[1] + 12, RIGHT_BOX[0] + 520, RIGHT_BOX[1] + 42), radius=6, fill=(10, 18, 28, 215), outline=(130, 185, 230, 220), width=1)
        draw.text((RIGHT_BOX[0] + 22, RIGHT_BOX[1] + 19), "LENS STUDIO 5.24.1 EDITOR  |  CLAD + MCP + 4/4 LEAF", fill=(175, 225, 255, 255), font=f_badge)

    # Bottom Concise Judge Narration Bar (y=928..1080)
    draw.rectangle((0, 928, W, H), fill=(12, 19, 30, 255))
    draw.line((0, 928, W, 928), fill=(65, 105, 145, 255), width=2)

    f_cap1 = load_font(19, bold=True)
    f_cap2 = load_font(18, bold=False)
    draw.text((30, 942), ch["caption_1"], fill=(245, 250, 255, 255), font=f_cap1)
    draw.text((30, 976), ch["caption_2"], fill=(195, 222, 245, 255), font=f_cap2)

    # 6-Part Narrative Progress Bar at very bottom (y=1022..1064)
    nav_labels = [
        "1. Concept (0:00)",
        "2. Scan & X-Ray (0:12)",
        "3. LOTO & 3D Repairs (0:28)",
        "4. Scorecard & Compare (1:10)",
        "5. Reset & 4/4 LEAF (1:38)",
        "6. Summary (1:51)",
    ]
    bar_x0, bar_x1 = 26, 1894
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
        draw.text((sx0 + 14, 1033), nav_labels[i], fill=txt_col, font=f_nav)

    img.save(out_path)


def render_chapter_clip(ch: dict, idx: int) -> str:
    overlay_png = os.path.join(BUILD_DIR, f"overlay_v3_{ch['id']}.png")
    create_overlay_png(ch, overlay_png)

    out_clip = os.path.join(BUILD_DIR, f"clip_v3_{idx:02d}_{ch['id']}.mp4")

    pts_scale = ch["duration"] / ch["src_dur"]
    pts_filter = f"setpts={pts_scale:.6f}*PTS," if abs(pts_scale - 1.0) > 0.001 else ""

    if ch["mode"] == "hero_ar":
        # Crop tightly around the active 3D equipment + all 9 rows of the floating HUD inside Preview 1:
        # 900x550 at x=1192, y=608 (aspect ratio 900/550 = 1.6363 vs 1380/844 = 1.6350)
        filter_complex = (
            f"[0:v]{pts_filter}fps={FPS},crop=2140:1692:66:66,"
            f"crop=900:550:1192:608,scale=1380:844:flags=lanczos[ar_vid];"
            f"color=c=#0a0f17:s=1920x1080:r={FPS}:d={ch['duration']}[base];"
            f"[base][ar_vid]overlay=24:74:shortest=1[tmp1];"
            f"[tmp1][1:v]overlay=0:0:shortest=1[outv]"
        )
    else:
        # EDITOR + AR WORKFLOW MODE (1:38-1:51):
        filter_complex = (
            f"[0:v]{pts_filter}fps={FPS},crop=2140:1692:66:66,split=2[v_left][v_right];"
            f"[v_left]crop=890:736:1192:450,scale=1020:844:flags=lanczos[left_vid];"
            f"[v_right]scale=828:654:flags=lanczos,pad=828:844:0:95:color=#0d1522[right_vid];"
            f"color=c=#0a0f17:s=1920x1080:r={FPS}:d={ch['duration']}[base];"
            f"[base][left_vid]overlay=24:74:shortest=1[tmp1];"
            f"[tmp1][right_vid]overlay=1068:74:shortest=1[tmp2];"
            f"[tmp2][1:v]overlay=0:0:shortest=1[outv]"
        )

    cmd = [
        "ffmpeg",
        "-y",
        "-ss",
        str(ch["ss"]),
        "-t",
        str(ch["src_dur"]),
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
        "-t",
        str(ch["duration"]),
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


def synthesize_voiceover_wav(text: str, out_wav: str, rate: int = 184) -> list[float]:
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
        env = 0.015 + 0.004 * math.sin(2 * math.pi * 0.25 * t)
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
            vo_wav_path = os.path.join(BUILD_DIR, f"vo_v3_{idx:02d}_{ch['id']}.wav")
            vo_samples = synthesize_voiceover_wav(vo_text, vo_wav_path, rate=184)
            # Start voiceover 0.35s into each chapter, clamp to chapter duration - 0.25s
            max_vo_samples = int((ch["duration"] - 0.45) * sr)
            vo_start = int((t_cursor + 0.30) * sr)
            for j, s in enumerate(vo_samples[:max_vo_samples]):
                k = vo_start + j
                if 0 <= k < total_samples:
                    vo_track[k] += s * 0.88
                    if abs(s) > 0.015:
                        vo_env[k] = 1.0

        t_cursor += ch["duration"]

    # Smooth the voiceover envelope (200ms window) for natural sidechain ducking of SFX/ambient
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

    concat_txt = os.path.join(BUILD_DIR, "concat_list_v3.txt")
    with open(concat_txt, "w") as f:
        for c in clips:
            f.write(f"file '{c}'\n")

    master_wav = os.path.join(BUILD_DIR, "master_audio_v3.wav")
    print(f"Synthesizing voiceover + synchronized spatial audio track ({total_dur:.1f}s)...")
    build_master_audio(total_dur, master_wav)

    tmp_mp4 = os.path.join(BUILD_DIR, "FieldFix-AR-Demo-v3-fresh.mp4")
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
        "libx264",
        "-preset",
        "medium",
        "-crf",
        "17",
        "-pix_fmt",
        "yuv420p",
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

    # Write as a brand-new inode so macOS Finder displays the exact current creation & modification timestamp
    if os.path.exists(OUT_MP4):
        os.remove(OUT_MP4)
    shutil.copy2(tmp_mp4, OUT_MP4)

    if os.path.exists(os.path.dirname(ROOT_DEVPOST_MP4)):
        if os.path.exists(ROOT_DEVPOST_MP4):
            os.remove(ROOT_DEVPOST_MP4)
        shutil.copy2(OUT_MP4, ROOT_DEVPOST_MP4)
    print(f"Done! Created {OUT_MP4} ({total_dur:.1f}s)")


if __name__ == "__main__":
    main()
