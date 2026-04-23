import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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
        body { font-family: sans-serif; max-width: 600px; margin: 40px auto; padding: 20px; text-align: center; background: #f4f4f9; }
        textarea { width: 100%; height: 100px; padding: 10px; border-radius: 8px; border: 1px solid #ccc; margin-bottom: 10px; }
        button { background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; width: 100%; }
        #result { margin-top: 20px; }
        img { max-width: 100%; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
        .loading { display: none; color: #666; }
    </style>
</head>
<body>
    <h2>我的 AI 生图站</h2>
    <textarea id="prompt" placeholder="请输入图片描述..."></textarea>
    <button onclick="generate()">开始生成</button>
    <div id="loading" class="loading">正在生成中，请稍候...</div>
    <div id="result"></div>

    <script>
        async function generate() {
            const prompt = document.getElementById('prompt').value;
            if(!prompt) return alert('请输入描述');
            
            document.getElementById('loading').style.display = 'block';
            document.getElementById('result').innerHTML = '';

            try {
                const res = await fetch('/api/draw', {
                    method: 'POST',
                    body: JSON.stringify({ prompt })
                });
                const data = await res.json();
                if(data.url) {
                    document.getElementById('result').innerHTML = '<img src="' + data.url + '">';
                } else {
                    alert('生成失败：' + (data.error || '未知错误'));
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

  // 路由 1：返回网页
  if (req.method === "GET" && url.pathname === "/") {
    return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
  }

  // 路由 2：处理生图请求
  if (req.method === "POST" && url.pathname === "/api/draw") {
    const { prompt } = await req.json();
    
    try {
      const response = await fetch(\`\${BASE_URL}/images/generations\`, {
        method: "POST",
        headers: {
          "Authorization": \`Bearer \${API_KEY}\`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "dall-e-3", // 这里可以根据你中转支持的模型改，比如 gemini-pro-vision
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
