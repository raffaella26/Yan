# 颜 · 私人护肤日志

完全在浏览器中运行的护肤记录网页，不需要登录或后端服务。数据保存在当前浏览器的 localStorage 中。

## 本地运行

```bash
npm install
npm run dev
```

## 生成静态网页

```bash
npm run build
```

生成结果在 `dist` 目录。

## GitHub Pages

把整个项目上传到 GitHub，在仓库 **Settings → Pages → Source** 中选择 **GitHub Actions**。之后推送到 `main` 分支会自动发布。
