"""FastAPI 入口."""

from __future__ import annotations

from pathlib import Path
from typing import List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .config import PROJECT_ROOT, settings
from .models import WorkflowCreate, WorkflowDetail
from .workflow_runner import workflow_manager

app = FastAPI(
    title="ECOMATS Crew Web API",
    version="0.1.0",
    description="为网页前端提供的多智能体工作流接口。",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check() -> dict:
    """健康检查."""
    return {"status": "ok"}


@app.post(f"{settings.api_prefix}/workflows", response_model=WorkflowDetail)
def create_workflow(payload: WorkflowCreate) -> WorkflowDetail:
    """启动新的工作流."""
    return workflow_manager.start_run(payload)


@app.get(f"{settings.api_prefix}/workflows", response_model=List[WorkflowDetail])
def list_workflows() -> List[WorkflowDetail]:
    """列出所有工作流."""
    return workflow_manager.list_runs()


@app.get(f"{settings.api_prefix}/workflows/{{run_id}}", response_model=WorkflowDetail)
def get_workflow(run_id: str) -> WorkflowDetail:
    """获取单个工作流详情."""
    detail = workflow_manager.get_run(run_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return detail


@app.get(f"{settings.api_prefix}/workflows/{{run_id}}/result")
def get_workflow_result(run_id: str) -> dict:
    """返回结果文件内容."""
    detail = workflow_manager.get_run(run_id)
    if not detail or not detail.result_file:
        raise HTTPException(status_code=404, detail="Result not available")

    file_path = Path(PROJECT_ROOT, detail.result_file)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Result file not found")

    content = file_path.read_text(encoding="utf-8")
    return {"path": detail.result_file, "content": content}

