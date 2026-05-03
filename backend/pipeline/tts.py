"""TTS:对话追问语音合成。Stage 4 接 ElevenLabs(SPEC §1.5.2 偏好)。"""

# Stage 4: 接 ElevenLabs(待用户提供 TTS_API_KEY)
# 输入:text + voice_preset(从 voice_presets.json 取 voice_id)
# 输出:audio bytes(mp3),建议缓存到 backend/data/cached_audio/
