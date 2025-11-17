# ECOMATS Web API

面向新网页前端的 FastAPI 服务。负责接收用户输入、触发现有 CrewAI 工作流，并暴露运行状态与结果。

## 快速开始

```bash
cd webapi
python -m venv .venv
.venv\Scripts\activate
pip install -e .
cp .env.webapi.example .env.webapi  # 如需自定义前缀变量
uvicorn app.main:app --reload --port 8000
```

> **提示**：Web API 仅读取 `ECOMATS_WEBAPI_` 前缀的变量。可在 `webapi/.env.webapi` 中填写专属配置（例如 CORS、工作流存储路径），不会影响根目录 `.env`。

## API 概览

- `POST /api/workflows`：创建新任务，body 包含 `requirement`、`mode (preset|autonomous)`。
- `GET /api/workflows`：列出所有任务及状态。
- `GET /api/workflows/{id}`：查询单个任务详情。
- `GET /api/workflows/{id}/result`：读取 `outputs/` 内生成的文本报告。

## 运行逻辑

1. 加载 `.env` 与 `src.config.Config`，复用现有 `create_llm`、`run_design_iteration`、`run_autonomous_workflow`。
2. 通过后台线程运行 Crew，线程安全地维护状态/日志。
3. 结果依旧写入 `outputs/workflow_result_*.txt`，Web API 额外记录文件路径供前端下载。
