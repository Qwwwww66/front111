# ECOMATS 配置与运行教程

ECOMATS 是一个基于 CrewAI 的水处理材料设计多智能体系统。它通过多个专业 Agent 完成材料方案设计、专家评估、综合验证、合成方法设计、机理分析和运行建议，并提供 FastAPI 后端与 Next.js 前端控制台。

本文档以“从零开始可以运行”为目标，完整说明模型配置、Python 后端、Web API、前端、动态 Agent 阶段展示、验证方法和常见故障。

> 安全提醒：`.env`、`webapi/.env.webapi` 和 `frontend/.env.local` 可能包含密钥或部署地址，不要把真实密钥提交到 Git。

## 1. 系统组成

一次网页任务的调用关系如下：

```text
浏览器（Next.js，默认 3000 端口）
        │
        │ POST/GET /api/workflows
        ▼
FastAPI（默认 8000 端口）
        │
        │ 后台线程启动工作流
        ▼
CrewAI + Qwen 多 Agent 工作流
        │
        ├── current_agent：最近上报的 Agent
        ├── stage_history：已经上报的阶段历史
        └── outputs/workflow_result_*.txt：最终结果
```

主要目录：

```text
ECOMATS/
├── .env.example                 # 模型与工具环境变量模板
├── requirements.txt             # CrewAI 和 Python 核心依赖
├── scripts/main.py              # 命令行工作流入口
├── src/
│   ├── agents/                  # Agent 定义
│   ├── config/config.py         # 模型配置读取
│   ├── prompts/                 # Agent 提示词
│   ├── tasks/                   # CrewAI 任务定义
│   ├── tools/                   # PubChem、Materials Project 等工具
│   └── utils/llm_config.py      # Qwen/EAS LLM 创建逻辑
├── webapi/
│   ├── .env.webapi.example      # Web API 配置模板
│   ├── pyproject.toml            # FastAPI 依赖
│   └── app/                      # API、数据模型和工作流管理器
├── frontend/
│   ├── .env.local.example       # 前端 API 地址模板
│   ├── package.json             # Next.js 依赖及命令
│   ├── app/                     # 页面
│   ├── components/              # 表单、Agent Runway、结果展示
│   └── lib/api.ts               # 前端 API 客户端
└── outputs/                     # 工作流结果文件
```

## 2. 准备运行环境

### 2.1 必需软件

建议安装：

- Git（可选，用于克隆和更新代码）
- Python 3.10 或 3.11；项目要求 Python ≥3.10，推荐 3.10/3.11 以减少 CrewAI 依赖兼容问题
- Node.js 20 或 22 LTS；前端的 `cross-env@10` 要求 Node.js ≥20
- npm（随 Node.js 安装）

检查版本：

```powershell
python --version
node --version
npm --version
```

如果 `python` 指向了不兼容或错误的版本，Windows 可以使用 `py -0p` 查看已安装的 Python，再通过 `py -3.11` 创建环境。

### 2.2 进入项目根目录

以下命令都假设当前目录是 ECOMATS 根目录：

```powershell
cd C:\path\to\ECOMATS
```

可以通过下面的命令确认位置；输出中应能看到 `src`、`webapi`、`frontend`：

```powershell
Get-ChildItem -Name
```

## 3. 安装 Python 后端

### 3.1 创建虚拟环境

Windows PowerShell：

```powershell
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
```

如果 PowerShell 阻止激活脚本，可以仅为当前终端临时放行：

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```

macOS/Linux：

```bash
python3.11 -m venv .venv
source .venv/bin/activate
```

激活成功后，命令行开头通常会出现 `(.venv)`。再次确认 Python：

```powershell
python --version
python -c "import sys; print(sys.executable)"
```

### 3.2 安装核心依赖和 Web API

保持位于项目根目录，执行：

```powershell
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python -m pip install -e .\webapi
```

macOS/Linux 最后一条命令写成：

```bash
python -m pip install -e ./webapi
```

这里需要执行两次安装：

- `requirements.txt` 安装 CrewAI、LangChain、DashScope 和材料数据库工具；
- `webapi/pyproject.toml` 安装 FastAPI、Uvicorn、Pydantic Settings 等网页后端依赖。

验证关键包：

```powershell
python -c "import crewai, dashscope, fastapi, uvicorn, langchain_openai; print('Python dependencies OK')"
```

## 4. 配置模型与材料数据库

### 4.1 创建根目录 `.env`

仅在 `.env` 尚不存在时复制模板：

Windows PowerShell：

```powershell
Copy-Item .env.example .env
```

macOS/Linux：

```bash
cp .env.example .env
```

使用编辑器打开根目录 `.env`。最小可运行配置如下：

```env
QWEN_API_BASE=https://dashscope.aliyuncs.com/compatible-mode/v1
QWEN_API_KEY=替换为真实的_DashScope_API_Key
QWEN_MODEL_NAME=qwen3-30b-a3b-instruct-2507

