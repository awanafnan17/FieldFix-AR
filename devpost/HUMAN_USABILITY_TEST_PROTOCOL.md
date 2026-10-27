# FieldFix AR V5 — Five-Minute First-Time Human Reviewer Usability Test Protocol

> **Methodological Disclosure (Stage 5 Requirement):**  
> AI-based simulated reviewers (`blind-qa-explorer` and `independent-red-team-judge`) are **not** substitutes for real human test participants. All AI critiques in [`VERIFICATION_REPORT.md`](./VERIFICATION_REPORT.md) are explicitly labeled as *Simulated Agent Critique*. Use this 5-minute protocol with **2–3 human reviewers who have never seen FieldFix AR** to record genuine human usability observations before final submission.

---

## 1. Setup Before the Participant Arrives (1 Minute)

1. Open [`FieldFix-AR.esproj`](../FieldFix-AR.esproj) in **Lens Studio 5.24.1**.
2. Set the Preview Panel to **`SPECS 27`** device and **`Interactive`** mode.
3. Click **`RESET UNIT`** on the HUD (or refresh the preview) so the scene starts cleanly in `READY_TO_SCAN` (`0 / 4 DONE`, `TR-309: 116C [OVERHEAT SYMPTOM]`, `PR-204: [UNINSPECTED]`, `CV-101: [UNINSPECTED]`).
4. **Rule for Facilitator:** Do **not** explain the fault chain (`142 PSI` or `18%`), do **not** point to which part to click next, and do **not** intervene unless the participant is stuck for more than 60 seconds.

---

## 2. Five-Minute Facilitator Script & Observation Tasks

### Task 1 — Initial 10-Second Impression (0:00 – 0:45)
- **Prompt to Participant:** *"Look at the preview window for 10 seconds without clicking anything yet. In your own words: (1) What is this application for, and (2) Which part of the machine currently shows a problem?"*
- **Pass Criteria:**
  - [ ] **Q1 (Purpose):** Participant identifies that it is an AR equipment/pump maintenance or fault-diagnosis trainer.
  - [ ] **Q2 (Starting Symptom):** Participant identifies the red right-hand component (`TR-309` Thermal Relay Core / `116°C` overheat symptom) and notices that the middle/left components say `[UNINSPECTED]`.

### Task 2 — Unassisted Upstream Fault Trace (0:45 – 2:15)
- **Prompt to Participant:** *"Go ahead and start the scan, then figure out what is causing the overheat using the 3D machine or panel."*
- **What to Observe (Zero Developer Assistance):**
  - Does the participant click/pinch `SCAN EQUIPMENT TELEMETRY`?
  - At `Trace 1/3`, do they follow the 3D chevron upstream to `PR-204` (`142 PSI` bottleneck) and then to `CV-101` (`18%` flow root cause)?
  - If they click `CV-101` early at `Trace 1/3`, do they understand the `[INSPECT PR-204 FIRST]` prompt?
- **Pass Criteria:**
  - [ ] **Q3 (Unassisted Trace):** Participant reaches `ROOT CAUSE TRACED (3/3)` (`CV-101: 18% FLOW`) without developer hints and can state that `CV-101` (`18%` flow) starved `PR-204` (`142 PSI` vapor lock), which overheated `TR-309` (`118°C`).

### Task 3 — LOTO Safety Interlock Comprehension (2:15 – 3:15)
- **Prompt to Participant:** *"Before touching the left intake valve (`CV-101`), try clicking/pinching the middle pressure regulator (`PR-204`) twice to bleed the 142 PSI pressure right now. Tell me what happened and why."*
- **Pass Criteria:**
  - [ ] **Q4 (Safety Interlock):** Participant observes the red flash / alert chime and explains that bleeding `PR-204` (`Step 2`) was blocked because the `CV-101` Intake Valve (`Step 1` Lockout-Tagout) must be isolated first, and notes the `-15%` safety score penalty.

### Task 4 — 4-Step Repair & Post-Repair Verification (3:15 – 5:00)
- **Prompt to Participant:** *"Now complete all 4 repair steps in order, and then tell me what changed on the 3D machine."*
- **Pass Criteria:**
  - [ ] **Q5 (What Changed After Repair):** Participant completes Steps `1 -> 2 -> 3 -> 4` and identifies at least two visible 3D state changes (e.g., `CV-101` yellow lever rotated + red LOTO clasp engaged/cleared, `PR-204` needle moved from red `142 PSI` to green `38/45 PSI`, `TR-309` plunger retracted and turned green `42°C`, green flow rings spinning at `100%`, and `85% B+` scorecard).

---

## 3. Human Reviewer Scorecard Template (Record 2–3 Reviewers)

| Metric / Question | Reviewer #1 *(Unverified — Pending Human Run)* | Reviewer #2 *(Unverified — Pending Human Run)* | Reviewer #3 *(Unverified — Pending Human Run)* |
| :--- | :--- | :--- | :--- |
| **1. Explained what the Lens is for (`< 10s`)** | `[ ] PASS / [ ] FAIL` — Notes: | `[ ] PASS / [ ] FAIL` — Notes: | `[ ] PASS / [ ] FAIL` — Notes: |
| **2. Identified starting symptom (`TR-309 116°C`)** | `[ ] PASS / [ ] FAIL` — Notes: | `[ ] PASS / [ ] FAIL` — Notes: | `[ ] PASS / [ ] FAIL` — Notes: |
| **3. Completed `1/3 -> 2/3 -> 3/3` trace unassisted** | `[ ] PASS / [ ] FAIL` — Time (`s`): | `[ ] PASS / [ ] FAIL` — Time (`s`): | `[ ] PASS / [ ] FAIL` — Time (`s`): |
| **4. Explained why LOTO safety action was blocked** | `[ ] PASS / [ ] FAIL` — Notes: | `[ ] PASS / [ ] FAIL` — Notes: | `[ ] PASS / [ ] FAIL` — Notes: |
| **5. Explained what changed on the 3D machine after repair** | `[ ] PASS / [ ] FAIL` — Notes: | `[ ] PASS / [ ] FAIL` — Notes: | `[ ] PASS / [ ] FAIL` — Notes: |
| **Any point of confusion or hesitation observed** | | | |
