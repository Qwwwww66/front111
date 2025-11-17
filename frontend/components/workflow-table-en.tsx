// encoding: utf-8
'use client';

import clsx from "clsx";
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import {
  fetchWorkflowDetail,
  fetchWorkflowResult,
  fetchWorkflows,
  type WorkflowDetail
} from "@/lib/api";

interface WorkflowTableProps {
  focusedWorkflowId?: string | null;
  onWorkflowIdle?: (workflow?: WorkflowDetail | null) => void;
}

type Stage = {
  id: string;
  label: string;
  description?: string;
  progress: number;
};

type WorkflowDisplayState = {
  stages: Stage[];
  activeStageId?: string | null;
};

type TimelineStage = Stage & {
  isActive: boolean;
  isDone: boolean;
  isHistory: boolean;
};

type RunwayVariant = "history" | "active" | "upcoming";
type RunwayCardData = { key: string; variant: RunwayVariant; stage: TimelineStage };

type ResultLayerState = {
  open: boolean;
  status: "idle" | "loading" | "error";
  workflow?: WorkflowDetail | null;
  generated?: { path: string; content: string } | null;
  error?: string | null;
};

const stageOrder = [
  "Creative_Designing_agent",
  "Assessment_Screening_agent_A",
  "Assessment_Screening_agent_B",
  "Assessment_Screening_agent_C",
  "Assessment_Screening_agent_Overall",
  "Synthesis_Guiding_agent",
  "Mechanism_Mining_agent",
  "Operation_Suggesting_agent"
] as const;
type StageKey = (typeof stageOrder)[number];

const agentLookup: Record<StageKey, { label: string; description?: string }> = {
  Creative_Designing_agent: {
    label: "Creative Designer",
    description: "Generate material/biological co-design based on water parameters and needs"
  },
  Assessment_Screening_agent_A: {
    label: "Expert A Review",
    description: "Focus on safety and toxicology constraints"
  },
  Assessment_Screening_agent_B: {
    label: "Expert B Review",
    description: "Evaluate material performance and stability"
  },
  Assessment_Screening_agent_C: {
    label: "Expert C Review",
    description: "Assess process compatibility and environment fit"
  },
  Assessment_Screening_agent_Overall: {
    label: "Overall Review",
    description: "Fuse opinions from all experts"
  },
  Synthesis_Guiding_agent: {
    label: "Synthesis Guide",
    description: "Plan material synthesis methods and biological routes"
  },
  Mechanism_Mining_agent: {
    label: "Mechanism Miner",
    description: "Analyze reaction pathways and mechanisms"
  },
  Operation_Suggesting_agent: {
    label: "Ops Suggestion",
    description: "Propose operation, maintenance, and dosing plans"
  }
};

const statusChip: Record<
  WorkflowDetail["status"],
  { label: string; classes: string }
> = {
  queued: { label: "Queued", classes: "bg-white/5 text-white/70 border-white/20" },
  running: { label: "Running", classes: "bg-cyan-400/15 text-cyan-100 border-cyan-300/40" },
  succeeded: {
    label: "Succeeded",
    classes: "bg-emerald-400/10 text-emerald-200 border-emerald-300/30"
  },
  failed: { label: "Failed", classes: "bg-rose-400/10 text-rose-200 border-rose-300/30" }
};

