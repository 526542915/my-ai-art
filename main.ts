import { serve } from "https://deno.land/std/http/server.ts";

// 网页前端 HTML
const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>AI 极简生图站</title>
    <style>
        :root { --primary: #6366f1; --bg: #f8fafc; }
        body { background: var(--bg); color: #1e293b; font-family: -apple-system, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
        .card { background: white; padding: 2rem; border-radius: 1.5rem; box-shadow: 0 10px 25px rgba(0,0,0,0.05); width: 90%; max-width: 400px; text-align: center; }
        h2 { margin-top: 0; font-weight: 800; color: #1e293b; }
        textarea { width: 100%; box-sizing: border-box; border: 1px solid #e2e8f0; border-radius: 0.75rem; padding: 1rem; font-size: 1rem; resize: none; margin-bottom: 1rem; }
        button { background: var(--primary); color: white; border: none; padding: 0.8rem; border-radius: 0.75rem; font-weight: 600; width: 100%; cursor: pointer; transition: 0.2s; }
        button:hover { opacity: 0.9; }
        #result img { width: 100%; border-radius: 1rem; margin-top: 1.5rem; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .loading { font-size: 0.875rem; margin-top: 1rem; color: #64748b; display: none; }
    </style>
</head>
<body>
    <div class="card">
        <h2>AI 生图站</h2>
        <textarea id="prompt" placeholder="描述你想要的画面..."></textarea>
        <button id="btn" onclick="generate()">生成图片</button>
        <div id="loading" class="loading">AI 正在思考，请稍候...</div>
        <div id="result"></div>
    </div>

    <script>
        async function generate() {
            const prompt = document.getElementById('prompt').value;
            if(!prompt) return alert('请输入描述内容');
            
            const btn = document.getElementById('btn');
            const loading = document.getElementById('loading');
            const result = document.getElementById('result');

            btn.disabled = true;
            loading.style.display = 'block';
            result.innerHTML = '';

            try {
                const res = await fetch('/api/draw', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt })
                });
                const data = await res.json();
                if(data.url) {
                    result.innerHTML = '<img src="' + data.url + '">';
                } else {
                    alert('生成失败：' + (data.error || '请检查 API 设置'));
                }
            } catch (e) {
                alert('请求出错，请检查网络');
            } finally {
                btn.disabled = false;
                loading.style.display = 'none';
            }
        }
    </script>
</body>
</html>
`;

// Deno 后端逻辑
serve(async (req: Request) => {
  const url = new URL(req.url);

  // 1. 访问首页
  if (req.method === "GET" && url.pathname === "/") {
    return new Response(html, { 
        headers: { "content-type": "text/html; charset=utf-8" } 
    });
  }

  // 2. 处理生图接口
  if (req.method === "POST" && url.pathname === "/api/draw") {
    try {
      const { prompt } = await req.json();
      
      const API_KEY = Deno.env.get("API_KEY");
      const BASE_URL = Deno.env.get("BASE_URL") || "https://api.openai.com/v1";

      // 拼凑完整的请求地址
      const fetchUrl = BASE_URL.endsWith("/") ? BASE_URL + "images/generations" : BASE_URL + "/images/generations";

      const response = await fetch(fetchUrl, {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt: prompt,
          n: 1,
          size: "1024x1024"
        })
      });

      const data = await response.json();
      
      return new Response(JSON.stringify({ 
        url: data.data?.[0]?.url, 
        error: data.error?.message 
      }), {
        headers: { "content-type": "application/json" }
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
  }

  return new Response("Not Found", { status: 404 });
}, { port: 8000 }); // 显式锁定端口，解决部分部署失败问题
