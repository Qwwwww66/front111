'use client';

import { useEffect, useState } from "react";
import clsx from "clsx";
import {
  createWorkflow,
  type WorkflowDetail,
  type WorkflowMode
} from "@/lib/api";

const modes: { value: WorkflowMode; label: string; description: string }[] = [
  {
    value: "preset",
    label: "Preset flow",
    description: "Run the full pipeline in order to produce a complete solution."
  },
  {
    value: "autonomous",
    label: "Autonomous",
    description: "Assign tasks dynamically based on needs for flexibility and efficiency."
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

export default function WorkflowFormEn({
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
      setState({ type: "error", message: "Please enter the material design requirement first." });
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
        message: `Workflow #${workflow.id} ignited. Runway is shrinking...`
      });
      onWorkflowLaunched?.(workflow);
    } catch (error) {
      setState({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to create task, please retry."
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
        "workflow-form-panel relative flex w-full flex-col overflow-hidden rounded-[10px] border text-white transition-all duration-500",
        isCompact ? "px-5 py-6 opacity-90" : "px-7 py-8 sm:px-10 sm:py-10"
      )}
    >
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-[13px] uppercase tracking-normal text-cyan-100/55">LLM INPUT DOCK</p>
          <h2 className="mt-4 text-[30px] font-semibold leading-tight text-white">
            Submit New Mission
          </h2>
          <p className="mt-2 text-[15px] leading-7 text-white/70">
            Fill in the material design requirement, choose how agents run, and generate an optimized plan.
          </p>
        </div>

        <div className="flex flex-col items-end gap-2 text-[13px] text-white/65">
          <span className="rounded-md border border-cyan-100/20 bg-cyan-300/5 px-3 py-1.5">
            {mode === "preset" ? "Preset flow" : "Autonomous"}
          </span>
          {activeWorkflowId ? (
            <span className="text-xs text-emerald-300/80">Running · #{activeWorkflowId}</span>
          ) : (
            <span className="text-xs text-white/45">Awaiting ignition</span>
          )}
        </div>
      </div>

      <div className={bodyClass}>
        <label className="block text-[15px] font-medium text-white/85">
          Material design requirement
          <textarea
            value={requirement}
            onChange={(event) => setRequirement(event.target.value)}
            placeholder="e.g., Catalytic material design balancing low-temp operation, algal suppression, and low energy..."
            className="mt-3 w-full rounded-lg border border-cyan-100/15 bg-[#071122]/85 px-4 py-4 text-[15px] leading-7 text-white/90 outline-none transition placeholder:text-white/35 focus:border-cyan-300/60 focus:bg-[#09182b]"
            rows={5}
          />
        </label>

        <div className="space-y-3">
          <span className="text-[15px] font-medium text-white/85">Run mode</span>
          <div className="grid gap-3 lg:grid-cols-2">
            {modes.map((item) => (
              <label
                key={item.value}
                className={clsx(
                  "relative flex cursor-pointer flex-col overflow-hidden rounded-lg border border-white/10 p-4 text-[15px] transition",
                  mode === item.value
                    ? "border-cyan-300/35 bg-cyan-300/10 text-white shadow-[0_10px_30px_rgba(14,78,96,0.22)]"
                    : "bg-white/[0.035] text-white/70 hover:border-cyan-100/25"
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
                <span className="mt-1 text-[13px] leading-6 text-white/60">{item.description}</span>
              </label>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={state.type === "loading"}
          className="group w-full rounded-lg border border-cyan-200/30 bg-gradient-to-r from-[#087f9b] via-[#0e98ad] to-[#18b993] px-5 py-3.5 text-[15px] font-semibold text-white shadow-[0_14px_32px_rgba(7,112,133,0.28)] transition hover:brightness-110 hover:shadow-[0_18px_38px_rgba(7,142,158,0.34)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {state.type === "loading" ? "Submitting..." : "Ignite agents"}
        </button>
      </div>

      {isCompact && (
        <div className="relative mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
          <p>Input dock auto-shrinks; track progress in the Agent Runway.</p>
          {onExpand && (
            <button
              type="button"
              onClick={onExpand}
              className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-1.5 text-xs font-semibold text-white hover:bg-white/10"
            >
              Expand input
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
          Collapse input
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
