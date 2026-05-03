# 视频占位说明

Stage 0 留空,Stage 1 起需要 1 个示例剧集片段:

- 文件名建议:`sample_drama.mp4`
- 时长:30 秒-2 分钟即可,循环播放
- 关键时刻:在视频时间轴上至少能"暂停"出 5 个不同氛围的关键帧(对应 `pause-frames/` 中的 5 张占位 SVG)

如果暂时没有真视频,Stage 1 的 `VideoPlayer` 会回退用一段 CSS/JS 渲染的"伪视频"占位
(随时间在 5 张 SVG 之间切换),不影响 Demo 演示。
