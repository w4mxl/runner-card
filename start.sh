#!/bin/bash
# RunnerCard Studio 启动脚本

cd "$(dirname "$0")"
PORT=8080

# 查找可用端口
while lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; do
    PORT=$((PORT + 1))
done

LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "127.0.0.1")

echo "=================================================="
echo "🏃 RunnerCard Studio · 跑者晨跑打卡器已就绪！"
echo "=================================================="
echo ""
echo "📱 电脑端访问:   http://localhost:$PORT"
echo "📲 手机同一Wi-Fi: http://$LOCAL_IP:$PORT"
echo ""
echo "提示: 在手机 Safari 中打开后，可点击分享 -> '添加到主屏幕' 获取原生 App 体验！"
echo "=================================================="

# 自动在 Mac 默认浏览器打开
if command -v open >/dev/null 2>&1; then
  open "http://localhost:$PORT"
fi

python3 -m http.server $PORT
