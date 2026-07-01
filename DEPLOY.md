# MRR-CL-VoIA 答辩网站部署说明

这是一个纯静态网站，可以部署到 Vercel、Netlify、GitHub Pages 或任意静态文件服务器。

## 推荐方式：Vercel

1. 登录 https://vercel.com
2. 新建 Project
3. 选择 `web_defense_20260701_deploy` 目录或上传压缩包
4. Framework Preset 选择 `Other`
5. Build Command 留空
6. Output Directory 留空或填 `.`
7. Deploy

## 备用方式：Netlify

1. 登录 https://app.netlify.com/drop
2. 上传 `MRR_CL_VoIA_defense_website_static.zip`
3. 等待部署完成，复制生成的网址

## 本地预览

```powershell
cd C:\Users\lenovo\Documents\机器人\ragh_hrl_3d\paper_drones\course_design_showcase_20260628\web_defense_20260701
python -m http.server 8787
```

然后打开：

```text
http://127.0.0.1:8787/
```
