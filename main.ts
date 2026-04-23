import { serve } from "https://deno.land/std/http/server.ts";

const API_KEY = Deno.env.get("API_KEY");
const BASE_URL = Deno.env.get("BASE_URL") || "https://api.openai.com/v1";

const html = `
<!DOCTYPE html>
<html>
<head>
    <title>AI 生图站</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        :root { --primary: #6366f1; --bg: #f8fafc; }
        body { background: var(--bg); color: #1e293b; font-family: -apple-system, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
        .card { background: white; padding: 2rem; border-radius: 1.5rem; box-shadow: 0 10px 25px rgba(0,0,0,0.05); width: 90%; max-width: 450px; text-align: center; }
        h2 { margin-top: 0; font-weight: 800; }
        textarea { width: 100%; box-sizing: border-box; border: 1px solid #e2e8f0; border-radius: 0.75rem; padding: 1rem; font-size: 1rem; resize: none; margin-bottom: 1rem; }
        button { background: var(--primary); color: white; border: none; padding: 0.75rem; border-radius: 0.75rem; font-weight: 600; width: 100%; cursor: pointer; }
        #result img { width: 100%; border-radius: 1rem; margin-top: 1.5rem; }
        .loading { font-size: 0.875rem; margin-top: 1rem; color: #64748b; display: none; }
    </style>
</head>
<body>
    <div class="card">
        <h2>我的 AI 生图站</h2>
        <textarea id="prompt" placeholder="请输入图片描述..."></textarea>
        <button onclick="generate()">开始生成</button>
        <div id="loading" class="loading">正在生成中，请稍候...</div>
        <div id="result"></div>
    </div>

    <script>
        async function generate() {
            const prompt = document.getElementById('prompt').value;
            if(!prompt) return alert('请输入描述');
            document.getElementById('loading').style.display = 'block';
            document.getElementById('result').innerHTML = '';
            try {
                const res = await fetch('/api/draw', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt })
                });
                const data = await res.json();
                if(data.url) {
                    document.getElementById('result').innerHTML = '<img src="' + data.url + '">';
                } else {
                    alert('生成失败：' + (data.error || '请检查 API 设置'));
                }
            } catch (e) {
                alert('请求出错');
            } finally {
                document.getElementById('loading').style.display = 'none';
            }
        }
    </script>
</body>
</html>
`;

serve(async (req) => {
  const url = new URL(req.url);

  if (req.method === "GET" && url.pathname === "/") {
    return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
  }

  if (req.method === "POST" && url.pathname === "/api/draw") {
    const { prompt } = await req.json();
    
    // 这里使用了更稳妥的字符串拼接，避免转义错误
    const fetchUrl = BASE_URL + "/images/generations";
    
    try {
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
      const imageUrl = data.data?.[0]?.url;
      
      return new Response(JSON.stringify({ url: imageUrl, error: data.error?.message }), {
        headers: { "content-type": "application/json" }
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
  }

  return new Response("Not Found", { status: 404 });
});
