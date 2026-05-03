"""第二段:LLM 广告决策。Stage 2b 实现真调用,Stage 3 注入 persona/state。"""

# Stage 2b: 接入 LLM(待用户选定服务商)
# 输入:SceneJSON + persona + user_state + ad_library
# 输出:SPEC §1.8.2 决策 JSON
# 三层决策(SPEC §1.4.2):
#   - sensitivity == "high"  → no_ad
#   - user_state == "emotional_fatigue" → content_switch
#   - 否则正常 show_ad
