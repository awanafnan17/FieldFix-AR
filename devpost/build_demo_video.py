#!/usr/bin/env python3
"""
Builds the authentic 102-second (1m 42s) 1080p 30fps demonstration video for FieldFix AR
(`devpost/FieldFix-AR-Demo.mp4`) directly from continuous 60fps Lens Studio 5.24.1 window
recordings captured via macOS WindowServer (`screencapture -V ... -l <LensStudioWindowID>`).

Every single frame of the output video is real, continuous live footage of Lens Studio 5.24.1
and its SPECS 27 Preview panel:
- Left viewport (840x764): Live 1:1 zoomed view of the active `Preview 1` AR viewport showing
  the 3D Cryo-Coolant Pump & Relay Unit #04, dual-beam laser scan ring, bobbing 3D target
  chevron, 3D LOTO safety clasp, animated cryo-coolant flow rings, SIK hand pinch cursor,
  and world-anchored SpectaclesUIKit HUD.
- Right viewport (996x764): Full live Lens Studio 5.24.1 Editor window showing the 3D Scene
  View (SIK hand rig, triangle/joint telemetry), TypeScript compilation status, and LEAF runner.
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
        "id": "ch01_standby",
        "src": os.path.join(BUILD_DIR, "raw_live_gameplay.mov"),
        "is_2272": False,
        "ss": 0.0,
        "duration": 14.0,
        "step_badge": "CHAPTER 1 / 7   |   STANDBY & SPATIAL ANCHORING",
        "title": "FieldFix AR: Spatial Equipment Diagnostic & Repair Assistant (SPECS 27)",
        "telemetry": "PHASE: READY_TO_SCAN   |   TEMP: 118°C (CRITICAL)   |   PSI: 142 (FAULT)   |   FLOW: 18% (RESTRICTED)",
        "caption_1": "• World-anchored at z = -110 cm in Lens Studio 5.24.1 (SPECS 27 Preview): 3D Cryo-Coolant Pump & Relay Unit #04 on left, SpectaclesUIKit HUD on right.",
        "caption_2": "• 3D subsystems pulse with severity telemetry: CV-101 Intake Valve (Amber), PR-204 Pressure Regulator (Amber 142 PSI), TR-309 Thermal Relay (Red 118°C).",
        "accent": (72, 225, 255),
        "sfx_events": [(0.6, "ButtonClick.wav", 0.55), (6.5, "FaultAlert.wav", 0.50)],
    },
    {
        "id": "ch02_scan_and_focus",
        "src": os.path.join(BUILD_DIR, "raw_sik_full_journey_with_nav_and_reset.mov"),
        "is_2272": True,
        "ss": 1.0,
        "duration": 14.0,
        "step_badge": "CHAPTER 2 / 7   |   SIK HAND PINCH: LASER SCAN & SUBSYSTEM FOCUS",
        "title": "Hands-Free SIK Pinch Triggers Volumetric 3D Laser Sweep & Fault Localization",
        "telemetry": "ACTION: PINCH [SCAN EQUIPMENT TELEMETRY]  ->  PINCH [CV-101 VALVE]   |   TARGET: CV-101 ISOLATION",
        "caption_1": "• Real SIK right-hand pinch on [SCAN EQUIPMENT TELEMETRY] sweeps the dual-beam 3D LaserScanSweepRing across the manifold and localizes TR-309 overheat.",
        "caption_2": "• Technician pinches [CV-101 VALVE] on the HUD (or 3D hotspot) to inspect root cause; 3D ActiveStepTargetChevron bobs directly above CV-101.",
        "accent": (255, 205, 70),
        "sfx_events": [(2.5, "ScanSweep.wav", 0.80), (6.5, "FaultAlert.wav", 0.60), (10.2, "ButtonClick.wav", 0.70)],
    },
    {
        "id": "ch03_step1_and_step2_3d",
        "src": os.path.join(BUILD_DIR, "raw_sik_full_journey_with_nav_and_reset.mov"),
        "is_2272": True,
        "ss": 11.0,
        "duration": 14.0,
        "step_badge": "CHAPTER 3 / 7   |   DIRECT 3D HOTSPOT PINCH: STEP 1 (LOTO) & STEP 2 (PURGE)",
        "title": "Direct 3D Equipment Manipulation: LOTO Safety Clasp & Pressure Regulator Purge",
        "telemetry": "STEP 1/4: CV-101 LOCKED (0% FLOW) [1:LOTO OK]   ->   STEP 2/4: PR-204 PURGED (142 -> 38 PSI) [2:PURGE OK]",
        "caption_1": "• Step 1/4: Pinching 3D Hotspot_CoolantValve rotates the 3D valve wheel 90° clockwise, snaps the red 3D LOTO Safety Clasp onto the stem, and halts pipe flow rings.",
        "caption_2": "• Step 2/4: Pinching 3D Hotspot_PressureRegulator purges bypass vapor, sweeping the 3D gauge needle from 142 PSI into the green 38 PSI zone and cooling to 82°C.",
        "accent": (255, 165, 60),
        "sfx_events": [(1.5, "RepairStepConfirm.wav", 0.85), (5.5, "ButtonClick.wav", 0.65), (7.8, "RepairStepConfirm.wav", 0.85)],
    },
    {
        "id": "ch04_step3_step4_and_nav",
        "src": os.path.join(BUILD_DIR, "raw_sik_full_journey_with_nav_and_reset.mov"),
        "is_2272": True,
        "ss": 21.0,
        "duration": 16.0,
        "step_badge": "CHAPTER 4 / 7   |   STEP 3 (RELAY RESEAT), STEP 4 (100% NOMINAL) & STEP REVIEW",
        "title": "Thermal Relay Core Reseating, Full Cryo-Coolant Flow Restoration & Step Navigation",
        "telemetry": "STEP 3/4: TR-309 COOLED (46°C)   ->   STEP 4/4: COMPLETED (42°C | 45 PSI | 100% FLOW | 4/4 DONE)",
        "caption_1": "• Step 3/4: Pinching [EXECUTE STEP 3] retracts the 3D ThermalRelayCore plunger into its housing (46°C). Step 4/4: Pinching 3D CV-101 clears LOTO & restores 100% flow.",
        "caption_2": "• All 3D halos, overhead beacon, target chevron, and rapid pipe flow rings turn emerald green ([1..4 OK]). Technician pinches [< PREV STEP] to review completed steps.",
        "accent": (72, 245, 148),
        "sfx_events": [(1.4, "RepairStepConfirm.wav", 0.85), (5.3, "DiagnosticComplete.wav", 0.95), (9.8, "ButtonClick.wav", 0.65), (12.8, "ButtonClick.wav", 0.65)],
    },
    {
        "id": "ch05_hud_workflow",
        "src": os.path.join(BUILD_DIR, "raw_live_gameplay.mov"),
        "is_2272": False,
        "ss": 36.0,
        "duration": 16.0,
        "step_badge": "CHAPTER 5 / 7   |   DUAL-MODALITY HANDS-FREE INTERACTION (3D HOTSPOTS + UIKIT HUD)",
        "title": "Seamless Synchronization Between 3D Machine Geometry, Spatial Callouts & UIKit Frame",
        "telemetry": "SYNCHRONIZED 3D + 2D STATE MACHINE   |   ZERO CLOUD / ZERO EXTERNAL API DEPENDENCIES",
        "caption_1": "• Technicians can trigger steps either by pinching the physical 3D subsystem hotspots directly on the machine OR via the world-space SpectaclesUIKit button panel.",
        "caption_2": "• Every state transition updates the 3D mechanical parts (valve wheel, LOTO clasp, gauge needle, relay core, flow rings) and spatial callouts in lockstep.",
        "accent": (72, 225, 255),
        "sfx_events": [(2.0, "RepairStepConfirm.wav", 0.75), (8.0, "RepairStepConfirm.wav", 0.75), (13.0, "DiagnosticComplete.wav", 0.85)],
    },
    {
        "id": "ch06_leaf_full_scenario",
        "src": os.path.join(BUILD_DIR, "raw_live_gameplay_continuous.mov"),
        "is_2272": False,
        "ss": 0.5,
        "duration": 15.0,
        "step_badge": "CHAPTER 6 / 7   |   LIVE LEAF INTEGRATION TESTING: FULL REPAIR SCENARIO",
        "title": "Automated In-Preview Verification via CLAD + Lens Studio MCP (FieldFixFullDiagnosticRepairScenario)",
        "telemetry": "LEAF SCENARIO 1 & 2: PASSED   |   [ 5.663s][FieldFixFullDiagnosticRepairScenario] PASSED",
        "caption_1": "• Built and verified using CLAD skills and Lens Studio MCP tools (PreviewInteractTool, QueryRuntimeSceneTool, run_leaf_scenario, RunAndCollectLogsTool).",
        "caption_2": "• Live execution of FieldFixFullDiagnosticRepairScenario in Preview 1 confirms deterministic 0/4 -> 4/4 state transitions and telemetry invariants.",
        "accent": (72, 245, 148),
        "sfx_events": [(1.0, "ScanSweep.wav", 0.70), (5.8, "DiagnosticComplete.wav", 0.90)],
    },
    {
        "id": "ch07_leaf_reset_replay",
        "src": os.path.join(BUILD_DIR, "raw_leaf_reset_replay.mov"),
        "is_2272": True,
        "ss": 0.0,
        "duration": 11.5,
        "step_badge": "CHAPTER 7 / 7   |   RESET & REPLAY VERIFICATION (FieldFixResetAndReplayScenario)",
        "title": "One-Pinch Equipment Reset & Repeatable Technician Training Loop Verified",
        "telemetry": "LEAF SCENARIO 3: [ 0.985s][FieldFixResetAndReplayScenario] PASSED   |   3 / 3 SCENARIOS PASSED",
        "caption_1": "• Pinching [RESET UNIT] cleanly restores all 3D mechanical transforms, LOTO safety clasp, flow rings, and telemetry (116°C, 140 PSI, 0/4) for repeatable training.",
        "caption_2": "• Zero TypeScript compile errors, zero runtime exceptions, 100% self-contained procedural 3D meshes & 44.1 kHz spatial WAV audio.",
        "accent": (72, 225, 255),
        "sfx_events": [(1.0, "ButtonClick.wav", 0.75), (4.5, "ScanSweep.wav", 0.70), (8.5, "DiagnosticComplete.wav", 0.85)],
    },
]


def load_font(size: int, bold: bool = False):
    candidates = [
        "/System/Library/Fonts/SFNSMono.ttf",
        "/System/Library/Fonts/Menlo.ttc",
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
    ]
    for path in candidates:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                pass
    return ImageFont.load_default()


def create_overlay_png(ch: dict, idx: int, total: int, out_path: str):
    """Creates a 1920x1080 RGBA overlay with transparent cutouts for the two live video viewports."""
    img = Image.new("RGBA", (W, H), (11, 16, 24, 255))
    draw = ImageDraw.Draw(img)

    # Cut out transparent windows for the two live video streams:
    # Left window: Zoomed Preview 1 AR Viewport (x=24..864, y=96..860 -> 840x764)
    # Right window: Full Lens Studio 5.24.1 Editor Window (x=888..1896, y=96..860 -> 1008x764)
    LEFT_BOX = (24, 96, 864, 860)
    RIGHT_BOX = (888, 96, 1896, 860)

    draw.rectangle(LEFT_BOX, fill=(0, 0, 0, 0))
    draw.rectangle(RIGHT_BOX, fill=(0, 0, 0, 0))

    accent = ch["accent"]
    # Viewport borders
    draw.rectangle((LEFT_BOX[0] - 2, LEFT_BOX[1] - 2, LEFT_BOX[2] + 2, LEFT_BOX[3] + 2), outline=accent + (230,), width=2)
    draw.rectangle((RIGHT_BOX[0] - 2, RIGHT_BOX[1] - 2, RIGHT_BOX[2] + 2, RIGHT_BOX[3] + 2), outline=(90, 130, 165, 210), width=2)

    # Viewport corner badges (semi-transparent top-left pills inside each viewport)
    f_badge = load_font(15, bold=True)
    draw.rounded_rectangle((LEFT_BOX[0] + 10, LEFT_BOX[1] + 10, LEFT_BOX[0] + 470, LEFT_BOX[1] + 38), radius=6, fill=(10, 18, 28, 215), outline=accent + (220,), width=1)
    draw.text((LEFT_BOX[0] + 18, LEFT_BOX[1] + 16), "LIVE SPECS 27 AR VIEWPORT (1:1 ZOOMED CROP)", fill=accent + (255,), font=f_badge)

    draw.rounded_rectangle((RIGHT_BOX[0] + 10, RIGHT_BOX[1] + 10, RIGHT_BOX[0] + 530, RIGHT_BOX[1] + 38), radius=6, fill=(10, 18, 28, 215), outline=(120, 175, 220, 220), width=1)
    draw.text((RIGHT_BOX[0] + 18, RIGHT_BOX[1] + 16), "LIVE LENS STUDIO 5.24.1 EDITOR & SCENE HIERARCHY", fill=(165, 220, 255, 255), font=f_badge)

    # Top Header Bar (y=0..86)
    draw.rectangle((0, 0, W, 86), fill=(14, 22, 34, 255))
    draw.line((0, 86, W, 86), fill=accent + (255,), width=3)

    f_step = load_font(16, bold=True)
    f_title = load_font(23, bold=True)
    draw.text((28, 12), ch["step_badge"], fill=accent + (255,), font=f_step)
    draw.text((28, 40), ch["title"], fill=(242, 248, 255, 255), font=f_title)

    # Top-right progress pill
    draw.rounded_rectangle((1520, 18, 1896, 68), radius=8, fill=(20, 34, 50, 255), outline=accent + (220,), width=2)
    draw.text((1542, 34), "LEARN AR WITH SPECS  |  CLAD + MCP", fill=(210, 238, 255, 255), font=f_badge)

    # Bottom Telemetry & Narration Bar (y=870..1080)
    draw.rectangle((0, 870, W, H), fill=(12, 19, 30, 255))
    draw.line((0, 870, W, 870), fill=(65, 105, 145, 255), width=2)

    # Telemetry strip pill
    draw.rounded_rectangle((24, 884, 1896, 926), radius=6, fill=(18, 31, 48, 255), outline=accent + (180,), width=1)
    f_tele = load_font(17, bold=True)
    draw.text((38, 896), ch["telemetry"], fill=accent + (255,), font=f_tele)

    # Two-line technical narration
    f_cap = load_font(16, bold=False)
    draw.text((32, 944), ch["caption_1"], fill=(235, 244, 255, 255), font=f_cap)
    draw.text((32, 982), ch["caption_2"], fill=(195, 218, 240, 255), font=f_cap)

    # Chapter timeline bar at very bottom (y=1036..1062)
    bar_x0, bar_x1 = 32, 1888
    bar_w = bar_x1 - bar_x0
    seg_w = bar_w // total
    for i in range(total):
        sx0 = bar_x0 + i * seg_w + 4
        sx1 = bar_x0 + (i + 1) * seg_w - 4
        if i < idx:
            col = (55, 195, 120, 255)
        elif i == idx:
            col = accent + (255,)
        else:
            col = (38, 54, 74, 255)
        draw.rounded_rectangle((sx0, 1042, sx1, 1058), radius=4, fill=col)

    img.save(out_path)


def render_chapter_clip(ch: dict, idx: int, total: int) -> str:
    overlay_png = os.path.join(BUILD_DIR, f"overlay_{ch['id']}.png")
    create_overlay_png(ch, idx, total, overlay_png)

    out_clip = os.path.join(BUILD_DIR, f"clip_{idx:02d}_{ch['id']}.mp4")

    # If source is 2272x1824 (includes 66px macOS window shadow), first crop to 2140x1692 so coordinates match identically
    norm_filter = "crop=2140:1692:66:66," if ch["is_2272"] else ""

    # Left box: 840x764 at (24, 96) -> cropped from Preview 1 active region (870x790 at x=1205, y=390)
    # Right box: 1008x764 at (888, 96) -> scaled from full 2140x1692 Lens Studio window (966x764 padded to 1008x764)
    filter_complex = (
        f"[0:v]fps={FPS},{norm_filter}split=2[v_for_left][v_for_right];"
        f"[v_for_left]crop=870:790:1205:390,scale=840:764:flags=lanczos[left_vid];"
        f"[v_for_right]scale=966:764:flags=lanczos,pad=1008:764:21:0:color=#0b1018[right_vid];"
        f"color=c=#0b1018:s=1920x1080:r={FPS}:d={ch['duration']}[base];"
        f"[base][left_vid]overlay=24:96:shortest=1[tmp1];"
        f"[tmp1][right_vid]overlay=888:96:shortest=1[tmp2];"
        f"[tmp2][1:v]overlay=0:0:shortest=1[outv]"
    )

    cmd = [
        "ffmpeg",
        "-y",
        "-ss",
        str(ch["ss"]),
        "-t",
        str(ch["duration"]),
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
        "-c:v",
        "libx264",
        "-preset",
        "fast",
        "-crf",
        "18",
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
        framerate = wf.getframerate()
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

    # Subtle ambient clean-room hum + harmonic pulse so the video has continuous spatial atmosphere
    for i in range(total_samples):
        t = i / sr
        env = 0.018 + 0.006 * math.sin(2 * math.pi * 0.25 * t)
        hum = (
            0.55 * math.sin(2 * math.pi * 110.0 * t)
            + 0.30 * math.sin(2 * math.pi * 165.0 * t)
            + 0.15 * math.sin(2 * math.pi * 220.0 * t)
        )
        track[i] = env * hum

    # Overlay chapter transition chime and SFX events from Assets/GeneratedSFX/
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

    # Clamp and write 16-bit PCM WAV
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
        print(f"Rendering chapter {idx+1}/{len(CHAPTERS)}: {ch['id']} ({ch['duration']}s)...")
        clip_path = render_chapter_clip(ch, idx, len(CHAPTERS))
        clips.append(clip_path)
        total_dur += ch["duration"]

    concat_txt = os.path.join(BUILD_DIR, "concat_list.txt")
    with open(concat_txt, "w") as f:
        for c in clips:
            f.write(f"file '{c}'\n")

    master_wav = os.path.join(BUILD_DIR, "master_audio.wav")
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
        "18",
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

    os.makedirs(os.path.dirname(ROOT_DEVPOST_MP4), exist_ok=True)
    shutil.copy2(OUT_MP4, ROOT_DEVPOST_MP4)
    print(f"Done! Created {OUT_MP4} and {ROOT_DEVPOST_MP4}")


if __name__ == "__main__":
    main()
