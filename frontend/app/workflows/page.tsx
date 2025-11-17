import WorkflowTable from "@/components/workflow-table";

export default function WorkflowsPage() {
  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-10">
      <h1 className="text-3xl font-semibold text-slate-900">任务列表</h1>
      <p className="text-sm text-slate-500">
        实时查看所有 Crew 任务的状态与日志。
      </p>
      <WorkflowTable />
    </main>
  );
}

