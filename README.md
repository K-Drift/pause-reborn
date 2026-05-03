# Pause Reborn

> 把腾讯视频"暂停广告"从打断观影的弹窗,重塑为感知场景、理解用户、懂得克制的智能暂停体验系统。

完整产品规约见 [SPEC.md](./SPEC.md);AI Agent 协作约定见 [CLAUDE.md](./CLAUDE.md)。

## 启动

```bash
# 终端 1:前端
cd frontend
pnpm install
pnpm dev                            # http://localhost:3000

# 终端 2:后端
cd backend
python -m venv .venv
. .venv/Scripts/activate            # Windows;Linux/Mac 用 source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000   # http://localhost:8000
```

## 环境变量

复制 `.env.example` 为 `.env`,填入真实 key 后启动后端。
当前阶段(Stage 0/1)Mock 模式,**无需任何 key 即可运行**。
