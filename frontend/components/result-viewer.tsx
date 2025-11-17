'use client';

import { useState } from "react";
import { fetchWorkflowResult } from "@/lib/api";

interface ResultViewerProps {
  runId: string;
  resultFile?: string | null;
  title?: string;
}

export default function ResultViewer({
  runId,
  resultFile,
  title = "结果文件"
}: ResultViewerProps) {
  const [content, setContent] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");

  const handleLoad = async () => {
    if (!resultFile) return;
    try {
      setState("loading");
      const result = await fetchWorkflowResult(runId);
      setContent(result.content);
      setState("idle");
    } catch {
      setState("error");
    }
  };

  if (!resultFile) {
    return <p className="text-sm text-slate-500">结果尚未生成。</p>;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          <p className="text-xs text-slate-500">{resultFile}</p>
        </div>
        <button
          onClick={handleLoad}
          disabled={state === "loading"}
          className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700 disabled:bg-slate-400"
        >
          {state === "loading" ? "加载中..." : "查看内容"}
        </button>
      </div>

      {state === "error" && (
        <p className="mt-3 text-xs text-rose-600">读取文件失败，请稍后重试。</p>
      )}

      {content && (
        <pre className="mt-4 max-h-[32rem] min-h-[18rem] overflow-auto rounded-xl bg-slate-950/90 p-6 text-sm text-slate-100">
          {content}
        </pre>
      )}
    </div>
  );
}
