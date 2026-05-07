# CLAUDE.md — AI Agent 协作约定

> 本文档对 Claude Code、OpenAI Codex、Antigravity 等任何参与本项目的 AI Agent 都生效。
> SPEC.md 是唯一权威规约。本文件只提炼 SPEC §1.9 + 当前实施状态。

---

## 当前实施状态

实施计划在 `C:\Users\HP\.claude\plans\1-spec-md-clever-hinton.md`(用户已批准)。
按 5 个 Stage 推进,每 Stage 一个 commit。

- [x] **Stage 0**:脚手架与占位素材
- [x] **Stage 1**:主场景静态版(Mock 数据驱动)
- [x] **Stage 2**:三段 Pipeline 真 API 接入(2a VLM / 2b LLM / 2c 图像)
- [x] **Stage 4**:分阶段加载与渐次反馈体验升级(三段 endpoint 拆分 + 渐次淡入 + 真图植入广告卡)
- [ ] **Stage 3**:画像切换器 + 状态切换器(尚未实施,与 Stage 4 互不依赖)
- [ ] **Stage 5**:对话式追问 + TTS(原 Stage 4,后延)
- [ ] **Stage 6**:VPP 示例 + 广告主入口(原 Stage 5,后延,可选)

**API 选型 TBD**:每段开始接入真 API 前,**必须先停下来问用户**:服务商是哪家?key 放哪个环境变量?

---

## 工作守则(摘自 SPEC §1.9)

1. **每次任务前**:重读 SPEC.md 对应章节 + 本文件当前 Stage,确认边界。
2. **每次任务后**:1-2 句话总结改了什么、改在哪里。
3. **不确定就停下问用户**,严禁自由发挥加 SPEC 之外的功能。
4. **新增依赖**:在改动说明中列出依赖与理由,让用户审批。
5. **代码风格**:
   - 注释用中文,简短即可
   - 函数 < 50 行
   - 不过度抽象(Demo 不需要"未来扩展性")
   - API 调用失败:`print` 错误 + 返回降级响应,不写复杂重试
6. **测试**:用真 API 测试,不写 mock 测试代码。配额不够立刻停下通知用户。
   - 但**演示降级路径**是允许的:Stage 2 接入真 API 时,失败仍可回落到 Stage 1 mock JSON,演示不中断。
7. **Git 提交**:每个 Stage 一次 commit,格式 `[Stage N] 简短描述`。
8. **禁止**:
   - 改 SPEC.md(要改先和用户讨论)
   - 加 Docker / CI 配置
   - 写超出 Demo 范围的功能

---

## 启动命令

```bash
# 前端(终端 1)
cd frontend && pnpm dev   # http://localhost:3000

# 后端(终端 2)
cd backend && .venv/Scripts/activate && uvicorn main:app --reload --port 8000
```

`.env` 配置参考 `.env.example`。所有 key **不要提交**。
