'use client';

import { useState } from "react";
import type { WorkflowDetail } from "@/lib/api";
import HeroConsole from "@/components/hero-console";
import WorkflowFormEn from "@/components/workflow-form-en";
import WorkflowTableEn from "@/components/workflow-table-en";

export default function HomePageEn() {
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
    <main className="ecomats-shell">
      <HeroConsole locale="en" active={Boolean(activeWorkflowId)} />
      <section className="workflow-deck">
        <WorkflowFormEn
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
        <WorkflowTableEn
          focusedWorkflowId={activeWorkflowId}
          onWorkflowIdle={handleWorkflowIdle}
        />
      </section>
    </main>
  );
}
