import Link from "next/link";

type HeroConsoleProps = {
  locale: "zh" | "en";
  active?: boolean;
};

const copy = {
  zh: {
    switchHref: "/en",
    switchLabel: "EN",
    eyebrow: "NANJING UNIVERSITY · ENVIRONMENTAL MATERIALS INTELLIGENCE",
    title: "水处理催化材料设计多智能体系统",
    brand: "（NJU-ECOMATS）",
    description:
      "基于 Qwen + CrewAI 构建水处理催化材料设计多智能体系统，协同完成需求解析、材料设计、专家评价、机理挖掘、合成指导与运行优化，为环境功能材料研发提供可追踪、可解释的智能设计工作流。",
    capabilities: ["智能调度", "材料设计", "材料评价", "机理挖掘", "合成指导", "运行优化"],
    metrics: [
      ["05", "协同智能体"],
      ["08", "流程节点"],
      ["24/7", "系统响应"]
    ],
    systemOnline: "系统在线",
    node: "主控节点 01",
    signalTitle: "智能体链路",
    signals: [
      ["Qwen 推理核心", "在线"],
      ["CrewAI 协同编排", "同步"],
      ["ECOMATS 知识引擎", "就绪"]
    ],
    workflow: "协同工作流",
    active: "运行中",
    standby: "待命",
    telemetry: "实时调度 / 路径追踪 / 结果回传"
  },
  en: {
    switchHref: "/zh",
    switchLabel: "中文",
    eyebrow: "NANJING UNIVERSITY · ENVIRONMENTAL MATERIALS INTELLIGENCE",
    title: "Multi-Agent System for Catalytic Water-Treatment Materials Design",
    brand: "(NJU-ECOMATS)",
    description:
      "Powered by Qwen + CrewAI, the system coordinates requirement analysis, materials design, expert evaluation, mechanism mining, synthesis guidance, and operating optimization through a traceable and explainable workflow.",
    capabilities: ["Orchestration", "Material Design", "Evaluation", "Mechanism", "Synthesis", "Optimization"],
    metrics: [
      ["05", "Cooperating Agents"],
      ["08", "Workflow Nodes"],
      ["24/7", "System Response"]
    ],
    systemOnline: "SYSTEM ONLINE",
    node: "CONTROL NODE 01",
    signalTitle: "AGENT LINKS",
    signals: [
      ["Qwen Reasoning Core", "ONLINE"],
      ["CrewAI Orchestration", "SYNCED"],
      ["ECOMATS Knowledge Engine", "READY"]
    ],
    workflow: "COORDINATION FLOW",
    active: "RUNNING",
    standby: "STANDBY",
    telemetry: "LIVE DISPATCH / PATH TRACE / RESULT STREAM"
  }
} as const;

export default function HeroConsole({ locale, active = false }: HeroConsoleProps) {
  const content = copy[locale];

  return (
    <div className="tech-hero-wrap">
      <div className="tech-grid" aria-hidden="true" />
      <div className="tech-scan" aria-hidden="true" />
      <span className="tech-particle tech-particle-a" aria-hidden="true" />
      <span className="tech-particle tech-particle-b" aria-hidden="true" />
      <span className="tech-particle tech-particle-c" aria-hidden="true" />

      <section className="tech-hero" aria-labelledby="platform-title">
        <div className="tech-nav">
          <div className="tech-brandline">
            <span className="tech-brand-mark" aria-hidden="true" />
            <span>NJU · ECOMATS RESEARCH PLATFORM</span>
          </div>
          <Link href={content.switchHref} className="language-switch">
            {content.switchLabel}
          </Link>
        </div>

        <div className="tech-hero-grid">
          <div className="tech-copy">
            <p className="tech-eyebrow">{content.eyebrow}</p>
            <h1 id="platform-title" className="tech-title">
              <span>{content.title}</span>
              <span className="tech-title-brand">{content.brand}</span>
            </h1>
            <p className="tech-description">{content.description}</p>

            <div className="tech-capabilities" aria-label={locale === "zh" ? "系统能力" : "System capabilities"}>
              {content.capabilities.map((item, index) => (
                <span key={item} className="tech-capability">
                  <i style={{ animationDelay: `${index * 180}ms` }} aria-hidden="true" />
                  {item}
                </span>
              ))}
            </div>

            <div className="tech-metrics">
              {content.metrics.map(([value, label]) => (
                <div key={label} className="tech-metric">
                  <strong>{value}</strong>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="system-console">
            <span className="console-corner console-corner-tl" aria-hidden="true" />
            <span className="console-corner console-corner-tr" aria-hidden="true" />
            <span className="console-corner console-corner-bl" aria-hidden="true" />
            <span className="console-corner console-corner-br" aria-hidden="true" />
            <div className="console-sweep" aria-hidden="true" />

            <header className="console-header">
              <span className="console-online">
                <i aria-hidden="true" />
                {content.systemOnline}
              </span>
              <span>{content.node}</span>
            </header>

            <div className="console-core" aria-hidden="true">
              <span className="core-ring core-ring-outer" />
              <span className="core-ring core-ring-inner" />
              <span className="core-axis core-axis-x" />
              <span className="core-axis core-axis-y" />
              <span className="core-node">AI</span>
              <span className="core-pulse core-pulse-a" />
              <span className="core-pulse core-pulse-b" />
              <span className="core-pulse core-pulse-c" />
            </div>

            <div className="signal-title">
              <span>{content.signalTitle}</span>
              <span>03 / 03</span>
            </div>
            <div className="signal-list">
              {content.signals.map(([label, status], index) => (
                <div className="signal-row" key={label}>
                  <span className="signal-index">0{index + 1}</span>
                  <span className="signal-label">{label}</span>
                  <span className="signal-status">
                    <i aria-hidden="true" />
                    {status}
                  </span>
                </div>
              ))}
            </div>

            <div className={`workflow-signal ${active ? "is-active" : ""}`}>
              <div className="workflow-signal-head">
                <span>{content.workflow}</span>
                <span>{active ? content.active : content.standby}</span>
              </div>
              <div className="workflow-track" aria-hidden="true">
                <span />
              </div>
              <div className="workflow-nodes" aria-hidden="true">
                {Array.from({ length: 6 }).map((_, index) => (
                  <i key={index} style={{ animationDelay: `${index * 220}ms` }} />
                ))}
              </div>
            </div>

            <footer className="console-footer">
              <span>{content.telemetry}</span>
              <span className="console-clock">QWEN / CREWAI</span>
            </footer>
          </div>
        </div>
      </section>
    </div>
  );
}