# 建议与 QWEN 配置保持一致，供 CrewAI/OpenAI 兼容组件使用
OPENAI_API_BASE=https://dashscope.aliyuncs.com/compatible-mode/v1
OPENAI_API_KEY=替换为同一个_DashScope_API_Key

MODEL_TEMPERATURE=0.7
MODEL_MAX_TOKENS=2048
VERBOSE=True
```

其中：

- `QWEN_API_KEY` 是当前代码明确检查的必填项；
- `QWEN_MODEL_NAME` 有默认值，但建议明确填写，并确认该模型在你的 DashScope 账户和区域中可用；
- `OPENAI_API_KEY` 建议填写相同密钥，避免 CrewAI 内部兼容组件读取不到；
- `VERBOSE=True` 会输出更详细的 Agent 日志，首次配置时建议保留。

不要写成下面这种占位值后直接运行：

```env
QWEN_API_KEY=YOUR_API_KEY
```

占位字符串虽然不为空，但调用模型时仍会认证失败。

### 4.2 可选数据库密钥

需要材料数据库能力时再配置：

```env
MATERIALS_PROJECT_API_KEY=你的_Materials_Project_API_Key
PUBCHEM_API_KEY=你的_PubChem_API_Key
```

这些变量不是启动主工作流的硬性条件，但某些 Agent 调用相应工具时可能需要它们。没有配置时，涉及对应外部数据库的能力可能不可用或受限。

### 4.3 Agent 温度和迭代配置

根 `.env` 还可以配置：

```env
MATERIAL_DESIGNER_TEMPERATURE=0.8
EXPERT_A_TEMPERATURE=0.3
EXPERT_B_TEMPERATURE=0.3
EXPERT_C_TEMPERATURE=0.3
FINAL_VALIDATOR_TEMPERATURE=0.5
MECHANISM_EXPERT_TEMPERATURE=0.3
SYNTHESIS_EXPERT_TEMPERATURE=0.3
OPERATION_SUGGESTING_TEMPERATURE=0.3
LITERATURE_PROCESSOR_TEMPERATURE=0.3

MAX_DESIGN_ITERATIONS=3
MIN_ACCEPTABLE_SCORE=7.0
HIGH_CONSISTENCY_THRESHOLD=1.0
MEDIUM_CONSISTENCY_THRESHOLD=2.0
```

建议首次运行使用模板默认值。调高温度会增加输出多样性，也会降低重复运行的一致性；增大迭代次数和最大 token 数通常会增加耗时及模型调用费用。

### 4.4 关于 EAS 配置

项目保留了以下自部署模型变量：

```env
EAS_ENDPOINT=https://你的-EAS-兼容接口
EAS_TOKEN=你的令牌
EAS_MODEL_NAME=你的模型名称
```

但当前网页工作流和 `scripts/main.py` 默认调用的是 `create_llm()`，也就是 Qwen OpenAI-compatible 接口。只填写 EAS 变量不会自动切换到 EAS；如需启用，需要在调用处明确改用 `create_eas_llm()` 并完成兼容性测试。

## 5. 配置 FastAPI 后端

后端配置文件是 `webapi/.env.webapi`。如果不创建该文件，代码会使用以下默认值：

- API 前缀：`/api`
- 允许的前端来源：`http://localhost:3000`、`http://127.0.0.1:3000`
- 结果目录：项目根目录下的 `outputs/`

