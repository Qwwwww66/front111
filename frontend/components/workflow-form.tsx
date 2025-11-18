'use client';

import { useEffect, useState } from "react";
import clsx from "clsx";
import {
  createWorkflow,
  type WorkflowDetail,
  type WorkflowMode
} from "@/lib/api";

const modes: {
  value: WorkflowMode;
  label: string;
  description: string;
}[] = [
  {
    value: "preset",
    label: "预设流程",
    description: "按顺序进行完整流程，生成完整解决方案。"
  },
  {
    value: "autonomous",
    label: "自主调度",
    description: "根据需求动态分配任务，更灵活高效。"
  }
];

interface WorkflowFormProps {
  isCompact: boolean;
  activeWorkflowId?: string | null;
  onExpand?: () => void;
  onCollapse?: () => void;
  onWorkflowLaunched?: (workflow: WorkflowDetail) => void;
  clearSignal?: number;
}

export default function WorkflowForm({
  isCompact,
  activeWorkflowId,
  onExpand,
  onCollapse,
  onWorkflowLaunched,
  clearSignal = 0
}: WorkflowFormProps) {
  const [requirement, setRequirement] = useState("");
  const [mode, setMode] = useState<WorkflowMode>("preset");
  const [state, setState] = useState<{
    type: "idle" | "loading" | "success" | "error";
    message?: string;
  }>({ type: "idle" });

  useEffect(() => {
    if (!clearSignal) return;
    setRequirement("");
    setState({ type: "idle" });
  }, [clearSignal]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const combinedRequirement = requirement.trim();

    if (!combinedRequirement) {
      setState({ type: "error", message: "请先填写材料设计需求。" });
      return;
    }

    try {
      setState({ type: "loading" });
      const workflow = await createWorkflow({
        requirement: combinedRequirement,
        mode
      });
      setState({
        type: "success",
        message: `工作流 ${workflow.id} 已点燃，跑道即将收缩。`
      });
      onWorkflowLaunched?.(workflow);
    } catch (error) {
      setState({
        type: "error",
        message:
          error instanceof Error ? error.message : "任务创建失败，请稍后再试。"
      });
    }
  };

  const bodyClass = clsx(
    "mt-8 space-y-6 transition-[opacity,transform,max-height] duration-500",
    isCompact
      ? "max-h-0 -translate-y-8 opacity-0 pointer-events-none"
      : "max-h-[120rem] translate-y-0 opacity-100"
  );

  return (
    <form
      onSubmit={handleSubmit}
      className={clsx(
        "relative flex w-full flex-col overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-[#11163e]/90 via-[#070a1f]/90 to-[#020308]/95 text-white shadow-[0_30px_80px_rgba(3,4,16,0.55)] transition-all duration-500",
        isCompact
          ? "scale-95 px-5 py-6 opacity-90"
          : "px-8 py-9 sm:px-10 sm:py-12"
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
      >
        <div className="absolute -left-32 top-10 h-72 w-72 rounded-full bg-[#7c6cff]/30 blur-[120px]" />
        <div className="absolute -bottom-10 right-0 h-80 w-80 rounded-full bg-[#16f1ff]/10 blur-[120px]" />
      </div>

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.6em] text-white/40">
            LLM INPUT DOCK
          </p>
          <h2 className="mt-4 text-2xl font-semibold leading-tight text-white">
            提交新任务
          </h2>
          <p className="mt-2 text-sm text-white/70">
            填写材料设计需求，选择智能体运行模式，生成优化的材料设计方案。
          </p>
        </div>

        <div className="flex flex-col items-end gap-2 text-xs text-white/60">
          <span className="rounded-full border border-white/15 px-3 py-1">
            {mode === "preset" ? "预设流程" : "自主调度"}
          </span>
          {activeWorkflowId ? (
            <span className="text-[11px] text-emerald-300/80">
              运行中 · #{activeWorkflowId}
            </span>
          ) : (
            <span className="text-[11px] text-white/40">等待点火命令</span>
          )}
        </div>
      </div>

      <div className={bodyClass}>
        <label className="block text-sm font-medium text-white/80">
          材料设计需求
          <textarea
            value={requirement}
            onChange={(event) => setRequirement(event.target.value)}
            placeholder="例如：兼顾低温运行、抑藻、低能耗的催化材料设计要求..."
            className="mt-3 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/90 outline-none transition placeholder:text-white/30 focus:border-[#7c6cff]/70 focus:bg-white/10"
            rows={5}
          />
        </label>

        <div className="space-y-3">
          <span className="text-sm font-medium text-white/80">运行模式</span>
          <div className="grid gap-3 lg:grid-cols-2">
            {modes.map((item) => (
              <label
                key={item.value}
                className={clsx(
                  "relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-white/10 p-4 text-sm transition",
                  mode === item.value
                    ? "bg-gradient-to-r from-[#7c6cff]/30 to-[#16f1ff]/10 text-white shadow-[0_10px_30px_rgba(14,20,55,0.35)]"
                    : "bg-white/5 text-white/70 hover:border-white/30"
                )}
              >
                <input
                  type="radio"
                  name="mode"
                  value={item.value}
                  checked={mode === item.value}
                  onChange={() => setMode(item.value)}
                  className="hidden"
                />
                <span className="font-semibold">{item.label}</span>
                <span className="mt-1 text-xs text-white/60">
                  {item.description}
                </span>
              </label>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={state.type === "loading"}
          className="group w-full rounded-2xl bg-gradient-to-r from-[#7c6cff] via-[#5b72ff] to-[#16f1ff] px-5 py-3 text-sm font-semibold text-white shadow-[0_15px_35px_rgba(25,30,65,0.55)] transition hover:shadow-[0_25px_45px_rgba(25,30,65,0.65)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {state.type === "loading" ? "正在提交..." : "点燃多智能体"}
        </button>
      </div>

      {isCompact && (
        <div className="relative mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
          <p>输入舱已自动缩小，任务进度见 Agent Runway。</p>
          {onExpand && (
            <button
              type="button"
              onClick={onExpand}
              className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-1.5 text-xs font-semibold text-white hover:bg-white/10"
            >
              展开输入
            </button>
          )}
        </div>
      )}

      {!isCompact && activeWorkflowId && onCollapse && (
        <button
          type="button"
          onClick={onCollapse}
          className="mt-4 text-right text-xs text-white/60 underline-offset-4 hover:text-white"
        >
          折叠输入
        </button>
      )}

      {state.type !== "idle" && (
        <p
          className={clsx(
            "relative mt-4 text-xs font-medium",
            state.type === "success" ? "text-emerald-300" : "text-rose-300"
          )}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}

