# ECOMATS 前端

基于 Next.js App Router + Tailwind CSS 构建的网页控制台，实现浏览器端的任务提交与状态跟踪。

## 开发模式

```bash
cd frontend
npm install
npm run dev
# 访问 http://localhost:3000
```

默认后端服务地址指向 `http://localhost:8000`，可通过 `.env.local` 自定义：

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

## 主要功能

- 自适应表单：支持填写材料需求、切换预设/自主模式；
- 任务看板：实时（10s）刷新运行状态与日志；
- 详情页：展示单任务日志、错误信息及结果文件内容。

更多细节参见根目录文档或配套的 `webapi` 项目。