本地首次运行时，直接使用默认值最稳妥，不必创建该文件。

需要修改时，新建 `webapi/.env.webapi`：

```env
ECOMATS_WEBAPI_API_PREFIX=/api
ECOMATS_WEBAPI_CORS_ORIGINS=["http://localhost:3000","http://127.0.0.1:3000"]
ECOMATS_WEBAPI_WORKFLOW_STORAGE=outputs
```

注意事项：

1. `ECOMATS_WEBAPI_CORS_ORIGINS` 是列表，使用上面的 JSON 数组格式最稳妥，不要只写普通逗号分隔字符串。
2. 推荐从项目根目录启动 Uvicorn，这样相对路径 `outputs` 指向根目录结果文件夹。
3. 前端代码固定请求 `/api/workflows`。如果修改 `ECOMATS_WEBAPI_API_PREFIX`，还需要同步修改 `frontend/lib/api.ts` 中的请求路径，否则前端会得到 404。
4. 修改配置后必须重启后端。

## 6. 启动 FastAPI 后端

打开第一个终端，进入项目根目录并激活 Python 环境：

```powershell
cd C:\path\to\ECOMATS
.\.venv\Scripts\Activate.ps1
python -m uvicorn webapi.app.main:app --reload --host 127.0.0.1 --port 8000
```

macOS/Linux：

```bash
cd /path/to/ECOMATS
source .venv/bin/activate
python -m uvicorn webapi.app.main:app --reload --host 127.0.0.1 --port 8000
```

看到类似下面的输出即表示服务已启动：

```text
Uvicorn running on http://127.0.0.1:8000
```

不要关闭这个终端。

### 6.1 后端健康检查

再打开一个 PowerShell 窗口执行：

```powershell
Invoke-RestMethod http://127.0.0.1:8000/health
```

预期结果：

```text
status
------
ok
```

也可以浏览器访问：

- 健康检查：<http://127.0.0.1:8000/health>
- Swagger API 文档：<http://127.0.0.1:8000/docs>
- OpenAPI JSON：<http://127.0.0.1:8000/openapi.json>

## 7. 安装并配置前端

### 7.1 安装 Node 依赖

打开第二个终端，进入前端目录：

```powershell
cd C:\path\to\ECOMATS\frontend
npm ci
```

项目包含 `package-lock.json`，所以推荐使用 `npm ci` 进行可复现安装。若你正在主动调整依赖，可使用 `npm install`。

如果出现 `Unsupported engine` 并提示 `cross-env`，通常表示 Node.js 低于 20；升级 Node.js 后删除不完整的 `node_modules`，再重新执行 `npm ci`。

### 7.2 配置后端地址

仅在 `frontend/.env.local` 不存在时复制：

Windows PowerShell：

```powershell
Copy-Item .env.local.example .env.local
```

macOS/Linux：

```bash
cp .env.local.example .env.local
```

本地默认内容：

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

这里填写的是后端协议、域名和端口，不要在末尾额外添加 `/api`，因为前端请求代码已经包含 `/api/workflows`。

