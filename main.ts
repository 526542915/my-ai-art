/**
 * Deno AI 生图网站 - GitHub 部署专用版
 * 安全特性：通过环境变量管理 API Key
 */

// --- 配置区域 ---
// 优先读取环境变量，如果没有则使用默认值（仅用于测试）
const CONFIG = {
  BASE_URL: Deno.env.get("AI_BASE_URL") || "https://你的中转站地址/v1",
  API_KEY: Deno.env.get("AI_API_KEY") || "sk-你的API密钥",
  PORT: Number(Deno.env.get("PORT")) || 8000
};

// --- HTML 前端页面 ---
const getHTML = () => `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI 魔法绘图</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background: #f5f5f7; color: #333; }
        h1 { text-align: center; color: #1d1d1f; margin-bottom: 30px; }
        .card { background: white; padding: 24px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
        textarea { width: 100%; height: 120px; padding: 12px; border: 1px solid #e1e1e1; border-radius: 12px; box-sizing: border-box; font-size: 16px; resize: vertical; outline: none; transition: border-color 0.2s; }
        textarea:focus { border-color: #007aff; }
        .controls { margin-top: 20px; display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
        select { padding: 12px 16px; border-radius: 10px; border: 1px solid #e1e1e1; background: white; font-size: 15px; outline: none; }
        button { flex: 1; padding: 12px 24px; background: #007aff; color: white; border: none; border-radius: 10px; cursor: pointer; font-size: 16px; font-weight: 600; transition: all 0.2s; min-width: 120px; }
        button:hover:not(:disabled) { background: #005ecb; transform: translateY(-1px); }
        button:disabled { background: #ccc; cursor: not-allowed; opacity: 0.7; }
        .result-area { margin-top: 30px; min-height: 400px; display: flex; align-items: center; justify-content: center; background: #fff; border-radius: 16px; overflow: hidden; border: 2px dashed #e1e1e1; }
        img { max-width: 100%; height: auto; display: block; }
        .loading { color: #86868b; font-size: 18px; animation: pulse 1.5s infinite; }
        @keyframes pulse { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }
        .error-msg { color: #ff3b30; background: #fff0f0; padding: 15px; border-radius: 8px; text-align: center; width: 80%; }
    </style>
</head>
<body>
    <h1>🎨 AI 绘画工作台</h1>
    <div class="card">
        <textarea id="prompt" placeholder="描述你想画的画面，越详细越好...&#10;例如：一只赛博朋克风格的猫，霓虹灯背景，高细节，8k分辨率"></textarea>
        <div class="controls">
            <select id="model">
                <option value="nano-banana-2">Nano Banana 2 (Gemini)</option>
                <option value="dall-e-3">GPT Image (DALL-E 3)</option>
            </select>
            <button id="genBtn" onclick="generateImage()">开始生成</button>
        </div>
    </div>
    <div class="result-area" id="resultArea">
        <span class="loading">等待指令...</span>
    </div>

    <script>
        async function generateImage() {
            const promptInput = document.getElementById('prompt');
            const modelSelect = document.getElementById('model');
            const btn = document.getElementById('genBtn');
            const resultArea = document.getElementById('resultArea');
            
            const prompt = promptInput.value.trim();
            const model = modelSelect.value;

            if (!prompt) {
                promptInput.focus();
                return alert("请先输入描述词！");
            }

            // UI 状态更新
            btn.disabled = true;
            btn.innerText = "绘制中...";
            resultArea.innerHTML = '<span class="loading">正在连接 AI 大脑，请稍候...</span>';

            try {
                const response = await fetch('/api/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt, model })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    // 创建图片元素，预加载后再显示
                    const img = new Image();
                    img.src = data.url;
                    img.onload = () => {
                        resultArea.innerHTML = '';
                        resultArea.appendChild(img);
                    };
                } else {
                    resultArea.innerHTML = \`<div class="error-msg">&times 生成失败<br><small>\${data.error}</small></div>\`;
                }
            } catch (err) {
                resultArea.innerHTML = `<div class="error-msg">&times; 网络错误<br><small>\${err.message}</small></div>`;
            } finally {
                btn.disabled = false;
                btn.innerText = "开始生成";
            }
        }
    </script>
</body>
</html>
`;

// --- HTTP 服务器逻辑 ---
async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);

  // 1. 首页
  if (req.method === "GET" && url.pathname === "/") {
    return new Response(getHTML(), {
      headers: { 
        "content-type": "text/html; charset=utf-8",
        "Access-Control-Allow-Origin": "*" // 允许跨域
      },
    });
  }

  // 2. API 接口
  if (req.method === "POST" && url.pathname === "/api/generate") {
    try {
      const { prompt, model } = await req.json();

      // 安全检查：如果 Key 还是默认的，直接拒绝
      if (CONFIG.API_KEY === "sk-你的API密钥") {
         throw new Error("未配置 API_KEY，请在 Deno Deploy 环境变量中设置");
      }

      const requestBody = {
        model: model,
        prompt: prompt,
        n: 1,
        size: "1024x1024",
        response_format: "url"
      };

      const apiResponse = await fetch(`${CONFIG.BASE_URL}/images/generations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${CONFIG.API_KEY}`
        },
        body: JSON.stringify(requestBody)
      });

      const apiData = await apiResponse.json();

      if (apiData.data && apiData.data[0] && apiData.data[0].url) {
        return new Response(JSON.stringify({
          success: true,
          url: apiData.data[0].url
        }), {
          headers: { "content-type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      } else {
        throw new Error(apiData.error?.message || "上游 API 返回未知错误");
      }

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "服务器内部错误";
      return new Response(JSON.stringify({
        success: false,
        error: errorMsg
      }), { 
        status: 400, 
        headers: { "content-type": "application/json", "Access-Control-Allow-Origin": "*" } 
      });
    }
  }

  // 404
  return new Response("Not Found", { status: 404 });
}

console.log(`🚀 服务启动在 http://localhost:${CONFIG.PORT}`);
Deno.serve({ port: CONFIG.PORT }, handler);
