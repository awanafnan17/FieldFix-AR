#!/usr/bin/env python3
"""
Builds the reframed 104-second (1m 44s) 1080p 30fps demonstration video for FieldFix AR
(`devpost/FieldFix-AR-Demo.mp4`) directly from continuous 60fps Lens Studio 5.24.1 window
recordings captured via macOS WindowServer (`screencapture -V ... -l <LensStudioWindowID>`).

Design & Framing Principles:
- 75–85% of visual attention is dedicated to the enlarged, tightly cropped live SPECS 27 AR
  experience (`1380x844` hero viewport) so the 3D machine, valve wheel, LOTO safety clasp,
  gauge needle, thermal relay core, floating spatial callouts, SIK pinch cursor, and
  SpectaclesUIKit checklist are crisp and readable at normal 1080p playback.
- The full Lens Studio 5.24.1 Editor window is shown only briefly in the 80–95s chapter to
  demonstrate step navigation, unit reset, automated LEAF testing, and the Closed Loop
  Agentic Development (CLAD) + Lens Studio MCP workflow.
- Concise, plain-English captions and right-hand visual summary cards explain the problem,
  solution, and mechanical state changes clearly for both non-technical and technical judges.
- Synchronized procedural spatial audio track mixed from `Assets/GeneratedSFX/*.wav`.
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
        "src": os.path.join(BUILD_DIR, "raw_polished_gameplay_full.mov"),
        "ss": 0.0,
        "src_dur": 8.0,
        "duration": 10.0,
        "step_badge": "0:00 – 0:10   |   1. THE PROBLEM, SOLUTION & SPATIAL AR CONCEPT",
        "title": "FieldFix AR — Hands-Free Industrial Maintenance Training Simulation",
        "caption_1": "Technicians need both hands free during complex repairs. FieldFix AR anchors a 3D equipment twin and guided checklist in space.",
        "caption_2": "Unlike flat screen overlays, trainees pinch 3D equipment components directly to practice fault diagnosis and safe repair.",
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
        "sfx_events": [(0.5, "ButtonClick.wav", 0.55), (3.8, "ScanSweep.wav", 0.80)],
    },
    {
        "id": "ch02_diagnostic_scan",
        "nav_idx": 1,
        "mode": "hero_ar",
        "src": os.path.join(BUILD_DIR, "raw_polished_gameplay_full.mov"),
        "ss": 2.4,
        "src_dur": 10.5,
        "duration": 15.0,
        "step_badge": "0:10 – 0:25   |   2. SIMULATED DIAGNOSTIC SCAN & FAULT VISUALIZATION",
        "title": "3D Laser Scan Sweep Pinpoints Simulated Faults & Highlights Target Parts",
        "caption_1": "A right-hand pinch on [SCAN EQUIPMENT TELEMETRY] sweeps a 3D laser ring across the pump assembly to localize simulated faults.",
        "caption_2": "Color-coded spatial badges highlight three issues—restricted valve flow, high pressure, and relay overheat—and guide Step 1.",
        "card_tag": "DIAGNOSTIC SCAN",
        "card_title": "3 Simulated Faults\nLocalized in 3D Space",
        "card_items": [
            ("CV-101 INTAKE VALVE", "WARN: Flow restricted to 18% due to simulated intake cavitation.", (255, 200, 75)),
            ("PR-204 REGULATOR", "FAULT: 142 PSI over-pressure spike trapped in bypass manifold.", (255, 165, 65)),
            ("TR-309 RELAY CORE", "CRITICAL: Core overheated at 118°C; thermal plunger tripped.", (255, 95, 95)),
            ("3D TARGET CHEVRON", "Bobs directly above CV-101 to guide the trainee to Step 1/4.", (72, 225, 255)),
        ],
        "card_footer": "ACTIVE TARGET: [CV-101] LOCKOUT ISOLATION VALVE",
        "accent": (255, 205, 70),
        "sfx_events": [(1.0, "ScanSweep.wav", 0.80), (4.5, "FaultAlert.wav", 0.65), (9.8, "ButtonClick.wav", 0.70)],
    },
    {
        "id": "ch03a_valve_and_regulator",
        "nav_idx": 2,
        "mode": "hero_ar",
        "src": os.path.join(BUILD_DIR, "raw_polished_gameplay_full.mov"),
        "ss": 12.8,
        "src_dur": 12.0,
        "duration": 15.0,
        "step_badge": "0:25 – 0:40   |   3A. REAL 3D COMPONENT INTERACTIONS: VALVE LOTO & REGULATOR PURGE",
        "title": "Direct 3D Hand Pinches Rotate the Valve Wheel, Snap LOTO & Sweep the Gauge",
        "caption_1": "Step 1 (Isolate): Pinching the 3D CV-101 valve rotates the wheel 90°, snaps on a red lockout clasp, and stops pipe flow rings.",
        "caption_2": "Step 2 (Depressurize): Pinching the 3D PR-204 regulator purges pressure—the gauge needle sweeps from red (142 PSI) to green (38 PSI).",
        "card_tag": "3D MECHANICAL RESPONSE",
        "card_title": "Steps 1 & 2: Visible\nPhysical State Changes",
        "card_items": [
            ("STEP 1: CV-101 VALVE", "3D wheel rotates 90° clockwise; red LOTO safety clasp snaps on.", (72, 225, 255)),
            ("PIPE FLOW HALTS", "Animated cryo-coolant rings pause at 0% flow to confirm isolation.", (255, 200, 75)),
            ("STEP 2: PR-204 GAUGE", "3D gauge needle sweeps from red left (142 PSI) to green right (38 PSI).", (85, 245, 155)),
            ("SIMULATED COOLING", "Bleeding trapped vapor drops simulated manifold temp to 82°C.", (190, 230, 255)),
        ],
        "card_footer": "PROGRESS: 2 / 4 STEPS VERIFIED  ([1:LOTO OK] [2:PURGE OK])",
        "accent": (255, 165, 60),
        "sfx_events": [(1.8, "RepairStepConfirm.wav", 0.85), (6.5, "ButtonClick.wav", 0.65), (10.2, "RepairStepConfirm.wav", 0.85)],
    },
    {
        "id": "ch03b_relay_reseat",
        "nav_idx": 2,
        "mode": "hero_ar",
        "src": os.path.join(BUILD_DIR, "raw_polished_gameplay_full.mov"),
        "ss": 24.5,
        "src_dur": 8.5,
        "duration": 15.0,
        "step_badge": "0:40 – 0:55   |   3B. REAL 3D COMPONENT INTERACTIONS: THERMAL RELAY CORE RESEAT",
        "title": "Pinching the 3D Thermal Relay Retracts the Plunger & Cools the Core to 46°C",
        "caption_1": "Step 3 (Reseat Relay): Pinching the glowing 3D TR-309 relay core retracts the tripped plunger into its housing and cools the unit.",
        "caption_2": "The spatial badge updates to [COOLED 46°C] and the 3D target chevron moves back to CV-101 for final re-pressurization.",
        "card_tag": "3D MECHANICAL RESPONSE",
        "card_title": "Step 3: Thermal Relay\nCore Latch Reseated",
        "card_items": [
            ("STEP 3: TR-309 RELAY", "Pinching the 3D relay core physically retracts the raised plunger.", (85, 245, 155)),
            ("THERMAL RECOVERY", "Simulated core temperature drops from 118°C critical to 46°C.", (72, 225, 255)),
            ("DYNAMIC LOTO STATUS", "Selecting CV-101 shows 'LOTO ISOLATED: INTAKE LOCKED (0% FLOW)'.", (255, 210, 85)),
            ("NEXT TARGET", "3D chevron guides trainee back to CV-101 for Step 4/4.", (190, 230, 255)),
        ],
        "card_footer": "PROGRESS: 3 / 4 STEPS VERIFIED  ([3:RESEAT OK])",
        "accent": (72, 225, 255),
        "sfx_events": [(4.2, "RepairStepConfirm.wav", 0.85), (9.5, "ButtonClick.wav", 0.65)],
    },
    {
        "id": "ch04a_step4_completion",
        "nav_idx": 3,
        "mode": "hero_ar",
        "src": os.path.join(BUILD_DIR, "raw_polished_gameplay_full.mov"),
        "ss": 31.5,
        "src_dur": 8.5,
        "duration": 13.0,
        "step_badge": "0:55 – 1:08   |   4A. GUIDED REPAIR COMPLETION & TELEMETRY RECOVERY (4/4 DONE)",
        "title": "Step 4 Restores 100% Simulated Coolant Flow & Verifies Nominal Operation",
        "caption_1": "Step 4 (Restore Flow): Pinching the 3D CV-101 valve removes the lockout clasp, rotates the wheel open, and restores 100% flow.",
        "caption_2": "All 3D halos, overhead beacon, pipe flow rings, and checklist items turn emerald green (42°C | 45 PSI | 100% FLOW | 4/4 DONE).",
        "card_tag": "REPAIR COMPLETE",
        "card_title": "Simulated Telemetry:\nBefore vs. After Repair",
        "card_items": [
            ("TEMPERATURE", "118°C Overheat  -->  42°C Nominal (Relay Core Cooled)", (85, 245, 155)),
            ("MANIFOLD PRESSURE", "142 PSI Spike   -->  45 PSI Regulated (Gauge in Green Zone)", (85, 245, 155)),
            ("COOLANT FLOW", "18% Restricted  -->  100% Balanced Flow (LOTO Cleared)", (85, 245, 155)),
            ("CHECKLIST STATUS", "[1:LOTO OK]  [2:PURGE OK]  [3:RESEAT OK]  [4:FLOW OK]", (72, 225, 255)),
        ],
        "card_footer": "SYSTEM NOMINAL — ALL 4 REPAIR STEPS VERIFIED",
        "accent": (72, 245, 148),
        "sfx_events": [(2.2, "DiagnosticComplete.wav", 0.95), (7.5, "ButtonClick.wav", 0.65)],
    },
    {
        "id": "ch04b_post_repair_review",
        "nav_idx": 3,
        "mode": "hero_ar",
        "src": os.path.join(BUILD_DIR, "raw_polished_gameplay_full.mov"),
        "ss": 38.5,
        "src_dur": 7.5,
        "duration": 12.0,
        "step_badge": "1:08 – 1:20   |   4B. SPATIAL INSTRUCTION INTERFACE & POST-REPAIR INSPECTION",
        "title": "Dual-Modality Spatial Controls & Dynamic Repaired Subsystem Summaries",
        "caption_1": "Trainees can interact either by pinching the 3D machine components directly or by pinching buttons on the floating UIKit panel.",
        "caption_2": "Selecting [CV-101 VALVE] or [< PREV STEP] after repair displays updated nominal summaries without obscuring the 3D equipment.",
        "card_tag": "SPATIAL UI DESIGN",
        "card_title": "World-Anchored HUD\n& Clear Sightlines",
        "card_items": [
            ("SIDE-BY-SIDE LAYOUT", "3D machine on left (-30.5 cm), floating UIKit checklist on right (+21 cm).", (72, 225, 255)),
            ("ZERO HEAD-LOCKING", "Anchored in world space so trainees can look freely around the unit.", (85, 245, 155)),
            ("COHERENT SUMMARIES", "Completed subsystems display verified nominal descriptions.", (190, 230, 255)),
            ("HIGH-CONTRAST PILLS", "Dark backing pills keep spatial callouts readable from any angle.", (255, 210, 85)),
        ],
        "card_footer": "[CV-101] NOMINAL: 100% BALANCED FLOW VERIFIED",
        "accent": (72, 225, 255),
        "sfx_events": [(2.4, "ButtonClick.wav", 0.70), (8.2, "ButtonClick.wav", 0.70)],
    },
    {
        "id": "ch05a_editor_nav",
        "nav_idx": 4,
        "mode": "editor_split",
        "src": os.path.join(BUILD_DIR, "raw_polished_gameplay_full.mov"),
        "ss": 38.5,
        "src_dur": 7.5,
        "duration": 7.5,
        "step_badge": "1:20 – 1:35   |   5. STEP NAVIGATION, RESET, AUTOMATED TESTING & CLAD + MCP WORKFLOW",
        "title": "Built & Verified in Lens Studio 5.24.1 with CLAD, Lens Studio MCP & LEAF",
        "caption_1": "Step navigation (< PREV / NEXT >) and one-pinch [RESET UNIT] let trainees review steps or reset the simulation for repeatable practice.",
        "caption_2": "Developed using Closed Loop Agentic Development (CLAD), Lens Studio MCP, and automated in-preview LEAF integration tests (3/3 passed).",
        "accent": (72, 225, 255),
        "sfx_events": [(1.5, "ButtonClick.wav", 0.70), (5.5, "ButtonClick.wav", 0.70)],
    },
    {
        "id": "ch05b_editor_reset_leaf",
        "nav_idx": 4,
        "mode": "editor_split",
        "src": os.path.join(BUILD_DIR, "raw_polished_leaf_and_reset.mov"),
        "ss": 7.5,
        "src_dur": 7.5,
        "duration": 7.5,
        "step_badge": "1:20 – 1:35   |   5. STEP NAVIGATION, RESET, AUTOMATED TESTING & CLAD + MCP WORKFLOW",
        "title": "One-Pinch Equipment Reset & Automated LEAF Scenario Verification in Preview",
        "caption_1": "Resetting the unit restores all 3D mechanical parts (116°C, 140 PSI, 0/4 steps) so trainees can replay the maintenance scenario.",
        "caption_2": "Three automated LEAF scenarios verify the complete 0/4 -> 4/4 repair flow, mid-repair LOTO state, and reset loop inside Lens Studio.",
        "accent": (72, 245, 148),
        "sfx_events": [(2.8, "ButtonClick.wav", 0.75), (4.5, "ScanSweep.wav", 0.70)],
    },
    {
        "id": "ch06_closing_summary",
        "nav_idx": 5,
        "mode": "hero_ar",
        "src": os.path.join(BUILD_DIR, "raw_polished_gameplay_full.mov"),
        "ss": 32.5,
        "src_dur": 7.5,
        "duration": 9.0,
        "step_badge": "1:35 – 1:44   |   6. FIELDFIX AR — COMPLETED SPATIAL TRAINING EXPERIENCE",
        "title": "FieldFix AR: Hands-Free Maintenance Training Simulation for Snap SPECS",
        "caption_1": "FieldFix AR transforms industrial repair checklists into an intuitive, hands-free 3D training simulation for Snap SPECS.",
        "caption_2": "100% self-contained procedural 3D meshes, spatial audio, SIK hand interactions, SpectaclesUIKit HUD, and 3/3 passing LEAF tests.",
        "card_tag": "LEARN AR WITH SPECS",
        "card_title": "FieldFix AR\nSubmission Summary",
        "card_items": [
            ("SPATIAL INTERACTION", "Direct SIK hand pinches on 3D valves, regulator & thermal relay.", (85, 245, 155)),
            ("TRAINING SIMULATION", "Simulated telemetry (Temp/PSI/Flow) & guided 4-step LOTO workflow.", (72, 225, 255)),
            ("CLAD + MCP WORKFLOW", "Closed Loop Agentic Development + Lens Studio MCP + 3 LEAF tests.", (255, 210, 85)),
            ("ZERO EXTERNAL DEPS", "100% procedural 3D geometry & 44.1 kHz spatial WAV audio.", (195, 230, 255)),
        ],
        "card_footer": "GITHUB.COM/AWANAFNAN17/FIELDFIX-AR   |   MIT LICENSE",
        "accent": (72, 245, 148),
        "sfx_events": [(1.2, "DiagnosticComplete.wav", 0.95), (5.5, "RepairStepConfirm.wav", 0.70)],
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

            # Wrap item_body cleanly at ~38 chars
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
        # EDITOR + AR WORKFLOW MODE (used only in 80–95s Chapter 5):
        # Left window: Live SPECS 27 AR Viewport (1020x844 at x=24..1044, y=74..918)
        # Right window: Full Lens Studio 5.24.1 Editor (828x844 at x=1068..1896, y=74..918)
        LEFT_BOX = (24, 74, 1044, 918)
        RIGHT_BOX = (1068, 74, 1896, 918)

        draw.rectangle(LEFT_BOX, fill=(0, 0, 0, 0))
        draw.rectangle(RIGHT_BOX, fill=(0, 0, 0, 0))

        draw.rectangle((LEFT_BOX[0] - 2, LEFT_BOX[1] - 2, LEFT_BOX[2] + 2, LEFT_BOX[3] + 2), outline=accent + (235,), width=2)
        draw.rectangle((RIGHT_BOX[0] - 2, RIGHT_BOX[1] - 2, RIGHT_BOX[2] + 2, RIGHT_BOX[3] + 2), outline=(100, 150, 195, 225), width=2)

        draw.rounded_rectangle((LEFT_BOX[0] + 12, LEFT_BOX[1] + 12, LEFT_BOX[0] + 440, LEFT_BOX[1] + 42), radius=6, fill=(10, 18, 28, 215), outline=accent + (220,), width=1)
        draw.text((LEFT_BOX[0] + 22, LEFT_BOX[1] + 19), "LIVE SPECS 27 AR PREVIEW (NAVIGATION & RESET)", fill=accent + (255,), font=f_badge)

        draw.rounded_rectangle((RIGHT_BOX[0] + 12, RIGHT_BOX[1] + 12, RIGHT_BOX[0] + 520, RIGHT_BOX[1] + 42), radius=6, fill=(10, 18, 28, 215), outline=(130, 185, 230, 220), width=1)
        draw.text((RIGHT_BOX[0] + 22, RIGHT_BOX[1] + 19), "LENS STUDIO 5.24.1 EDITOR  |  CLAD + MCP + LEAF TESTS", fill=(175, 225, 255, 255), font=f_badge)

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
        "2. Scan & Faults (0:10)",
        "3. 3D Repairs (0:25)",
        "4. Telemetry & Done (0:55)",
        "5. Reset & CLAD/LEAF (1:20)",
        "6. Summary (1:35)",
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
    overlay_png = os.path.join(BUILD_DIR, f"overlay_v2_{ch['id']}.png")
    create_overlay_png(ch, overlay_png)

    out_clip = os.path.join(BUILD_DIR, f"clip_v2_{idx:02d}_{ch['id']}.mp4")

    # Source recordings are 2272x1824 (includes 66px macOS window shadow); crop to 2140x1692 first
    pts_scale = ch["duration"] / ch["src_dur"]
    pts_filter = f"setpts={pts_scale:.6f}*PTS," if abs(pts_scale - 1.0) > 0.001 else ""

    if ch["mode"] == "hero_ar":
        # Crop tightly around the active 3D equipment + floating HUD inside Preview 1:
        # 868x531 at x=1200, y=594 (exact aspect ratio 868/531 = 1.6346 vs 1380/844 = 1.6350)
        filter_complex = (
            f"[0:v]{pts_filter}fps={FPS},crop=2140:1692:66:66,"
            f"crop=868:531:1200:594,scale=1380:844:flags=lanczos[ar_vid];"
            f"color=c=#0a0f17:s=1920x1080:r={FPS}:d={ch['duration']}[base];"
            f"[base][ar_vid]overlay=24:74:shortest=1[tmp1];"
            f"[tmp1][1:v]overlay=0:0:shortest=1[outv]"
        )
    else:
        # EDITOR + AR WORKFLOW MODE (80-95s):
        # Left box: 1020x844 at (24, 74) -> cropped from Preview 1 active region (868x718 at x=1200, y=490)
        # Right box: 828x844 at (1068, 74) -> scaled from full 2140x1692 Lens Studio window
        filter_complex = (
            f"[0:v]{pts_filter}fps={FPS},crop=2140:1692:66:66,split=2[v_left][v_right];"
            f"[v_left]crop=868:718:1200:490,scale=1020:844:flags=lanczos[left_vid];"
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


def build_master_audio(total_duration: float, out_wav: str):
    sr = 44100
    total_samples = int(total_duration * sr)
    track = [0.0] * total_samples

    # Subtle ambient clean-room hum + harmonic pulse for continuous spatial atmosphere
    for i in range(total_samples):
        t = i / sr
        env = 0.016 + 0.005 * math.sin(2 * math.pi * 0.25 * t)
        hum = (
            0.55 * math.sin(2 * math.pi * 110.0 * t)
            + 0.30 * math.sin(2 * math.pi * 165.0 * t)
            + 0.15 * math.sin(2 * math.pi * 220.0 * t)
        )
        track[i] = env * hum

    # Overlay procedural SFX events from Assets/GeneratedSFX/
    t_cursor = 0.0
    for ch in CHAPTERS:
        for offset_sec, wav_name, gain in ch["sfx_events"]:
            wav_path = os.path.join(SFX_DIR, wav_name)
            if os.path.exists(wav_path):
                sfx = load_wav_mono(wav_path, sr)
                start_idx = int((t_cursor + offset_sec) * sr)
                for j, s in enumerate(sfx):
                    idx = start_idx + j
                    if 0 <= idx < total_samples:
                        track[idx] += s * gain
        t_cursor += ch["duration"]

    with wave.open(out_wav, "wb") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        buf = bytearray()
        for s in track:
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

    concat_txt = os.path.join(BUILD_DIR, "concat_list_v2.txt")
    with open(concat_txt, "w") as f:
        for c in clips:
            f.write(f"file '{c}'\n")

    master_wav = os.path.join(BUILD_DIR, "master_audio_v2.wav")
    print(f"Synthesizing synchronized spatial audio track ({total_dur:.1f}s)...")
    build_master_audio(total_dur, master_wav)

    print(f"Muxing final 1080p 30fps video to {OUT_MP4}...")
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
        OUT_MP4,
    ]
    subprocess.run(cmd, check=True, capture_output=True)

    if os.path.exists(os.path.dirname(ROOT_DEVPOST_MP4)):
        shutil.copy2(OUT_MP4, ROOT_DEVPOST_MP4)
    print(f"Done! Created {OUT_MP4} ({total_dur:.1f}s)")


if __name__ == "__main__":
    main()
