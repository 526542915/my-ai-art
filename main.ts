import { serve } from "https://deno.land/std/http/server.ts";

const html = `
<!DOCTYPE html>
<html>
<head>
    <title>AI 生图站</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { font-family: sans-serif; display: flex; justify-content: center; padding: 20px; background: #f0f2f5; }
        .card { background: white; padding: 2rem; border-radius: 1rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); width: 100%; max-width: 400px; text-align: center; }
        textarea { width: 100%; height: 80px; margin-bottom: 1rem; padding: 10px; box-sizing: border-box; }
        button { background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; width: 100%; }
        #result img { width: 100%; margin-top: 20px; border-radius: 8px; }
    </style>
</head>
<body>
    <div class="card">
        <h2>AI 生图站</h2>
        <textarea id="p" placeholder="描述一下图片..."></textarea>
        <button onclick="draw()">开始生成</button>
        <div id="result"></div>
    </div>
    <script>
        async function draw() {
            const p = document.getElementById('p').value;
            if(!p) return alert('请输入内容');
            document.getElementById('result').innerHTML = '生成中...';
            const r = await fetch('/api/draw', { method: 'POST', body: JSON.stringify({ p }) });
            const d = await r.json();
            if(d.url) document.getElementById('result').innerHTML = '<img src="'+d.url+'">';
            else alert('失败了，请检查 Key');
        }
    </script>
</body>
</html>
`;

serve(async (req: Request) => {
  const url = new URL(req.url);
  
  if (url.pathname === "/") {
    return new Response(html, { headers: { "content-type": "text/html;charset=utf-8" } });
  }

  if (url.pathname === "/api/draw") {
    const { p } = await req.json();
    const API_KEY = Deno.env.get("API_KEY");
    const BASE_URL = Deno.env.get("BASE_URL") || "https://api.openai.com/v1";

    try {
      const res = await fetch(BASE_URL + "/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + API_KEY
        },
        body: JSON.stringify({ model: "dall-e-3", prompt: p, n: 1 })
      });
      const data = await res.json();
      return new Response(JSON.stringify({ url: data.data?.[0]?.url }), {
        headers: { "content-type": "application/json" }
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
  }

  return new Response("Not Found", { status: 404 });
});
