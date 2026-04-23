import { serve } from "https://deno.land/std/http/server.ts";

const API_KEY = Deno.env.get("API_KEY");
const BASE_URL = Deno.env.get("BASE_URL") || "https://api.openai.com/v1";

const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>AI 生图站</title>
    <style>
        body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f8fafc; }
        .card { background: white; padding: 2rem; border-radius: 1rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); width: 90%; max-width: 400px; text-align: center; }
        textarea { width: 100%; height: 80px; margin-bottom: 1rem; padding: 10px; box-sizing: border-box; border: 1px solid #ddd; border-radius: 8px; }
        button { background: #6366f1; color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer; width: 100%; font-weight: bold; }
        #res img { width: 100%; margin-top: 20px; border-radius: 8px; }
    </style>
</head>
<body>
    <div class="card">
        <h2>AI 生图站</h2>
        <textarea id="t" placeholder="输入描述词..."></textarea>
        <button onclick="s()">立即生成</button>
        <div id="res"></div>
    </div>
    <script>
        async function s() {
            const t = document.getElementById('t').value;
            if(!t) return alert('请输入内容');
            const resDiv = document.getElementById('res');
            resDiv.innerHTML = '正在生成中...';
            try {
                const r = await fetch('/api/draw', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: t })
                });
                const d = await r.json();
                if(d.url) resDiv.innerHTML = '<img src="' + d.url + '">';
                else alert('失败：' + (d.error || '检查 Key 或地址'));
            } catch (e) { alert('请求出错'); }
        }
    </script>
</body>
</html>
`;

async function handleRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);

  // 首页路由
  if (url.pathname === "/" || url.pathname === "") {
    return new Response(html, {
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }

  // API 路由
  if (url.pathname === "/api/draw" && req.method === "POST") {
    try {
      const { prompt } = await req.json();
      const fetchUrl = BASE_URL.replace(/\/$/, "") + "/images/generations";
      
      const response = await fetch(fetchUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": \`Bearer \${API_KEY}\`
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
        headers: { "content-type": "application/json" },
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
  }

  // 兜底返回 404
  return new Response("Not Found", { status: 404 });
}

// 核心修改：不显式指定端口，让 Deno Deploy 自动分配
serve(handleRequest);
