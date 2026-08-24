"""工作流运行管理器."""

from __future__ import annotations

import datetime as dt
import os
import sys
import threading
import uuid
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Optional

import dashscope

PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from scripts.main import (  # noqa: E402
    check_environment_variables,
    run_autonomous_workflow,
    run_design_iteration,
)
from src.config.config import Config  # noqa: E402
from src.utils.llm_config import create_llm  # noqa: E402

from .config import settings
from .models import WorkflowCreate, WorkflowDetail, WorkflowMode, WorkflowStatus


@dataclass
class WorkflowRun:
    """内部运行状态."""

    id: str
    requirement: str
    mode: WorkflowMode
    status: WorkflowStatus = WorkflowStatus.QUEUED
    created_at: dt.datetime = field(default_factory=dt.datetime.utcnow)
    updated_at: dt.datetime = field(default_factory=dt.datetime.utcnow)
    logs: List[str] = field(default_factory=list)
    result_file: Optional[str] = None
    error: Optional[str] = None
    current_agent: Optional[str] = None
    stage_history: List[str] = field(default_factory=list)

    def to_detail(self) -> WorkflowDetail:
        return WorkflowDetail(
            id=self.id,
            requirement=self.requirement,
            mode=self.mode,
            status=self.status,
            created_at=self.created_at,
            updated_at=self.updated_at,
            logs=self.logs,
            result_file=self.result_file,
            error=self.error,
            current_agent=self.current_agent,
            stage_history=self.stage_history,
        )


class WorkflowManager:
    """管理后台线程并提供查询接口."""

    def __init__(self) -> None:
        self._runs: Dict[str, WorkflowRun] = {}
        self._lock = threading.Lock()

    def list_runs(self) -> List[WorkflowDetail]:
        with self._lock:
            return [run.to_detail() for run in self._runs.values()]

    def get_run(self, run_id: str) -> Optional[WorkflowDetail]:
        with self._lock:
            run = self._runs.get(run_id)
            return run.to_detail() if run else None

    def start_run(self, payload: WorkflowCreate) -> WorkflowDetail:
        run_id = uuid.uuid4().hex
        run = WorkflowRun(id=run_id, requirement=payload.requirement, mode=payload.mode)
        run.logs.append("工作流已进入队列，等待执行。")

        with self._lock:
            self._runs[run_id] = run

        thread = threading.Thread(target=self._execute_run, args=(run_id,), daemon=True)
        thread.start()
        return run.to_detail()

    def _update_run(self, run_id: str, **kwargs) -> None:
        with self._lock:
            run = self._runs.get(run_id)
            if not run:
                return
            for key, value in kwargs.items():
                setattr(run, key, value)
            run.updated_at = dt.datetime.utcnow()

    def _append_log(self, run_id: str, message: str) -> None:
        with self._lock:
            run = self._runs.get(run_id)
            if not run:
                return
            run.logs.append(message)
            run.updated_at = dt.datetime.utcnow()

    def _execute_run(self, run_id: str) -> None:
        self._update_run(run_id, status=WorkflowStatus.RUNNING)
        start_time = dt.datetime.utcnow()
        self._append_log(run_id, "启动 LLM 与多智能体流程。")

        def progress_callback(agent_name: Optional[str]) -> None:
            if agent_name:
                with self._lock:
                    run = self._runs.get(run_id)
                    if run:
                        run.stage_history.append(agent_name)
                        run.updated_at = dt.datetime.utcnow()
            self._update_run(run_id, current_agent=agent_name)

        try:
            if not check_environment_variables():
                raise RuntimeError("环境变量未正确配置。")

            if not Config.is_api_key_valid(Config.QWEN_API_KEY):
                raise RuntimeError("QWEN_API_KEY 缺失或无效。")

            dashscope.api_key = Config.QWEN_API_KEY
            # Ensure CrewAI's native DashScope provider sees the worker config.
            os.environ["OPENAI_API_KEY"] = Config.QWEN_API_KEY
            os.environ["OPENAI_API_BASE"] = Config.QWEN_API_BASE
            os.environ["DASHSCOPE_API_KEY"] = Config.QWEN_API_KEY
            os.environ["DASHSCOPE_BASE_URL"] = Config.QWEN_API_BASE
            llm = create_llm()

            self._append_log(run_id, f"LLM 创建成功 (key={Config.QWEN_API_KEY[:10]}... model={Config.QWEN_MODEL_NAME} base={Config.QWEN_API_BASE})，开始执行 Crew。")

            run = self._runs[run_id]
            if run.mode == WorkflowMode.PRESET:
                run_design_iteration(
                    run.requirement,
                    llm,
                    progress_callback=progress_callback,
                )
            else:
                run_autonomous_workflow(
                    run.requirement,
                    llm,
                    progress_callback=progress_callback,
                )

            result_path = self._locate_latest_output(start_time)
            relative_path = None
            if result_path:
                result_path = result_path.resolve()
                project_root = PROJECT_ROOT.resolve()
                try:
                    relative_path = str(result_path.relative_to(project_root))
                except ValueError:
                    relative_path = f"outputs/{result_path.name}"

            self._append_log(run_id, "工作流执行完成。")
            self._update_run(
                run_id,
                status=WorkflowStatus.SUCCEEDED,
                result_file=relative_path,
            )
        except Exception as exc:  # noqa: BLE001
            self._append_log(run_id, f"执行失败：{exc}")
            self._update_run(run_id, status=WorkflowStatus.FAILED, error=str(exc))
            self._update_run(run_id, current_agent=None)
        else:
            self._update_run(run_id, current_agent=None)

    def _locate_latest_output(self, start_time: dt.datetime) -> Optional[Path]:
        outputs_dir = settings.workflow_storage.resolve()
        if not outputs_dir.exists():
            return None

        candidates = sorted(
            outputs_dir.glob("workflow_result_*.txt"),
            key=lambda p: p.stat().st_mtime,
            reverse=True,
        )
        for path in candidates:
            modified = dt.datetime.utcfromtimestamp(path.stat().st_mtime)
            if modified >= start_time - dt.timedelta(minutes=5):
                return path.resolve()
        return None


workflow_manager = WorkflowManager()
