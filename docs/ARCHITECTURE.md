# Architecture

Next.js App Router + TypeScript。当前首版为一个可运行的客户端产品切片，核心数据保存在 `localStorage`，所以计时不依赖网络。

## 数据流
1. 开始：保存 `still-active-since` 时间戳。
2. 恢复：每秒用 `Date.now() - activeSince` 计算显示值，浏览器后台恢复仍准确。
3. 结束：大于等于 60 秒才保存 Session；小于一分钟不进入统计。
4. 同步：下一阶段通过 Supabase anonymous auth 和 RLS RPC 上传 session；UI 只在确认有真实数据时展示累计值。

## 后续 SwiftUI
保留同一组领域模型（Session、Category、DailyReport），将本地存储替换为 SwiftData，并把 Supabase 同步放入 actor。
