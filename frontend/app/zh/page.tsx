'use client';

import Link from "next/link";
import clsx from "clsx";
import { useState } from "react";
import type { WorkflowDetail } from "@/lib/api";
import WorkflowForm from "@/components/workflow-form";
import WorkflowTable from "@/components/workflow-table";

export default function HomePage() {
  const [activeWorkflowId, setActiveWorkflowId] = useState<string | null>(null);
  const [manualExpand, setManualExpand] = useState(false);
  const [clearSignal, setClearSignal] = useState(0);

  const isFormCompact = Boolean(activeWorkflowId) && !manualExpand;

  const handleWorkflowIdle = (workflow?: WorkflowDetail | null) => {
    if (!workflow) return;
    if (workflow.id === activeWorkflowId) {
      if (workflow.status === "succeeded") {
        setClearSignal((prev) => prev + 1);
      }
      setActiveWorkflowId(null);
      setManualExpand(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#02030c] text-white">
      <div className="relative overflow-hidden">
        <Link
          href="/en"
          className="absolute right-6 top-6 z-30 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-semibold text-white backdrop-blur hover:border-white/40 hover:bg-white/20"
        >
          EN
        </Link>
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(39,97,255,0.25),_transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(12,238,255,0.18),_transparent_60%)]" />
        </div>
        <div className="relative z-10 mx-auto flex max-w-7xl flex-col gap-12 px-6 py-14 lg:px-10">
          <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="space-y-6">
              <p className="text-sm uppercase tracking-[0.45em] text-white/60">
                Water Quality Risk Control Engineering
              </p>
              <h1 className="text-4xl font-semibold leading-tight lg:text-5xl space-y-2">
                <span className="block">
                  {"ECOMATS\u5de5\u4f5c\u53f0"}
                </span>
                <span className="block">
                  {"\u6750\u6599\u8bbe\u8ba1\u591a\u667a\u80fd\u4f53"}
                </span>
              </h1>
              <p className="text-base text-white/70 lg:text-lg">
                通过 Qwen + CrewAi 构建多智能体系统，具有智能体自主调度系统，实现需求分析、材料设计、专家评价、机理挖掘、材料合成与推荐优化，界面友好，数据驱动的智能体工作站。
              </p>
              <div className="flex flex-wrap gap-3 text-[13px] uppercase tracking-widest text-white/60">
                {[
                  "智能调度",
                  "材料设计",
                  "材料评价",
                  "机理挖掘",
                  "合成方法",
                  "推荐优化"
                ].map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/20 px-4 py-1"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-sm">
              <div className="pointer-events-none absolute inset-0 scale-110 bg-[radial-gradient(circle,_rgba(108,144,255,0.35),_transparent_60%)] blur-3xl" />
              <div className="relative overflow-hidden rounded-[48px] border border-white/20 bg-gradient-to-br from-[#0f1633] via-[#090d1e] to-[#05060c] p-8 text-white shadow-[0_35px_80px_rgba(3,5,20,0.65)]">
                <div className="flex items-center justify-between text-xs text-white/50">
                  <span>AGENT SYNC</span>
                  <span>AGENT CONDITION</span>
                </div>
                <div className="mt-6 space-y-4">
                  {[
                    { label: "ECOMATS", status: "\u5df2\u8fde\u63a5", indicator: "bg-emerald-300" },
                    { label: "Flux channel #2", status: "\u672a\u8fde\u63a5", indicator: "bg-rose-400" },
                    { label: "Flux channel #3", status: "\u672a\u8fde\u63a5", indicator: "bg-rose-400" }
                  ].map((channel) => (
                    <div
                      key={channel.label}
                      className="flex h-12 items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white/70 backdrop-blur"
                    >
                      <span>{channel.label}</span>
                      <span className="flex items-center gap-2 text-xs">
                        <span className={clsx("h-2 w-2 rounded-full", channel.indicator)} />
                        {channel.status}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-8 flex flex-col gap-3">
                  <div className="text-xs uppercase tracking-[0.4em] text-white/40">
                    {"WORKFLOW \u8ffd\u8e2a"}
                  </div>
                  <div className="relative h-24 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-[#6f6dff]/10 via-[#0f1c45] to-[#0b0c24] p-4">
                    <div className="absolute -left-10 -top-6 h-20 w-20 rounded-full bg-[#6b8dff]/40 blur-2xl" />
                    <div className="relative flex items-center justify-between text-xs text-white/70">
                      <span>WORKFLOW CONDITION</span>
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 animate-ping rounded-full bg-cyan-300" />
                        {"\u8fd0\u884c\u4e2d"}
                      </span>
                    </div>
                    <div className="relative mt-4 h-1.5 rounded-full bg-white/10">
                      <span className="absolute inset-y-0 left-0 block w-2/3 rounded-full bg-gradient-to-r from-[#7c6cff] to-[#16f1ff]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-8">
            <WorkflowForm
              isCompact={isFormCompact}
              activeWorkflowId={activeWorkflowId}
              onExpand={() => setManualExpand(true)}
              onCollapse={() => setManualExpand(false)}
              clearSignal={clearSignal}
              onWorkflowLaunched={(workflow) => {
                setActiveWorkflowId(workflow.id);
                setManualExpand(false);
              }}
            />
            <WorkflowTable
              focusedWorkflowId={activeWorkflowId}
              onWorkflowIdle={handleWorkflowIdle}
            />
          </section>
        </div>
      </div>
    </main>
  );
}
