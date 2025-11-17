import Link from "next/link";
import ResultViewer from "@/components/result-viewer";
import { fetchWorkflowDetail } from "@/lib/api";

interface PageProps {
  params: { id: string };
}

export default async function WorkflowDetailPage({ params }: PageProps) {
  let detail;
  try {
    detail = await fetchWorkflowDetail(params.id);
  } catch (error) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
          <p className="text-sm text-rose-700">
            无法获取任务：{error instanceof Error ? error.message : "未知错误"}。
          </p>
          <Link
            href="/"
            className="mt-4 inline-block text-sm font-semibold text-primary-600 underline"
          >
            返回首页
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-10">
      <Link
        href="/"
        className="text-sm font-semibold text-primary-600 hover:underline"
      >
        ← 返回任务列表
      </Link>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">
          任务 {detail.id}
        </h1>
        <p className="mt-3 text-sm text-slate-500">{detail.requirement}</p>
        <dl className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <dt className="text-xs text-slate-500">模式</dt>
            <dd className="text-sm font-semibold text-slate-900">
              {detail.mode === "preset" ? "预设流程" : "自主调度"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">状态</dt>
            <dd className="text-sm font-semibold text-slate-900">
              {detail.status}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">创建时间</dt>
            <dd className="text-sm text-slate-700">
              {new Date(detail.created_at).toLocaleString("zh-CN")}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">更新时间</dt>
            <dd className="text-sm text-slate-700">
              {new Date(detail.updated_at).toLocaleString("zh-CN")}
            </dd>
          </div>
        </dl>

        {detail.error && (
          <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
            错误：{detail.error}
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">结果文件</h2>
        <div className="mt-4 space-y-6">
          <ResultViewer
            runId={detail.id}
            resultFile={detail.result_file}
            title="材料设计"
          />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">运行日志</h2>
        {detail.logs.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">暂无日志。</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {detail.logs.map((log, index) => (
              <li
                key={index}
                className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700"
              >
                {log}
              </li>
            ))}
          </ul>
        )}
      </section>

    </main>
  );
}
