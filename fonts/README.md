本目录字体为 Adobe Source Han Sans / Google Noto Sans CJK（同一套字形），SIL OFL 1.1，可商用。

- 不使用 Google Fonts CDN（国内常无法访问）。
- 网页使用地区子集 woff2，由 `shared/web/fetch-fonts.sh` 或 npmmirror 的 `@fontsource/noto-sans-{sc,tc,jp}` 生成。
- 分发时请保留 `LICENSE.txt`。
- 上线正式环境前，需按仓库维护者指令再部署；本地 assembleDist 会复制到各产品 `frontend/dist/fonts/`。
