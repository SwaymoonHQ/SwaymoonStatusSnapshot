# Swaymoon Status Snapshot

**只读静态快照**，由 [SwaymoonStatus](https://github.com/SwaymoonHQ/SwaymoonStatus) 私有仓 CI 自动发布。

- **正式实时状态页**：[status.swaymoon.com](https://status.swaymoon.com)
- **本站在线地址**：[status-static.swaymoon.com](https://status-static.swaymoon.com)（GitHub Pages）

## 说明

- 数据由杭州边缘每 **5 分钟**拉取公网 API 后推送到本仓，**非实时**；订阅与登录请使用正式站。
- 若 `data/meta.json` 中 `stale` 为 `true`，表示最近一次构建时部分接口不可用，页面使用了缓存 JSON。
- 本仓库内容为自动生成，请勿手工改 `main`（会被 CI 覆盖）。

## DNS

`status-static.swaymoon.com` → CNAME → `swaymoonhq.github.io`（见 GitHub Pages 设置）。
