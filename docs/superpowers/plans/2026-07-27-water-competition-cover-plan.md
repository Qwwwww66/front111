# Water Competition Cover Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce a polished 1920 × 1080 competition-video cover as an editable PPTX, a final PNG, and a text-free scientific background image.

**Architecture:** Generate one text-free scientific hero image for the right side of the composition, then assemble the complete cover as one editable PowerPoint slide. Keep every title, participant label, workflow label, line, and accent as a native editable presentation object; use the generated image only for the scientific catalyst visualization.

**Tech Stack:** Built-in Image Generation, `@oai/artifact-tool`, bundled presentation rendering and overflow validation tools.

## Global Constraints

- Canvas: 16:9, 1920 × 1080.
- Main title: `水处理催化材料设计多智能体系统`.
- Brand subtitle: `NJU-ECOMATS`.
- School: `南京大学 / NANJING UNIVERSITY`.
- Students: `郭俊希、韩昱、周佳奇、李聪福、金文权`.
- Advisors: `王瑾丰、潘尧`.
- Workflow: `需求解析 → 材料设计 → 专家评价 → 机理挖掘 → 运行优化`.
- Do not imitate the Nanjing University crest.
- All visible text and workflow elements must remain editable in the PPTX.
- Avoid baked-in text, generic software screenshots, excessive purple gradients, cheap neon effects, and unverified crystal identifiers.

---

### Task 1: Generate the scientific hero background

**Files:**
- Create: `output/competition-cover/nju-ecomats-cover-background.png`
- Create: `tmp/competition-cover/source-notes.txt`

**Interfaces:**
- Consumes: The visual direction and color constraints from the design specification.
- Produces: A text-free 16:9 raster image with the catalyst structure concentrated on the right and usable negative space on the left.

- [ ] **Step 1: Generate the background**

Use the built-in image generation tool with a `scientific-educational` prompt specifying deep navy water, cyan and teal reaction trails, silver atomic lattice, amber active sites, pollutant fragmentation, clean-water flow, right-weighted composition, no text, no logos, and no watermark.

- [ ] **Step 2: Inspect the generated image**

Verify the image contains no malformed text, no university crest, no fake chemical labels, and sufficient dark negative space for the title.

- [ ] **Step 3: Save the accepted image**

Copy the accepted generated file into `output/competition-cover/nju-ecomats-cover-background.png` and record the exact prompt in `tmp/competition-cover/source-notes.txt`.

### Task 2: Build the editable one-slide PowerPoint

**Files:**
- Create: `tmp/competition-cover/build-cover.mjs`
- Create: `output/competition-cover/NJU-ECOMATS-水创意大赛视频封面.pptx`

**Interfaces:**
- Consumes: `nju-ecomats-cover-background.png`.
- Produces: A one-slide presentation with editable text, workflow nodes, connectors, and accents.

- [ ] **Step 1: Initialize the artifact-tool workspace**

Run the bundled `setup_artifact_tool_workspace.mjs` against `tmp/competition-cover`.

- [ ] **Step 2: Implement the slide**

Create a 16:9 slide with:

```text
Left 42%:
  南京大学 / NANJING UNIVERSITY
  水处理催化材料设计
  多智能体系统
  NJU-ECOMATS
  参赛学生与指导教师

Right 58%:
  generated catalyst background image

Bottom:
  需求解析 → 材料设计 → 专家评价 → 机理挖掘 → 运行优化
```

Use deep navy `#061224`, cyan `#43D7E8`, teal `#55E1B5`, off-white `#F3F7FA`, and amber `#F3B75B`. Use at least 50 pt for the main title, at least 24 pt for the brand subtitle, and at least 16 pt for participant information.

- [ ] **Step 3: Export the PPTX**

Write the artifact-tool presentation to `output/competition-cover/NJU-ECOMATS-水创意大赛视频封面.pptx`.

### Task 3: Render and verify final deliverables

**Files:**
- Create: `output/competition-cover/NJU-ECOMATS-水创意大赛视频封面.png`
- Create: `tmp/competition-cover/rendered/slide-1.png`

**Interfaces:**
- Consumes: Final PPTX.
- Produces: QA-approved PNG and validated editable PPTX.

- [ ] **Step 1: Render the presentation**

Run:

```powershell
python "$SKILL_DIR/container_tools/render_slides.py" "$FINAL_PPTX"
```

Expected: one PNG named `slide-1.png`.

- [ ] **Step 2: Run overflow validation**

Run:

```powershell
python "$SKILL_DIR/container_tools/slides_test.py" "$FINAL_PPTX"
```

Expected: no overflow or slide-bound violations.

- [ ] **Step 3: Inspect the slide at full size**

Check title wrapping, participant names, advisor names, workflow alignment, image crop, contrast, and safe margins. Revise and rerender until no visible defects remain.

- [ ] **Step 4: Save the final PNG**

Copy the approved `slide-1.png` to `output/competition-cover/NJU-ECOMATS-水创意大赛视频封面.png`.

- [ ] **Step 5: Commit the artifacts**

Stage only the plan, design specification, reproducible build source, and final deliverables. Commit after Git author identity is configured; do not include unrelated working-tree changes.
