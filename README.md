# Swaymoon Status Snapshot

**只读静态快照**，由杭州 / 弗吉尼亚边缘每 5 分钟刷新 `data/*.json`，完整前端在发版时从 [SwaymoonStatus](https://github.com/SwaymoonHQ/SwaymoonStatus) 发布。

- **正式实时状态页**：[status.swaymoon.com](https://status.swaymoon.com)
- **本站在线地址**：[status-static.swaymoon.com](https://status-static.swaymoon.com)（GitHub Pages）

## 说明

- 数据来自定时拉取的公网 API，**非实时**；订阅与登录请使用正式站。
- `data/meta.json` 中 `stale: true` 表示部分接口用了缓存；`originUnreachable: true` 表示杭州与弗吉尼亚均不可达，页面标为严重中断。
- 请勿手工改 `main` 上的 `data/`（会被边缘 timer 覆盖）。

## DNS

`status-static.swaymoon.com` → CNAME → `swaymoonhq.github.io`（见 GitHub Pages 设置）。