const ACTIVE_PROGRESS_MIN_INCREMENT = 10;
const ACTIVE_PROGRESS_MAX_INCREMENT = 15;
export default function WorkflowTable({
  focusedWorkflowId,
  onWorkflowIdle
}: WorkflowTableProps) {
  const [workflows, setWorkflows] = useState<WorkflowDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [displayMap, setDisplayMap] = useState<Record<string, WorkflowDisplayState>>({});
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [runwayDragging, setRunwayDragging] = useState(false);
  const [resultLayer, setResultLayer] = useState<ResultLayerState>({
    open: false,
    status: "idle"
  });
  const [cardTransition, setCardTransition] = useState<{ enter?: string | null; exit?: string | null } | null>(null);
  const requirementCacheRef = useRef<Record<string, string>>({});
  const rememberRequirement = useCallback((workflow?: WorkflowDetail | null) => {
    if (!workflow?.id) return;
    const cache = requirementCacheRef.current;
    if (!cache[workflow.id] && workflow.requirement) {
      cache[workflow.id] = workflow.requirement;
    }
  }, []);
  const getRequirement = useCallback(
    (workflow?: WorkflowDetail | null) => {
      if (!workflow) return "";
      rememberRequirement(workflow);
      return requirementCacheRef.current[workflow.id] ?? workflow.requirement ?? "";
    },
    [rememberRequirement]
  );

  const notifiedRef = useRef<Set<string>>(new Set());
  const runwayScrollRef = useRef<HTMLDivElement>(null);
  const activeAgentRef = useRef<HTMLDivElement | null>(null);
  const programmaticScrollRef = useRef(false);
  const runwayHoldUntilRef = useRef(0);
  const runwayHoldTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSignatureRef = useRef<string | null>(null);
  const lastCenteredSignatureRef = useRef<string | null>(null);
  const prevActiveIdRef = useRef<string | null>(null);
  const prevWorkflowIdRef = useRef<string | null>(null);
  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const list = await fetchWorkflows();
        if (!cancelled) {
          list.forEach((item) => rememberRequirement(item));
          setWorkflows(list);
          setError(null);
          setLastSyncedAt(Date.now());
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load tasks");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 10000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [rememberRequirement]);

  useEffect(() => {
    const pending = workflows.filter(
      (workflow) =>
        workflow.status === "queued" ||
        workflow.status === "running" ||
        (workflow.status === "succeeded" && !workflow.result_file)
    );

    if (!pending.length) {
      setDisplayMap((prev) => {
        const next = { ...prev };
        workflows.forEach((workflow) => {
          if (workflow.status === "succeeded" && next[workflow.id]) {
            next[workflow.id] = {
              stages: next[workflow.id].stages.map((stage) => ({
                ...stage,
                progress: 100
              })),
              activeStageId: null
            };
          }
        });
        return next;
      });
      setLastSyncedAt(Date.now());
      return;
    }

    let cancelled = false;
    const fetchAgents = async () => {
      const details: Record<string, WorkflowDetail | null> = {};
      await Promise.all(
        pending.map(async (workflow) => {
          try {
            details[workflow.id] = await fetchWorkflowDetail(workflow.id);
          } catch {
            details[workflow.id] = null;
          }
        })
      );
      if (cancelled) return;
      setDisplayMap((prev) => {
        const next = { ...prev };
        pending.forEach((workflow) => {
          const detail = details[workflow.id];
          if (!detail) return;
          rememberRequirement(detail);
          next[workflow.id] = updateDisplayState(detail, prev[workflow.id]);
        });
        return next;
      });
      setLastSyncedAt(Date.now());
    };

    fetchAgents();
    const interval = setInterval(fetchAgents, 6000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [workflows, rememberRequirement]);

  useEffect(() => {
    if (focusedWorkflowId) {
      notifiedRef.current.delete(focusedWorkflowId);
    }
  }, [focusedWorkflowId]);

  useEffect(() => {
    if (!focusedWorkflowId) return;
    const workflow = workflows.find((item) => item.id === focusedWorkflowId);
    if (!workflow) return;
    if (
      (workflow.status === "succeeded" || workflow.status === "failed") &&
      !notifiedRef.current.has(workflow.id)
    ) {
      notifiedRef.current.add(workflow.id);
      onWorkflowIdle?.(workflow);
    }
  }, [focusedWorkflowId, workflows, onWorkflowIdle]);

  const highlightedWorkflow = useMemo(() => {
    if (!workflows.length) return null;
    if (focusedWorkflowId) {
      return workflows.find((item) => item.id === focusedWorkflowId) ?? null;
    }
    return (
      workflows.find(
        (item) => item.status === "running" || item.status === "queued"
      ) ?? workflows[0]
    );
  }, [workflows, focusedWorkflowId]);
  const highlightedWorkflowId = highlightedWorkflow?.id ?? null;
  const timeline = useMemo(() => {
    if (!highlightedWorkflow) return [];
    const display =
      displayMap[highlightedWorkflow.id] ??
      initialDisplayState(highlightedWorkflow.status);
    const wfDone = highlightedWorkflow.status === "succeeded";
    const stages = display.stages ?? [];
    if (!stages.length) return [];
    return stages.map((stage) => {
      const isActive = !wfDone && display.activeStageId === stage.id;
      const isDone = wfDone || (!isActive && stage.progress >= 100);
      return {
        ...stage,
        progress: wfDone ? 100 : stage.progress,
        isActive,
        isDone,
        isHistory: isDone && !isActive
      };
    });
  }, [displayMap, highlightedWorkflow]);

  const completedStages = timeline.reduce(
    (count, stage) => (stage.isDone ? count + 1 : count),
    0
  );

  const stageGroups = useMemo(() => {
    if (!timeline.length) {
      return {
        activeStage: null,
        historyStages: [] as TimelineStage[],
        upcomingStages: [] as TimelineStage[]
      };
    }
    const activeStage = timeline.find((stage) => stage.isActive) ?? null;
    const historyStages = timeline.filter(
      (stage) => stage.isHistory || (stage.isDone && !stage.isActive)
    );
    const upcomingStages = timeline.filter(
      (stage) => !stage.isHistory && !stage.isDone && !stage.isActive
    );
    return { activeStage, historyStages, upcomingStages };
  }, [timeline]);

  const runwayCards = useMemo<RunwayCardData[]>(() => {
    const cards: RunwayCardData[] = [];
    stageGroups.historyStages.forEach((stage, idx) => {
      cards.push({ key: `history-${stage.id}-${idx}`, stage, variant: "history" });
    });
    if (stageGroups.activeStage) {
      cards.push({
        key: `active-${stageGroups.activeStage.id}`,
        stage: stageGroups.activeStage,
        variant: "active"
      });
    }
    stageGroups.upcomingStages.forEach((stage, idx) => {
      cards.push({ key: `upcoming-${stage.id}-${idx}`, stage, variant: "upcoming" });
    });
    return cards;
  }, [stageGroups.activeStage, stageGroups.historyStages, stageGroups.upcomingStages]);

  const hasStageData = runwayCards.length > 0;
  const activeStageId = stageGroups.activeStage?.id ?? null;
  const runwayLayoutSignature = runwayCards.map((c) => `${c.variant}-${c.stage.id}`).join("|");
  const runwayCenterSignature = highlightedWorkflow
    ? `${highlightedWorkflow.id}-${activeStageId ?? "none"}-${runwayLayoutSignature}`
    : null;
  useEffect(() => {
    if (!highlightedWorkflowId) {
      prevWorkflowIdRef.current = null;
      prevActiveIdRef.current = null;
      setCardTransition(null);
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
        transitionTimeoutRef.current = null;
      }
      return;
    }
    if (prevWorkflowIdRef.current !== highlightedWorkflowId) {
      prevWorkflowIdRef.current = highlightedWorkflowId;
      prevActiveIdRef.current = null;
      setCardTransition(null);
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
        transitionTimeoutRef.current = null;
      }
    }
  }, [highlightedWorkflowId]);

  useEffect(() => {
    if (!highlightedWorkflowId) return;
    const current = activeStageId ?? null;
    const previous = prevActiveIdRef.current;
    if (current === previous) return;
    if (!current && !previous) {
      prevActiveIdRef.current = current;
      return;
    }
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
      transitionTimeoutRef.current = null;
    }
    setCardTransition({ enter: current ?? null, exit: previous ?? null });
    prevActiveIdRef.current = current;
    transitionTimeoutRef.current = setTimeout(() => {
      setCardTransition(null);
      transitionTimeoutRef.current = null;
    }, 1500);
  }, [activeStageId, highlightedWorkflowId]);

  const centerRunway = useCallback(
    (behavior: ScrollBehavior = "smooth") => {
      const container = runwayScrollRef.current;
      if (!container) return;
      const releaseProgrammaticScroll = () => {
        if (typeof window !== "undefined" && window.requestAnimationFrame) {
          window.requestAnimationFrame(() => {
            programmaticScrollRef.current = false;
          });
        } else {
          programmaticScrollRef.current = false;
        }
      };
      programmaticScrollRef.current = true;
      const activeNode = activeAgentRef.current;
      if (activeNode) {
        const containerRect = container.getBoundingClientRect();
        const activeRect = activeNode.getBoundingClientRect();
        const offset =
          activeRect.left -
          containerRect.left -
          containerRect.width / 2 +
          activeRect.width / 2;
        const target = container.scrollLeft + offset;
        container.scrollTo({ left: target, behavior });
        releaseProgrammaticScroll();
        return;
      }
      const target = (container.scrollWidth - container.clientWidth) / 2;
      container.scrollTo({ left: target, behavior });
      releaseProgrammaticScroll();
    },
    []
  );

  const releaseRunwayHold = useCallback(() => {
    runwayHoldUntilRef.current = 0;
    if (
      pendingSignatureRef.current &&
      pendingSignatureRef.current !== lastCenteredSignatureRef.current
    ) {
      lastCenteredSignatureRef.current = pendingSignatureRef.current;
      pendingSignatureRef.current = null;
      centerRunway();
    }
  }, [centerRunway]);

  const setRunwayHold = useCallback(
    (duration = 4000) => {
      runwayHoldUntilRef.current = Date.now() + duration;
      if (runwayHoldTimeoutRef.current) {
        clearTimeout(runwayHoldTimeoutRef.current);
      }
      runwayHoldTimeoutRef.current = setTimeout(() => {
        releaseRunwayHold();
      }, duration);
    },
    [releaseRunwayHold]
  );

  const handleRunwayPointerDown = useCallback(() => {
    setRunwayDragging(true);
    setRunwayHold(8000);
  }, [setRunwayHold]);

  const handleRunwayPointerUp = useCallback(() => {
    setRunwayDragging(false);
    setRunwayHold(400);
  }, [setRunwayHold]);

  const handleRunwayScroll = useCallback(() => {
    if (programmaticScrollRef.current) return;
    setRunwayHold(400);
  }, [setRunwayHold]);

  useEffect(() => {
    return () => {
      if (runwayHoldTimeoutRef.current) {
        clearTimeout(runwayHoldTimeoutRef.current);
      }
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    centerRunway("auto");
  }, [centerRunway]);

  useEffect(() => {
    if (!runwayCenterSignature) return;
    if (runwayCenterSignature === lastCenteredSignatureRef.current) return;
    if (Date.now() < runwayHoldUntilRef.current) {
      pendingSignatureRef.current = runwayCenterSignature;
      return;
    }
    pendingSignatureRef.current = null;
    lastCenteredSignatureRef.current = runwayCenterSignature;
    centerRunway();
  }, [centerRunway, runwayCenterSignature]);

  const assignActiveAgentRef = useCallback((node: HTMLDivElement | null) => {
    if (node) activeAgentRef.current = node;
  }, []);
  const handleOpenResults = async (workflow: WorkflowDetail) => {
    setResultLayer({
      open: true,
      status: "loading",
      workflow,
      generated: null,
      error: null
    });
    try {
      const generated = workflow.result_file ? await fetchWorkflowResult(workflow.id) : null;
      setResultLayer({
        open: true,
        status: "idle",
        workflow,
        generated,
        error: null
      });
    } catch (err) {
      setResultLayer((prev) => ({
        ...prev,
        status: "idle",
        error: err instanceof Error ? err.message : "Unable to load result file, please retry later."
      }));
    }
  };

  const closeResultLayer = () =>
    setResultLayer({
      open: false,
      status: "idle",
      workflow: undefined,
      generated: null,
      error: null
    });

  const handleRetry = async () => {
    try {
      setLoading(true);
      const list = await fetchWorkflows();
      setWorkflows(list);
      setError(null);
      setLastSyncedAt(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load tasks");
    } finally {
      setLoading(false);
    }
  };

  const missionQueue = workflows.slice(0, 6);
  return (
    <>
      <RunwayAnimations />
      <div className="relative flex w-full flex-col overflow-hidden rounded-[36px] border border-white/10 bg-white/5 p-8 text-white shadow-[0_30px_80px_rgba(3,4,16,0.45)] backdrop-blur-xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-white/50">AGENT RUNWAY</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Multi-Agent Status</h2>
            <p className="mt-1 text-sm text-white/60">Live monitoring of agent status</p>
          </div>
          <div className="flex flex-col items-end gap-2 text-right">
            <p className="text-xs uppercase tracking-[0.35em] text-white/50">SYNC</p>
            <div className="flex flex-wrap items-center justify-end gap-2 text-xs text-white/60">
              <span>
                {lastSyncedAt ? `Last ${formatSyncTime(lastSyncedAt)}` : "Waiting for first sync"}
              </span>
              <button
                type="button"
                onClick={handleRetry}
                className="inline-flex items-center gap-1 rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white transition hover:border-white/40"
              >
                <span
                  className={clsx(
                    "h-1.5 w-1.5 rounded-full",
                    loading ? "bg-emerald-300 animate-pulse" : "bg-white/60"
                  )}
                />
                Sync now
              </button>
            </div>
            <p className="text-[11px] text-white/40">System auto-refreshes every 10 seconds</p>
          </div>
        </div>

        {error ? (
          <div className="mt-10 rounded-3xl border border-rose-400/30 bg-rose-500/10 p-6 text-sm text-rose-100">
            <p className="font-semibold">Load failed</p>
            <p className="mt-1 text-rose-100/80">{error}</p>
            <button
              type="button"
              onClick={handleRetry}
              className="mt-4 inline-flex items-center justify-center rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/20"
            >
              Retry
            </button>
          </div>
        ) : !workflows.length ? (
          <div className="mt-10 flex min-h-[320px] flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-white/70">
            <p className="text-lg font-semibold text-white">No running tasks</p>
            <p className="mt-2 text-sm">Create a new workflow from the left panel.</p>
          </div>
        ) : (
          <>
            <section className="relative mt-10 min-h-[520px] overflow-hidden rounded-[28px] border border-white/10 bg-slate-900/40 p-6">
              {highlightedWorkflow && (
                <div className="relative z-10">
                  <div className="flex flex-wrap items-start justify-between gap-6">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        {renderStatusBadge(highlightedWorkflow.status)}
                        <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/70">
                          {highlightedWorkflow.mode === "preset" ? "Preset flow" : "Autonomous"}
                        </span>
                        <span className="text-xs text-white/40">ID: {highlightedWorkflow.id}</span>
                      </div>
                      <h3 className="mt-4 text-2xl font-semibold leading-tight text-white">
                        Material design requirement: {getRequirement(highlightedWorkflow)}
                      </h3>
                      <p className="mt-2 text-sm text-white/60">
                        Created at {formatDateTime(highlightedWorkflow.created_at)} - Updated{" "}
                        {formatTimeAgo(highlightedWorkflow.updated_at)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                      <button
                        type="button"
                        onClick={() => handleOpenResults(highlightedWorkflow)}
                        disabled={
                          highlightedWorkflow.status !== "succeeded" &&
                          !highlightedWorkflow.result_file
                        }
                        className={clsx(
                          "inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold transition",
                          highlightedWorkflow.status === "succeeded" ||
                            highlightedWorkflow.result_file
                            ? "bg-cyan-400/20 text-cyan-100 hover:bg-cyan-400/30"
                            : "cursor-not-allowed bg-white/10 text-white/40"
                        )}
                      >
                        View result
                      </button>
                      {highlightedWorkflow.error && (
                        <p className="max-w-xs text-right text-xs text-rose-200">
                          {highlightedWorkflow.error}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-8">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-white/50">
                      <span>Agent Runway</span>
                      <span>
                        {completedStages}/{runwayCards.length || stageOrder.length} nodes completed
                      </span>
                    </div>
                    <div className="relative mt-4 overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-b from-slate-900/70 to-slate-950/80">
                      <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />
                      <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-slate-950 via-slate-950/80 to-transparent" />
                      <div
                        ref={runwayScrollRef}
                        className={clsx(
                          "relative flex items-stretch gap-6 overflow-x-auto px-[40vw] py-10",
                          runwayDragging ? "cursor-grabbing" : "cursor-grab"
                        )}
                        style={{ touchAction: "pan-x" }}
                        onPointerDown={handleRunwayPointerDown}
                        onPointerUp={handleRunwayPointerUp}
                        onPointerLeave={handleRunwayPointerUp}
                        onPointerCancel={handleRunwayPointerUp}
                        onScroll={handleRunwayScroll}
                      >
                        <div className="shrink-0 basis-[35vw]" aria-hidden />
                        {hasStageData ? (
                          runwayCards.map((card) => (
                            <RunwayCard
                              key={card.key}
                              stage={card.stage}
                              variant={card.variant}
                              assignActiveRef={
                                card.variant === "active" ? assignActiveAgentRef : undefined
                              }
                              enteringId={cardTransition?.enter ?? null}
                              exitingId={cardTransition?.exit ?? null}
                            />
                          ))
                        ) : (
                          <div className="w-72 shrink-0 rounded-[28px] border border-white/10 bg-white/5 px-6 py-8 text-center text-white/60">
                            Waiting for agent status...
                          </div>
                        )}
                        <div className="shrink-0 basis-[35vw]" aria-hidden />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {highlightedWorkflow?.status === "succeeded" && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-slate-950/70 px-8 text-center text-white backdrop-blur">
                  <p className="text-sm text-white/80">Runway finished. View the generated content.</p>
                  <button
                    type="button"
                    onClick={() => highlightedWorkflow && handleOpenResults(highlightedWorkflow)}
                    className="inline-flex items-center justify-center rounded-full bg-white/10 px-6 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
                  >
                    View generated content
                  </button>
                </div>
              )}
            </section>
            <section className="mt-8 rounded-[28px] border border-white/10 bg-white/5 p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-white/50">
                    MISSION QUEUE
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-white">Agent run list</h3>
                </div>
                <span className="text-sm text-white/60">
                  {workflows.length} tasks - showing first {missionQueue.length}
                </span>
              </div>
              <div className="mt-6 divide-y divide-white/5">
                {missionQueue.map((workflow) => (
                  <div
                    key={workflow.id}
                    className={clsx(
                      "flex flex-wrap items-center gap-6 py-4",
                      focusedWorkflowId === workflow.id && "bg-white/5"
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {renderStatusBadge(workflow.status, "text-[10px]")}
                        <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs text-white/70">
                          {workflow.mode === "preset" ? "Preset" : "Autonomous"}
                        </span>
                        <span className="text-xs text-white/40">#{workflow.id.slice(0, 6)}</span>
                        {focusedWorkflowId === workflow.id && (
                          <span className="text-xs text-cyan-200">Focused</span>
                        )}
                      </div>
                      <p className="mt-2 text-sm font-medium text-white">
                        Material design requirement: {getRequirement(workflow)}
                      </p>
                      {workflow.logs?.length ? (
                        <p className="mt-1 text-xs text-white/60">
                          Latest log: {workflow.logs[workflow.logs.length - 1]}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-col items-end gap-2 text-right">
                      <p className="text-xs text-white/40">Updated {formatTimeAgo(workflow.updated_at)}</p>
                      <button
                        type="button"
                        onClick={() => handleOpenResults(workflow)}
                        disabled={workflow.status !== "succeeded" && !workflow.result_file}
                        className={clsx(
                          "inline-flex items-center justify-center rounded-full px-4 py-1.5 text-xs font-semibold transition",
                          workflow.status === "succeeded" || workflow.result_file
                            ? "bg-cyan-400/20 text-cyan-100 hover:bg-cyan-400/30"
                            : "cursor-not-allowed bg-white/10 text-white/40"
                        )}
                      >
                        View
                      </button>
                      {workflow.error && (
                        <p className="text-xs text-rose-300">{workflow.error}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {workflows.length > missionQueue.length && (
                <p className="pt-4 text-right text-xs text-white/50">
                  {workflows.length - missionQueue.length} more tasks remain queued in background
                </p>
              )}
            </section>
          </>
        )}
      </div>

      {resultLayer.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur"
            role="button"
            aria-label="Close"
            tabIndex={-1}
            onClick={closeResultLayer}
          />
          <div className="relative z-10 w-full max-w-6xl rounded-[32px] border border-white/10 bg-slate-950/95 p-10 text-white shadow-[0_40px_120px_rgba(0,0,0,0.75)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.4em] text-white/50">RESULT LAYER</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">
                  Material design requirement:
                  {getRequirement(resultLayer.workflow) || "Result details"}
                </h3>
                {resultLayer.workflow && (
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-white/60">
                    {renderStatusBadge(resultLayer.workflow.status)}
                    <span className="rounded-full border border-white/10 px-3 py-1">
                      {resultLayer.workflow.mode === "preset" ? "Preset" : "Autonomous"}
                    </span>
                    <span>ID: {resultLayer.workflow.id}</span>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={closeResultLayer}
                className="inline-flex items-center justify-center rounded-full border border-white/20 px-4 py-1.5 text-sm text-white/70 transition hover:border-white/40 hover:text-white"
              >
                Close
              </button>
            </div>

            {resultLayer.status === "loading" && (
              <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                Aggregating results, please wait...
              </div>
            )}

            {resultLayer.error && (
              <div className="mt-6 rounded-2xl border border-rose-400/40 bg-rose-500/10 p-4 text-sm text-rose-100">
                {resultLayer.error}
              </div>
            )}

            <div className="mt-6">
              <article className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <header className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-white">Agent output file</p>
                    <p className="text-xs text-white/50">
                      {resultLayer.generated?.path ?? "No file available"}
                    </p>
                  </div>
                </header>
                <div className="mt-3 max-h-[24rem] overflow-y-auto rounded-xl bg-black/30 p-3 text-xs leading-relaxed text-white/80">
                  {resultLayer.generated?.content ? (
                    <pre className="whitespace-pre-wrap break-words">
                      {resultLayer.generated.content}
                    </pre>
                  ) : (
                    <p className="text-white/40">No result file generated yet.</p>
                  )}
                </div>
              </article>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
function RunwayAnimations() {
  return (
    <style jsx global>{`
      @keyframes runway-spin-slow {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      .animate-spin-slow { animation: runway-spin-slow 1.8s linear infinite; }
      @keyframes runway-slide-left {
        0% { opacity: 1; transform: translateX(0) scale(1); }
        100% { opacity: 0.65; transform: translateX(-32px) scale(0.96); }
      }
      @keyframes runway-pop-in {
        0% { opacity: 0; transform: translateY(20px) scale(0.85); }
        60% { opacity: 1; transform: translateY(-4px) scale(1.05); }
        100% { opacity: 1; transform: translateY(0) scale(1); }
      }
      .runway-card-exit { animation: runway-slide-left 1.5s ease forwards; }
      .runway-card-enter { animation: runway-pop-in 1.5s ease; }
    `}</style>
  );
}

interface RunwayCardProps {
  stage: TimelineStage;
  variant: RunwayVariant;
  assignActiveRef?: (node: HTMLDivElement | null) => void;
  enteringId?: string | null;
  exitingId?: string | null;
}

const CircularProgress = ({ value, running, size = 48, stroke = 4 }: {
  value: number;
  running: boolean;
  size?: number;
  stroke?: number;
}) => {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(Math.max(value, 0), 100);
  const isComplete = clamped >= 100 || !running;
  return (
    <div className={clsx("relative flex items-center justify-center", running && "animate-spin-slow")} style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="currentColor" strokeWidth={stroke} className="text-white/10" fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#runway-progress)"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={isComplete ? 0 : circumference * 0.35}
          strokeLinecap="round"
          fill="none"
          className={clsx(isComplete ? "text-emerald-300" : "text-cyan-300")}
          style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
        />
        <defs>
          <linearGradient id="runway-progress" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
        </defs>
      </svg>
      <span className="absolute text-[11px] font-semibold text-white">{isComplete ? "OK" : ""}</span>
    </div>
  );
};

const RunwayCard = memo(
  function RunwayCardComponent({ stage, variant, assignActiveRef, enteringId, exitingId }: RunwayCardProps) {
    const baseClasses = "relative w-64 shrink-0 snap-center rounded-[28px] border px-6 py-6 transition-all duration-500 ease-out";
    const variantClasses: Record<RunwayVariant, string> = {
      history: "border-white/5 bg-white/5 text-white/60 opacity-60 -translate-x-6 backdrop-blur-sm",
      active: "border-cyan-300/80 bg-gradient-to-b from-cyan-500/25 via-cyan-500/10 to-slate-950/80 text-white shadow-[0_25px_65px_rgba(34,211,238,0.35)] scale-105 z-10",
      upcoming: "border-white/10 bg-slate-900/50 text-white/70 translate-x-6 opacity-80"
    };
    const statusLabel = variant === "history" ? "Done" : variant === "active" ? "In progress" : "Queued";
    const isEntering = enteringId && enteringId === stage.id && variant === "active";
    const isExiting = exitingId && exitingId === stage.id && variant === "history";
    return (
      <div
        ref={variant === "active" ? assignActiveRef : undefined}
        className={clsx(baseClasses, variantClasses[variant], isEntering && "runway-card-enter", isExiting && "runway-card-exit")}
      >
        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.35em] text-white/50">
          <span>{statusLabel}</span>
          <CircularProgress value={stage.progress} running={variant === "active"} />
        </div>
        <h4 className="mt-4 text-xl font-semibold text-white">{stage.label}</h4>
        <p className="mt-2 text-sm text-white/60">{stage.description ?? "Agent stage"}</p>
        <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className={clsx(
              "h-full rounded-full",
              variant === "history"
                ? "bg-emerald-300/60"
                : variant === "active"
                  ? "bg-gradient-to-r from-cyan-300 to-emerald-300"
                  : "bg-white/20"
            )}
            style={{ width: `${Math.min(stage.progress, 100)}%`, transition: "width 1s ease" }}
          />
        </div>
        {variant === "active" && <p className="mt-3 text-xs text-cyan-100">Agent is executing this stage</p>}
        {variant === "history" && <p className="mt-3 text-xs text-white/50">Stage done, waiting archive</p>}
        {variant === "upcoming" && <p className="mt-3 text-xs text-white/50">Queued, will run automatically</p>}
      </div>
    );
  },
  (prev, next) =>
    prev.variant === next.variant &&
    prev.assignActiveRef === next.assignActiveRef &&
    prev.stage.id === next.stage.id &&
    prev.stage.label === next.stage.label &&
    prev.stage.description === next.stage.description &&
    prev.stage.progress === next.stage.progress &&
    prev.enteringId === next.enteringId &&
    prev.exitingId === next.exitingId
);

function renderStatusBadge(
  status: WorkflowDetail["status"],
  extraClasses?: string
) {
  const chip = statusChip[status];
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]",
        chip.classes,
        extraClasses
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {chip.label}
    </span>
  );
}

function formatDateTime(value?: string) {
  if (!value) return "Unknown time";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-US", { hour12: false });
}

function formatTimeAgo(value?: string) {
  if (!value) return "unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const diff = Date.now() - date.getTime();
  if (diff < 60_000) return "just now";
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString("en-US");
}

function formatSyncTime(timestamp?: number | null) {
  if (!timestamp) return "Not fetched yet";
  return formatTimeAgo(new Date(timestamp).toISOString());
}

function initialDisplayState(
  status: WorkflowDetail["status"]
): WorkflowDisplayState {
  return { stages: [], activeStageId: status === "succeeded" ? null : undefined };
}

function updateDisplayState(
  detail: WorkflowDetail,
  prev?: WorkflowDisplayState
): WorkflowDisplayState {
  const stageHistory = detail.stage_history ?? [];
  const finished = detail.status === "succeeded" || detail.status === "failed";
  const previousMap = new Map((prev?.stages ?? []).map((stage) => [stage.id, stage]));

  let resolvedActiveId = finished
    ? null
    : detail.current_agent ?? prev?.activeStageId ?? null;

  const lastHistoryId = stageHistory.length ? stageHistory[stageHistory.length - 1] : null;
  if (!resolvedActiveId && !finished && lastHistoryId) {
    resolvedActiveId = lastHistoryId;
  }

  const resolveMeta = (id: string) => {
    const previous = previousMap.get(id);
    const meta = agentLookup[id as StageKey];
    return {
      label: previous?.label ?? meta?.label ?? id,
      description: previous?.description ?? meta?.description
    };
  };

  const completedOrder: string[] = [];
  const seenCompleted = new Set<string>();
  const lastActiveIndex =
    resolvedActiveId && stageHistory.length
      ? stageHistory.lastIndexOf(resolvedActiveId)
      : -1;

  stageHistory.forEach((id, idx) => {
    if (!id) return;
    const isActiveEntry =
      !finished && resolvedActiveId && id === resolvedActiveId && idx === lastActiveIndex;
    if (isActiveEntry) return;
    if (!seenCompleted.has(id)) {
      seenCompleted.add(id);
      completedOrder.push(id);
    }
  });

  const stages: Stage[] = completedOrder.map((id) => {
    const meta = resolveMeta(id);
    previousMap.delete(id);
    return { id, label: meta.label, description: meta.description, progress: 100 };
  });

  if (!finished && resolvedActiveId && !completedOrder.includes(resolvedActiveId)) {
    const meta = resolveMeta(resolvedActiveId);
    const previous = previousMap.get(resolvedActiveId);
    stages.push({
      id: resolvedActiveId,
      label: meta.label,
      description: meta.description,
      progress: computeActiveProgress(previous?.progress)
    });
    previousMap.delete(resolvedActiveId);
  }

  previousMap.forEach((stage) => {
    stages.push(stage);
  });

  return {
    stages,
    activeStageId: finished ? null : resolvedActiveId
  };
}

function computeActiveProgress(previous?: number): number {
  const base = Math.max(previous ?? 0, 0);
  if (base >= 100) return 100;
  if (base >= 80) {
    const remaining = 100 - base;
    const increment = Math.max(remaining * 0.4, 1);
    const next = Math.min(100, base + increment);
    return Number(next.toFixed(1));
  }
  const increment =
    ACTIVE_PROGRESS_MIN_INCREMENT +
    Math.random() * (ACTIVE_PROGRESS_MAX_INCREMENT - ACTIVE_PROGRESS_MIN_INCREMENT);
  const next = Math.min(80, base + increment);
  return Number(next.toFixed(1));
}


