import Link from "next/link";

type Stage = {
  title: string;
  description: string;
};

const linearStages: Stage[] = [
  {
    title: "水质分析智能体",
    description:
      "解析原水指标、污染物类型与背景离子，对水质风险进行结构化建模，为下游决策提供事实输入。"
  },
  {
    title: "需求调度智能体",
    description:
      "将用户提交的处理目标拆解为生物/材料双路径需求，并动态协调后续智能体的任务边界。"
  }
];

const bioBranch: Stage[] = [
  {
    title: "水清洁生物处理设计智能体",
    description:
      "构思生物药剂、微生物或酶系方案，匹配可行的载体、培养与投加策略。"
  },
  {
    title: "生物设计评估智能体",
    description:
      "从毒理、环境友好和可扩展性角度审查生物方案，指出瓶颈并形成改进建议。"
  },
  {
    title: "水清洁生物机理挖掘智能体",
    description:
      "对生物途径的反应机理、降解路径与副产物控制要求进行深度解析。"
  }
];

const materialBranch: Stage[] = [
  {
    title: "水清洁材料设计智能体",
    description:
      "围绕吸附、催化或协同机制生成材料组合，并约束晶体结构、形貌与可合成性。"
  },
  {
    title: "材料设计评估智能体",
    description:
      "从性能、可靠性与成本评估材料方案，并检核工具调用得到的材料数据。"
  },
  {
    title: "水清洁材料机理挖掘智能体",
    description:
      "分析材料在反应中的电子/活性位点行为，验证动力学瓶颈。"
  },
  {
    title: "材料合成智能体",
    description:
      "输出可实施的合成路线与工艺参数，包含前驱体、温度时间窗口与安全提示。"
  }
];

const finalStage: Stage = {
  title: "运行建议智能体",
  description:
    "综合生物与材料两条路径的输出，形成运行策略、监测指标与迭代建议。"
};

const autonomousStages = [
  {
    title: "水质分析智能体",
    description: "解析实时水质与风险因子，形成需求画像。"
  },
  {
    title: "需求调度智能体",
    description:
      "依据画像动态选择需要调用的子智能体，结合用户偏好与限制条件自适应调度，可能跳过或重复某些阶段以满足定制需求。"
  }
];

export default function ArchitecturePage() {
  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-10">
      <div className="flex items-center gap-3 text-sm text-slate-500">
        <Link href="/" className="hover:underline">
          首页
        </Link>
        <span>→</span>
        <span>架构详情</span>
      </div>
      <header className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-semibold text-slate-900">
          水清洁多智能体架构
        </h1>
        <p className="mt-4 text-sm text-slate-600">
          预设流程覆盖完整的“分析 → 设计 → 评估 → 机理 → 合成/运行”的闭环；自主调度模式则让需求调度
          智能体按需组合生物/材料专家，以便应对场景化任务。
        </p>
      </header>

      <section className="space-y-6 rounded-3xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">预设流程</h2>
        {linearStages.map((stage, index) => (
          <StageRow
            key={stage.title}
            stage={stage}
            showArrow={index !== linearStages.length - 1}
          />
        ))}

        <FlowArrow />

        <StageParallel
          leftLabel="生物路径"
          rightLabel="材料路径"
          leftStages={bioBranch}
          rightStages={materialBranch}
        />

        <FlowArrow />

        <StageRow stage={finalStage} />
      </section>

      <section className="space-y-4 rounded-3xl border border-slate-200 bg-gradient-to-b from-white to-primary-50/30 p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">自主调度模式</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {autonomousStages.map((stage) => (
            <StageCard key={stage.title} stage={stage} />
          ))}
        </div>
        <p className="text-sm text-slate-500">
          当需求调度智能体接管流程时，会根据用户输入动态选择需要调用的生物、材料或机理专家。可能只运行某个独立任务，
          也可能迭代调用多位专家，直到达成目标。
        </p>
      </section>
    </main>
  );
}

function StageRow({
  stage,
  showArrow = false
}: {
  stage: Stage;
  showArrow?: boolean;
}) {
  return (
    <div className="space-y-3">
      <StageCard stage={stage} />
      {showArrow && (
        <FlowArrow />
      )}
    </div>
  );
}

function StageParallel({
  leftLabel,
  rightLabel,
  leftStages,
  rightStages
}: {
  leftLabel: string;
  rightLabel: string;
  leftStages: Stage[];
  rightStages: Stage[];
}) {
  return (
    <div className="rounded-2xl border border-dashed border-primary-200 bg-primary-50/30 p-4">
      <div className="grid gap-4 md:grid-cols-2">
        <StageStack heading={leftLabel} stages={leftStages} />
        <StageStack heading={rightLabel} stages={rightStages} />
      </div>
    </div>
  );
}

function StageStack({ heading, stages }: { heading: string; stages: Stage[] }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-primary-600">
        {heading}
      </p>
      {stages.map((stage, index) => (
        <div key={stage.title} className="space-y-2">
          <StageCard stage={stage} />
          {index !== stages.length - 1 && (
            <div className="flex justify-center text-primary-200">
              <span className="inline-flex items-center gap-1 text-primary-300">
                <span className="h-6 w-0.5 bg-primary-200"></span>
                <span className="text-xs">↓</span>
                <span className="h-6 w-0.5 bg-primary-200"></span>
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function StageCard({ stage }: { stage: Stage }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm">
      <p className="text-base font-semibold text-center text-slate-900">
        {stage.title}
      </p>
      <p className="mt-2 text-xs text-slate-600 text-center">{stage.description}</p>
    </div>
  );
}

function FlowArrow() {
  return (
    <div className="flex justify-center py-2">
      <span className="inline-flex items-center gap-2 text-primary-400">
        <span className="h-10 w-0.5 rounded-full bg-primary-200"></span>
        <span className="text-2xl text-primary-300">⇣</span>
        <span className="h-10 w-0.5 rounded-full bg-primary-200"></span>
      </span>
    </div>
  );
}