如果后端改为 8001 端口，则同步改成：

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8001
```

修改 `.env.local` 后需要重启 Next.js。

## 8. 启动前端

保持位于 `frontend` 目录：

```powershell
npm run dev
```

看到类似输出即表示启动成功：

```text
Local: http://localhost:3000
```

页面入口：

- <http://localhost:3000/>：自动跳转英文首页
- <http://localhost:3000/en>：英文界面
- <http://localhost:3000/zh>：中文界面
- <http://localhost:3000/workflows>：独立任务看板
- <http://localhost:3000/architecture>：工作流架构页面

完整运行时需要保持两个终端：

```text
终端 1：FastAPI，http://127.0.0.1:8000
终端 2：Next.js， http://localhost:3000
```

## 9. 在网页中发起第一次任务

1. 打开中文页面 <http://localhost:3000/zh>。
2. 在需求输入框填写不少于 5 个字符的材料设计需求。
3. 选择工作模式：
   - `preset` / 预设流程：按预定义 Agent 顺序执行，适合首次验证；
   - `autonomous` / 自主调度：协调器根据需求选择任务，更灵活。
4. 点击提交。
5. 任务状态会依次表现为 `queued`、`running`、`succeeded` 或 `failed`。
6. 在 Agent Runway 中查看已完成、当前显示和待命阶段。
7. 工作流完成后，在结果区域查看 `outputs/workflow_result_*.txt` 内容。

测试需求示例：

```text
设计一种用于去除工业废水中六价铬的低成本复合吸附材料，要求说明材料组成、制备路线、作用机理、安全性和运行维护建议。
```

模型调用可能持续数分钟，并可能产生 API 费用。不要因为页面短时间没有切换 Agent 就立刻重复提交任务。

## 10. Agent 阶段动态展示是如何工作的

后端在内存中为每个工作流维护：

```text
status          整体状态
current_agent   最近一次回调上报的 Agent
stage_history   Agent 阶段历史
logs            运行日志
result_file     最终结果文件路径
error           失败信息
```

前端的更新机制：

- 任务列表大约每 10 秒刷新一次；
- 运行中任务详情大约每 6 秒刷新一次；
- 前端根据 `current_agent` 与 `stage_history` 动态排列 Agent Runway；
- 已完成节点显示为 100%，当前节点显示动画和渐进百分比。

当前实现有三个边界需要了解：

1. 这是 HTTP 轮询，不是 WebSocket/SSE，因此存在几秒延迟。
2. CrewAI 的阶段回调在单个任务完成后触发，所以 `current_agent` 更接近“最近完成并上报的 Agent”，不一定精确等于此刻正在计算的 Agent。首个任务完成前可能显示“等待 Agent 状态更新”。
3. 当前节点百分比由前端动画估算，不是模型返回的真实执行百分比；Agent 切换和最终状态来自后端真实数据。

因此它适合展示阶段流转和历史，不应当把动画百分比当作精确剩余时间。

## 11. 不启动前端，直接测试 API

先确保后端正在运行。

列出任务：

```powershell
Invoke-RestMethod http://127.0.0.1:8000/api/workflows
```

创建任务会真实调用模型并可能产生费用：

```powershell
$body = @{
  requirement = "设计一种用于去除六价铬的低成本吸附材料"
  mode = "preset"
} | ConvertTo-Json

$run = Invoke-RestMethod `
  -Method Post `
  -Uri http://127.0.0.1:8000/api/workflows `
  -ContentType "application/json" `
  -Body $body

$run
```

保存返回的 `id`，查询详情：

```powershell
Invoke-RestMethod "http://127.0.0.1:8000/api/workflows/$($run.id)"
```

任务成功后读取结果：

```powershell
Invoke-RestMethod "http://127.0.0.1:8000/api/workflows/$($run.id)/result"
```

## 12. 命令行模式

如果只想运行 CrewAI，不需要 FastAPI 和前端，可以在项目根目录执行：

```powershell
.\.venv\Scripts\Activate.ps1
python scripts\main.py
```

程序会依次询问：

1. 材料设计需求；
2. 预设工作流或自主调度模式。

命令行模式同样读取根目录 `.env`，结果写入 `outputs/`。它与网页模式是两个入口，不需要同时启动。

## 13. 常见故障排查

### 13.1 `ModuleNotFoundError: No module named 'fastapi'`

原因通常是没有激活正确虚拟环境，或只安装了根依赖而没有安装 Web API：

```powershell
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m pip install -e .\webapi
```

用下面的命令确认当前解释器：

```powershell
python -c "import sys; print(sys.executable)"
```

### 13.2 后端提示缺少 `QWEN_API_KEY`

检查：

- 文件名必须是项目根目录下的 `.env`，不是 `.env.txt`；
- Uvicorn 推荐从项目根目录启动；
- 修改后重启后端；
- 不要只填写 `YOUR_API_KEY` 占位符。

可以只打印是否存在，不打印真实密钥：

```powershell
python -c "from src.config.config import Config; print(bool(Config.QWEN_API_KEY), Config.QWEN_MODEL_NAME)"
```

### 13.3 前端显示 `Failed to fetch`、无法加载任务或一直离线

依次检查：

