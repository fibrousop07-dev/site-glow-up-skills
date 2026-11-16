# Optional detailed Asset Studio runbook

Load only when operating an actual connected generator. Current user routing and the main skill production-media contract take precedence.

## 3c. Asset Studio (generate, judge, re-prompt loop)

Goal: turn `assets-prompts.md` into real files using the cheapest working path, with a smart model as the judge and a free model as the hands. The loop never spends credits it was not given and never blocks the build (placeholders stay wired).

### Path selection (first that probes true, per asset type)
**Images:** compare verified quality and actual credit cost for the selected art direction. Candidate routes: Google Flow/Nano Banana, OpenAI Images through a connected tool or Luna worker if it truly exposes image generation, Gemini API, Antigravity image tool, Higgsfield when connected, and local generation. Do not assume Flow is cheapest or Luna can generate images. If no route works, report the missing asset and provide a prompt; a placeholder is temporary scaffolding, never final art.
**Video:** compare verified Google Flow/Veo, Omni, Higgsfield, Antigravity video and any other connected route. Choose within the approved cap. If no real video route is available, use local WebGL/CSS motion and a static poster, labelled accurately. Never use `ffmpeg minterpolate`, RIFE, or another still-morphing technique to fake generated video.
State the chosen path per asset type in one line. Do not touch paid upgrades, purchases or plan changes anywhere, ever.

### Roles: teach once with a smart model, replay with a cheap one
- **Teach (once per machine/Flow UI version):** `sonnet-5.5` (proven at driving Chrome for ChatGPT/Flow) drives Flow with the user watching, and records `_research/flow-runbook.md`: URL, image vs video mode switch, aspect-ratio and duration controls, outputs-per-prompt setting, the prompt box selector, submit control, the "generation finished" wait condition, the credit-balance element, the download control, and any reference-image/"ingredients" input. Selectors are DOM/ARIA-based (role + name), with a text fallback.
- **Replay (every run):** `free_operator` follows the runbook step by step using the DOM/accessibility tree (it does not need vision for this), one asset per cycle, and reports the exact files it downloaded. It never improvises: if any step fails twice, it stops and hands the page to `sonnet-5.5` to repair the runbook, then resumes. Free models are never asked to judge or to guess the UI.
- **Judge:** `eye` scores every output (below). **Re-prompt:** `luna` rewrites the prompt from the judge's notes. **Ledger/ffmpeg:** `glm-5.3-flash`.

### Smoke test for `free_operator` (pass before it is trusted with the account)
It must (1) open Flow in the already-signed-in session, (2) read the credit balance, (3) type a harmless test prompt into the prompt box **without submitting**, (4) locate the submit and download controls, (5) report each as role+name. Any failure = `flow_operator: false` and the next path in the list is used.

### Human gates (stop and ask, never work around)
Sign-in, 2FA, CAPTCHA or bot checks, consent or terms dialogs, billing/upgrade prompts, or any unexpected permission request: stop, tell the user, wait. The operator never enters credentials, never solves CAPTCHAs, never clicks purchase or upgrade. Pace requests like a person would (sequential, no parallel tabs, no hammering) and stop if Flow throttles or warns about automation: automation may be against Flow's terms, so the user confirms they accept that risk once per run.

### Budget and consent (asked once per run, one prompt)
Show: assets to generate, the path per type, the credit cap (default = must-have assets x 2 rounds; read the starting balance from Flow), the download folder `assets/_gen/raw/`, and that the operator will click Flow's download button on the user's account. Proceed only on a yes. The ledger enforces the cap: stop when the balance drops below the starting balance minus the cap, or after **3 rounds per asset**.

### Ledger (`assets/_gen/ledger.json`, written by `glm-5.3-flash`)
Per asset id: filename, path used, prompt version, round, credits before/after, raw output files, judge scores, verdict (`pass` / `revise` / `give-up`), and the final chosen file. Also write `assets/_gen/PROVENANCE.md` (tool, date, prompt) for every shipped asset.

### The loop (per asset)
1. Generate only the number of variants justified by the approved budget and provider's real per-output pricing. Record the selected image/video worker independently of the parent coder model. Store the media file and return its path, preview and generation metadata to the parent conversation when supported.
2. `glm-5.3-flash` downloads files into `raw/`, verifies type/size/ratio, and builds a **contact sheet** (ImageMagick montage; for video: ffmpeg keyframes at 0%, 25%, 50%, 75%, 100% plus a frame-difference strip) so `eye` judges one image per round, not twenty.
3. `eye` scores each candidate 1-5 on: **style-block adherence**, **subject correctness**, **composition** (negative space where copy overlays, safe areas at the target ratio), **AI tells** (hands, garbled text, plastic skin, over-smooth gradients, warped geometry), **continuity** with already-approved sibling assets, **technical** (resolution, ratio, artifacts). Video adds **first/last-frame match**, **loop seam**, **motion smoothness** (no morphing or flicker from the frame-diff strip). Pass = no criterion below 4 and the average >= 4.2.
4. On `revise`, `eye` writes specific notes; `luna` rewrites the prompt (keep the Master Style Block intact, change only what the notes say) and attaches the best prior output as a reference image if the runbook records a reference input. Round counter +1.
5. On `pass`, copy the winner to `assets/<exact assets.md filename>`, optimise (Step 8 rules), and log it. After round 3 without a pass, take the best candidate, mark it `give-up` in the ledger, keep the placeholder wired, and add it to the Step 7 manual checklist with the best prompt so far.
6. Approve the **hero asset first**; generate the rest with the winning hero as the continuity reference so the set looks like one shoot.

### Other free or cheap routes (probe, never assume; free-tier limits change)
Antigravity's own image tool, any free image/video quota exposed by installed tools or connectors, local ComfyUI on this PC, and local WebGL/CSS motion for the hero. If none probes true, ship placeholders and the copy-paste prompts, as before.

