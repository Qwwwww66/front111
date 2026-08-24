import fs from "node:fs/promises";
import path from "node:path";
import { Presentation, PresentationFile } from "@oai/artifact-tool";

const ROOT = "C:/Users/since/Desktop/工作/水创意设计大赛/WEB_CREWAI_NEW";
const OUT_DIR = path.join(ROOT, "output/competition-cover");
const BACKGROUND = path.join(OUT_DIR, "nju-ecomats-cover-background.png");
const FINAL_PPTX = path.join(OUT_DIR, "NJU-ECOMATS-水创意大赛视频封面.pptx");
const SCALE = 2 / 3;

function scaledPosition(position) {
  return {
    left: position.left * SCALE,
    top: position.top * SCALE,
    width: position.width * SCALE,
    height: position.height * SCALE,
  };
}

async function readImageBlob(filePath) {
  const bytes = await fs.readFile(filePath);
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

function addText(slide, name, text, position, style) {
  const scaled = scaledPosition(position);
  const lineCount = text.split("\n").length;
  scaled.height = Math.max(scaled.height, style.fontSize * lineCount * 1.28);
  const shape = slide.shapes.add({
    geometry: "textbox",
    name,
    position: scaled,
    fill: "none",
    line: { style: "solid", fill: "none", width: 0 },
  });
  shape.text = text;
  shape.text.style = {
    fontFamily: style.fontFamily ?? "Microsoft YaHei",
    fontSize: style.fontSize,
    bold: style.bold ?? false,
    color: style.color,
    alignment: style.alignment ?? "left",
  };
  return shape;
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const presentation = Presentation.create({
    slideSize: { width: 1280, height: 720 },
  });
  const slide = presentation.slides.add();
  slide.background.fill = "#061224";
  const addShape = (options) =>
    slide.shapes.add({
      ...options,
      position: scaledPosition(options.position),
    });

  const backgroundBytes = await readImageBlob(BACKGROUND);
  slide.images.add({
    blob: backgroundBytes,
    contentType: "image/png",
    alt: "水处理催化材料原子结构、活性位点与污染物降解过程的科研可视化",
    fit: "cover",
    position: { left: 0, top: 0, width: 1280, height: 720 },
  });

  addShape({
    geometry: "rect",
    name: "left-contrast-gradient",
    position: { left: 0, top: 0, width: 1380, height: 1080 },
    fill: "linear(90deg, #04101F/99 0%, #061224/96 45%, #061224/72 67%, #061224/0 100%)",
    line: { style: "solid", fill: "none", width: 0 },
  });

  addShape({
    geometry: "rect",
    name: "bottom-contrast-gradient",
    position: { left: 0, top: 840, width: 1920, height: 240 },
    fill: "linear(180deg, #061224/0 0%, #04101F/94 100%)",
    line: { style: "solid", fill: "none", width: 0 },
  });

  addShape({
    geometry: "rect",
    name: "top-accent-rule",
    position: { left: 82, top: 76, width: 62, height: 4 },
    fill: "#43D7E8",
    line: { style: "solid", fill: "none", width: 0 },
  });

  addText(
    slide,
    "school-lockup",
    "南京大学  /  NANJING UNIVERSITY",
    { left: 164, top: 61, width: 610, height: 42 },
    { fontSize: 18, bold: true, color: "#B8CBD6" },
  );

  addText(
    slide,
    "english-eyebrow",
    "WATER CATALYTIC MATERIALS · MULTI-AGENT INTELLIGENCE",
    { left: 82, top: 132, width: 720, height: 34 },
    { fontFamily: "Aptos", fontSize: 15, bold: true, color: "#55E1B5" },
  );

  addText(
    slide,
    "main-title",
    "水处理催化材料设计\n多智能体系统",
    { left: 78, top: 190, width: 780, height: 230 },
    { fontSize: 50, bold: true, color: "#F3F7FA" },
  );

  addText(
    slide,
    "brand-subtitle",
    "NJU-ECOMATS",
    { left: 82, top: 450, width: 520, height: 62 },
    { fontFamily: "Aptos Display", fontSize: 34, bold: true, color: "#43D7E8" },
  );

  addShape({
    geometry: "rect",
    name: "brand-underline",
    position: { left: 82, top: 522, width: 164, height: 3 },
    fill: "#43D7E8",
    line: { style: "solid", fill: "none", width: 0 },
  });

  addText(
    slide,
    "platform-tagline",
    "基于 Qwen + CrewAI 的环境功能材料智能设计平台",
    { left: 82, top: 552, width: 720, height: 46 },
    { fontSize: 21, color: "#C7D6DE" },
  );

  addText(
    slide,
    "students-label",
    "参赛学生",
    { left: 82, top: 660, width: 130, height: 32 },
    { fontSize: 16, bold: true, color: "#55E1B5" },
  );

  addText(
    slide,
    "students-names",
    "郭俊希、韩昱、周佳奇、李聪福、金文权",
    { left: 82, top: 700, width: 680, height: 40 },
    { fontSize: 22, color: "#F3F7FA" },
  );

  addText(
    slide,
    "advisors-label",
    "指导教师",
    { left: 82, top: 770, width: 130, height: 32 },
    { fontSize: 16, bold: true, color: "#F3B75B" },
  );

  addText(
    slide,
    "advisors-names",
    "王瑾丰、潘尧",
    { left: 82, top: 810, width: 340, height: 40 },
    { fontSize: 22, color: "#F3F7FA" },
  );

  addText(
    slide,
    "visual-caption",
    "CATALYTIC ACTIVE SITES  ·  ELECTRON TRANSFER  ·  POLLUTANT DEGRADATION",
    { left: 1095, top: 86, width: 730, height: 30 },
    { fontFamily: "Aptos", fontSize: 12, bold: true, color: "#A5C5D1", alignment: "right" },
  );

  const flowLabels = ["需求解析", "材料设计", "专家评价", "机理挖掘", "运行优化"];
  const flowXs = [104, 462, 820, 1178, 1536];
  for (let index = 0; index < flowXs.length - 1; index += 1) {
    addShape({
      geometry: "rect",
      name: `workflow-connector-${index + 1}`,
      position: { left: flowXs[index] + 18, top: 956, width: flowXs[index + 1] - flowXs[index] - 18, height: 2 },
      fill: index === 3 ? "#55E1B5/70" : "#43D7E8/58",
      line: { style: "solid", fill: "none", width: 0 },
    });
  }

  flowXs.forEach((x, index) => {
    addShape({
      geometry: "ellipse",
      name: `workflow-node-${index + 1}`,
      position: { left: x, top: 946, width: 20, height: 20 },
      fill: index === 2 ? "#F3B75B" : index === 4 ? "#55E1B5" : "#43D7E8",
      line: { style: "solid", fill: "#F3F7FA/65", width: 1 },
    });
    addText(
      slide,
      `workflow-label-${index + 1}`,
      flowLabels[index],
      { left: x - 12, top: 982, width: 170, height: 34 },
      { fontSize: 17, bold: index === 2, color: "#DDEAF0" },
    );
  });

  addText(
    slide,
    "workflow-kicker",
    "MULTI-AGENT COLLABORATION WORKFLOW",
    { left: 82, top: 900, width: 470, height: 28 },
    { fontFamily: "Aptos", fontSize: 12, bold: true, color: "#6EA3B5" },
  );

  addShape({
    geometry: "rect",
    name: "right-edge-marker",
    position: { left: 1837, top: 938, width: 2, height: 52 },
    fill: "#43D7E8/72",
    line: { style: "solid", fill: "none", width: 0 },
  });

  slide.speakerNotes.textFrame.setText(
    "[Sources]\n- OpenAI built-in image generation: original scientific catalyst visualization generated for this cover on 2026-07-27.\n- All names and project information supplied by the user from the competition registration form.",
  );
  slide.speakerNotes.setVisible(false);

  const pptx = await PresentationFile.exportPptx(presentation);
  await pptx.save(FINAL_PPTX);
  console.log(FINAL_PPTX);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
