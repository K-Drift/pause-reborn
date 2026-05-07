# Pause Reborn · 腾讯视频暂停体验重塑系统

> 把腾讯视频的暂停广告,从打断观影的弹窗,重塑为**感知场景、理解用户、懂得克制**的体验系统。

## 演示

- 在线体验:https://pause-reborn.vercel.app/

## 技术栈

- **前端**:Next.js 16 + Tailwind v4 + TypeScript
- **后端**:Python FastAPI
- **AI 能力**:
  - VLM / LLM:Gemini 3.1 Pro Preview(经 Dchai 中转,OpenAI 兼容协议)
  - 图像生成:Nano Banana Pro

## 本地运行

### 仅前端(Mock 模式,无需后端)

```bash
cd frontend
pnpm install
cp .env.example .env.local
# 确保 NEXT_PUBLIC_USE_HANDCRAFTED_ADS=true
pnpm dev
```

打开 http://localhost:3000

### 完整运行(真实 AI 调用)

需配置 `backend/.env` 中的 API key,然后:

```bash
# 终端 1:启动后端
cd backend
python -m venv .venv
. .venv/Scripts/activate            # Windows;Linux/Mac 用 source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# 终端 2:启动前端
cd frontend
pnpm install
cp .env.example .env.local
# 修改 NEXT_PUBLIC_USE_HANDCRAFTED_ADS=false
pnpm dev
```

复制 `backend/.env.example` 为 `backend/.env`,填入 `LLM_API_KEY` / `LLM_BASE_URL` / `LLM_MODEL_VISION` / `LLM_MODEL_TEXT` / `IMAGE_MODEL_NAME` 等真实 key。

## 关于在线 Demo 的说明

部署在 Vercel 的在线 Demo 采用预生成的 Mock 数据,确保评委体验流畅、稳定、零延迟。

完整的实时 AI 调用代码完整保留在 `backend/pipeline/` 目录,演示视频中展示的是真实 AI 调用版本。

这一选择对应文档中所述的工程化方案——真实生产环境的「离线预生成 + 实时查询」架构,本质上就是这种模式的工业化版本。

## 三层决策模型

每一次「暂停」的决策由三个独立维度叠加构成:

- **画面层 (Frame)** — 这一帧讲了什么,适合什么品类的产品
- **用户层 (Persona)** — 这是谁在看,适合什么具体品牌
- **状态层 (State)** — 此刻该不该打扰,该展示广告还是该陪伴

优先级:**状态层 > 画面层 > 用户层**

## 三段式 AI Pipeline

VLM 场景理解 → LLM 品牌决策 → 图像生成,前后端三个独立 endpoint,每一段都有独立的加载态与可视化。每段调用失败自动落回 mock,响应里 `_ai_status: "live" | "fallback"` 让前端清晰展示当前是真 AI 还是降级。

## Cinematic VPP Integration

我们对 AI 广告融入有七条电影级原则,详见项目文档第 10 页。

最重要的一条:**产品必须服从场景,而不是场景服从产品。**

## 文档

- 完整产品规约:[SPEC.md](./SPEC.md)
- AI Agent 协作约定:[CLAUDE.md](./CLAUDE.md)

## 作者

[占位:填写你的名字]
腾讯 PCG 校园 AI 产品创意大赛 · 命题赛道 · 2026
