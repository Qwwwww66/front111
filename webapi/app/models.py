"""Pydantic 数据模型."""

from __future__ import annotations

import datetime as dt
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


class WorkflowMode(str, Enum):
    """工作模式."""

    PRESET = "preset"
    AUTONOMOUS = "autonomous"


class WorkflowStatus(str, Enum):
    """执行状态."""

    QUEUED = "queued"
    RUNNING = "running"
    SUCCEEDED = "succeeded"
    FAILED = "failed"


class WorkflowCreate(BaseModel):
    """创建工作流请求."""

    requirement: str = Field(..., min_length=5, description="材料设计需求")
    mode: WorkflowMode = WorkflowMode.PRESET


class WorkflowSummary(BaseModel):
    """列表视图."""

    id: str
    requirement: str
    mode: WorkflowMode
    status: WorkflowStatus
    created_at: dt.datetime
    updated_at: dt.datetime


class WorkflowDetail(WorkflowSummary):
    """详情视图."""

    logs: List[str] = Field(default_factory=list)
    result_file: Optional[str] = None
    error: Optional[str] = None
    current_agent: Optional[str] = None
    stage_history: List[str] = Field(default_factory=list)