1. `http://127.0.0.1:8000/health` 是否返回 `ok`；
2. `frontend/.env.local` 是否指向正确端口；
3. 修改 `.env.local` 后是否重启前端；
4. 浏览器开发者工具 Network 中请求是否发往 `/api/workflows`；
5. 前后端域名不同的部署场景下，是否把前端来源加入 CORS。

### 13.4 CORS 报错

在 `webapi/.env.webapi` 使用 JSON 数组：

```env
ECOMATS_WEBAPI_CORS_ORIGINS=["http://localhost:3000","http://127.0.0.1:3000"]
```

如果前端使用局域网地址或正式域名，也要加入该来源，然后重启后端。

### 13.5 端口被占用

后端改用 8001：

```powershell
python -m uvicorn webapi.app.main:app --reload --host 127.0.0.1 --port 8001
```

同时修改 `frontend/.env.local`：

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8001
```

前端改用 3001：

```powershell
npm run dev -- -p 3001
```

此时还需要把 `http://localhost:3001` 加入后端 CORS。

### 13.6 页面长时间停留在同一个 Agent

这不一定是故障。当前回调通常在一个 CrewAI 任务完成后才上报，单个 Agent 的模型或工具调用可能耗时较长。先观察后端终端日志；如果出现模型认证、网络或工具异常，再根据具体错误处理。

### 13.7 任务完成但没有结果文件

检查：

- 是否从项目根目录启动了后端；
- 根目录 `outputs/` 是否存在并可写；
- 是否把 `ECOMATS_WEBAPI_WORKFLOW_STORAGE` 指向了其他目录；
- 后端日志是否显示工作流异常；
- `GET /api/workflows/{id}` 返回的 `result_file` 是否为空。

### 13.8 重启后任务列表为空

这是当前实现的正常行为。工作流元数据保存在 FastAPI 进程内存中，重启后会丢失；已经写入 `outputs/` 的结果文件仍会保留。需要跨重启保存任务历史时，应增加 SQLite/PostgreSQL 等持久化存储。

## 14. 构建和生产运行

### 14.1 前端构建

```powershell
cd frontend
npm ci
npm run build
npm run start
```

`NEXT_PUBLIC_API_BASE_URL` 会参与前端构建。生产地址应在执行 `npm run build` 前配置好。

### 14.2 后端运行

开发环境使用 `--reload`；生产环境不要使用自动重载：

```powershell
python -m uvicorn webapi.app.main:app --host 0.0.0.0 --port 8000
```

生产部署还需要：

- 只允许实际前端域名的 CORS；
- 使用 Nginx/Caddy 等反向代理和 HTTPS；
- 增加身份认证、请求限流和费用保护；
- 将任务状态迁移到持久化数据库或任务队列；
- 妥善管理 API Key，不要把 `.env` 放入镜像或公开仓库；
- 为长时间工作流配置进程管理、日志和失败恢复。

当前 API 没有身份认证，也把工作流状态保存在单进程内存中，不建议未经加固直接暴露到公网。

## 15. 开发者快速定位

- 模型与 Agent 参数：`src/config/config.py`
- LLM 创建：`src/utils/llm_config.py`
- 工作流与进度回调：`scripts/main.py`
- API 入口：`webapi/app/main.py`
- 工作流内存状态：`webapi/app/workflow_runner.py`
- API 数据结构：`webapi/app/models.py`
- 前端 API 地址和请求：`frontend/lib/api.ts`
- 中文 Agent Runway：`frontend/components/workflow-table.tsx`
- 英文 Agent Runway：`frontend/components/workflow-table-en.tsx`
- 中文首页：`frontend/app/zh/page.tsx`
- 英文首页：`frontend/app/en/page.tsx`

## 16. 最短启动清单

已经完成首次安装后，每次启动只需：

终端 1，项目根目录：

```powershell
.\.venv\Scripts\Activate.ps1
python -m uvicorn webapi.app.main:app --reload --host 127.0.0.1 --port 8000
```

终端 2：

```powershell
cd frontend
npm run dev
```

然后访问：

```text
中文：http://localhost:3000/zh
英文：http://localhost:3000/en
API： http://127.0.0.1:8000/docs
```

## License

本项目采用 MIT License。
