import { serve } from "https://deno.land/std/http/server.ts";

const html = "<html><head><meta charset='utf-8'><title>AI生图</title><style>body{font-family:sans-serif;display:flex;justify-content:center;padding:50px;background:#f0f2f5;}.card{background:white;padding:20px;border-radius:12px;box-shadow:0 4px 10px rgba(0,0,0,0.1);width:100%;max-width:350px;text-align:center;}textarea{width:100%;height:100px;margin-bottom:10px;border:1px solid #ccc;border-radius:8px;padding:10px;box-sizing:border-box;}button{background:#007bff;color:white;border:none;padding:12px;border-radius:8px;width:100%;cursor:pointer;}#res img{width:100%;margin-top:20px;border-radius:8px;}</style></head><body><div class='card'><h3>AI 快速生图</h3><textarea id='ipt' placeholder='输入描述...'></textarea><button onclick='draw()'>开始生成</button><div id='res'></div></div><script>async function draw(){const ipt=document.getElementById('ipt').value;if(!ipt)return alert('请输入内容');const res=document.getElementById('res');res.innerHTML='正在生成...';try{const r=await fetch('/api/draw',{method:'POST',body:JSON.stringify({prompt:ipt})});const d=await r.json();if(d.url)res.innerHTML='<img src=\"'+d.url+'\">';else alert('失败：'+(d.error||'接口错误'));}catch(e){alert('请求超时');}}</script></body></html>";

serve(async (req) => {
  const url = new URL(req.url);
  if (url.pathname === "/") return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
  if (url.pathname === "/api/draw") {
    try {
      const { prompt } = await req.json();
      const key = Deno.env.get("API_KEY");
      const base = (Deno.env.get("BASE_URL") || "https://api.openai.com/v1").replace(/\/$/, "");
      const r = await fetch(base + "/images/generations", {
        method: "POST",
        headers: { "Authorization": "Bearer " + key, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "dall-e-3", prompt: prompt, n: 1 })
      });
      const data = await r.json();
      return new Response(JSON.stringify({ url: data.data?.[0]?.url, error: data.error?.message }), { headers: { "content-type": "application/json" } });
    } catch (e) { return new Response(JSON.stringify({ error: e.message }), { status: 500 }); }
  }
  return new Response("Not Found", { status: 404 });
});
