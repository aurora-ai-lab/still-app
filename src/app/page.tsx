"use client";

import { useEffect, useMemo, useState } from "react";

type View = "today" | "history" | "achievements" | "settings";
type Session = { id: string; startedAt: number; endedAt: number; duration: number; category: string };

const categories = ["发呆", "散步", "看窗外", "喝水", "不知道"];
const navItems: { id: View; label: string; icon: string }[] = [
  { id: "today", label: "今天", icon: "◷" },
  { id: "history", label: "历史", icon: "▦" },
  { id: "achievements", label: "成就", icon: "✦" },
  { id: "settings", label: "设置", icon: "⌁" },
];

function formatDuration(totalSeconds: number) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return h > 0 ? `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatMinutes(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  return minutes < 60 ? `${minutes} 分钟` : `${Math.floor(minutes / 60)} 小时 ${minutes % 60} 分钟`;
}

export default function Home() {
  const [view, setView] = useState<View>("today");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSince, setActiveSince] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [showEnd, setShowEnd] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(categories[0]);
  const [copied, setCopied] = useState(false);
  const [showShare, setShowShare] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("still-sessions");
    const active = localStorage.getItem("still-active-since");
    if (saved) setSessions(JSON.parse(saved));
    if (active) setActiveSince(Number(active));
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem("still-sessions", JSON.stringify(sessions));
  }, [sessions]);

  const todayKey = new Date().toISOString().slice(0, 10);
  const todaySessions = sessions.filter((session) => new Date(session.startedAt).toISOString().slice(0, 10) === todayKey);
  const todayTotal = todaySessions.reduce((sum, session) => sum + session.duration, 0) + (activeSince ? Math.floor((now - activeSince) / 1000) : 0);
  const allTime = sessions.reduce((sum, session) => sum + session.duration, 0);
  const activeDuration = activeSince ? Math.floor((now - activeSince) / 1000) : 0;
  const heatmap = useMemo(() => Array.from({ length: 35 }, (_, index) => (index % 7 === 1 ? 0 : (index * 17 + 12) % 5)), []);

  const start = () => {
    const timestamp = Date.now();
    setActiveSince(timestamp);
    localStorage.setItem("still-active-since", String(timestamp));
  };

  const stop = () => setShowEnd(true);

  const finish = () => {
    if (!activeSince) return;
    const endedAt = Date.now();
    const duration = Math.floor((endedAt - activeSince) / 1000);
    if (duration >= 60) {
      setSessions((current) => [{ id: crypto.randomUUID(), startedAt: activeSince, endedAt, duration, category: selectedCategory }, ...current]);
    }
    setActiveSince(null);
    localStorage.removeItem("still-active-since");
    setShowEnd(false);
  };

  const downloadShareCard = () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350"><rect width="1080" height="1350" fill="#20201e"/><circle cx="900" cy="120" r="230" fill="none" stroke="#c7f36c" stroke-opacity=".25"/><text x="90" y="150" fill="#9b9b92" font-family="monospace" font-size="24">STILL / 今日报告</text><text x="90" y="430" fill="#f5f4ef" font-family="sans-serif" font-size="76">什么都没发生，</text><text x="90" y="525" fill="#c7f36c" font-family="sans-serif" font-size="76">也很好。</text><text x="90" y="760" fill="#f5f4ef" font-family="monospace" font-size="64">${formatMinutes(todayTotal)}</text><text x="90" y="820" fill="#9b9b92" font-family="sans-serif" font-size="24">安静时间</text><circle cx="90" cy="1170" r="18" fill="#c7f36c"/><text x="130" y="1180" fill="#f5f4ef" font-family="sans-serif" font-size="26">无事发生 · Still</text></svg>`;
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "still-today.svg"; a.click(); URL.revokeObjectURL(url);
  };

  const share = async () => {
    const text = `今日无事发生 ${formatMinutes(todayTotal)}。\n什么都没发生，也很好。`;
    if (navigator.share) await navigator.share({ title: "无事发生", text });
    else {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    }
  };

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">·</span><span>无事发生</span></div>
        <div className="brand-sub">STILL / 记录空白</div>
        <nav className="desktop-nav" aria-label="主导航">
          {navItems.map((item) => <button key={item.id} className={`nav-item ${view === item.id ? "selected" : ""}`} onClick={() => setView(item.id)}><span>{item.icon}</span>{item.label}</button>)}
        </nav>
        <div className="sidebar-note"><span className="pulse-dot" /> 离线可用<br /><small>你的安静时刻只属于你</small></div>
      </aside>

      <section className="content">
        <header className="topbar"><div><p className="eyebrow">{new Date().toLocaleDateString("zh-CN", { weekday: "long", month: "long", day: "numeric" })}</p><h1>{view === "today" ? "今天" : navItems.find((item) => item.id === view)?.label}</h1></div><div className="top-actions"><span className="sync-status"><i /> 本地已保存</span><button className="avatar" aria-label="账户">你</button></div></header>

        {view === "today" && <>
          <section className={`timer-card ${activeSince ? "running" : ""}`}>
            <div className="timer-orbit" aria-hidden="true"><span /></div>
            <div className="timer-copy"><p className="eyebrow">{activeSince ? "正在发生" : "此刻没有安排"}</p><div className="timer-value">{formatDuration(activeDuration)}</div><p className="timer-caption">{activeSince ? "不需要做什么，继续就好。" : "给自己一段不必产出的时间。"}</p></div>
            <button className={`primary-cta ${activeSince ? "stop" : ""}`} onClick={activeSince ? stop : start}>{activeSince ? "结束这段时间" : "开始无事发生"}<span>↗</span></button>
          </section>

          <section className="today-grid"><div className="panel report-panel"><div className="panel-heading"><div><p className="eyebrow">今日报告</p><h2>什么都没发生，<br /><em>也很好。</em></h2></div><span className="report-date">{todaySessions.length > 0 ? "已记录" : "等待第一段"}</span></div><div className="report-stats"><div><strong>{formatMinutes(todayTotal).replace(" 分钟", "")}</strong><span>安静时间</span></div><div><strong>{todaySessions.length || "—"}</strong><span>段记录</span></div><div><strong>{todaySessions.length ? "100%" : "—"}</strong><span>未被打扰</span></div></div><div className="report-actions"><button className="text-button" onClick={share}>{copied ? "已复制到剪贴板" : "分享今日报告 →"}</button><button className="text-button" onClick={() => setShowShare(true)}>预览分享卡 →</button></div></div><div className="panel heat-panel"><div className="panel-heading"><div><p className="eyebrow">过去 35 天</p><h3>空白日历</h3></div><span className="heat-legend">少 <i /><i /><i /><i /> 多</span></div><div className="heatmap">{heatmap.map((level, index) => <span key={index} className={`heat-${level}`} title={`${level ? level * 15 : 0} 分钟`} />)}</div><div className="heat-footer"><span>每一格都是一个没有被浪费的空白。</span><button className="text-button" onClick={() => setView("history")}>查看历史</button></div></div></section>

          <section className="insight-row"><div className="insight"><span className="insight-icon">✦</span><div><p className="eyebrow">连续记录</p><strong>{todaySessions.length ? "第 1 天" : "从今天开始"}</strong></div></div><div className="insight"><span className="insight-icon">∞</span><div><p className="eyebrow">全部时间</p><strong>{allTime ? formatMinutes(allTime) : "—"}</strong></div></div><div className="insight quote"><span>“</span><strong>允许自己<br />什么都不做。</strong></div></section>
        </>}

        {view === "history" && <History sessions={sessions} heatmap={heatmap} />}
        {view === "achievements" && <Achievements sessions={sessions} todayTotal={todayTotal} />}
        {view === "settings" && <Settings />}
        <footer className="mobile-nav">{navItems.map((item) => <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => setView(item.id)}><span>{item.icon}</span>{item.label}</button>)}</footer>
      </section>

      {showEnd && <div className="modal-backdrop" onClick={() => setShowEnd(false)}><div className="end-modal" onClick={(event) => event.stopPropagation()}><div className="modal-handle" /><p className="eyebrow">结束这段无事发生</p><h2>刚才在做什么？</h2><p className="modal-copy">选择一个最接近的答案。也可以什么都不说。</p><div className="category-grid">{categories.map((category) => <button key={category} className={selectedCategory === category ? "chosen" : ""} onClick={() => setSelectedCategory(category)}>{category}</button>)}</div><button className="primary-cta" onClick={finish}>保存这段时间 <span>↗</span></button></div></div>}
    {showShare && <div className="modal-backdrop" onClick={() => setShowShare(false)}><div className="share-modal" onClick={(event) => event.stopPropagation()}><div className="share-card-preview"><span>STILL / 今日报告</span><strong>什么都没发生，<em>也很好。</em></strong><b>{formatMinutes(todayTotal)}</b><small>安静时间</small><i>·</i></div><div className="share-actions"><button className="primary-cta" onClick={downloadShareCard}>导出分享卡 <span>↗</span></button><button className="text-button" onClick={() => setShowShare(false)}>返回</button></div></div></div>}</main>
  );
}

function History({ sessions, heatmap }: { sessions: Session[]; heatmap: number[] }) {
  return <section className="subpage"><div className="subpage-intro"><p className="eyebrow">回看你的空白</p><h2>历史记录</h2><p>没有什么需要优化。只是偶尔看看，时间去了哪里。</p></div><div className="panel history-card"><div className="history-summary"><div><span className="eyebrow">累计安静时间</span><strong>{sessions.length ? formatMinutes(sessions.reduce((sum, item) => sum + item.duration, 0)) : "—"}</strong></div><div><span className="eyebrow">总段数</span><strong>{sessions.length || "—"}</strong></div></div><div className="history-list">{sessions.length ? sessions.slice(0, 8).map((session) => <div className="history-row" key={session.id}><span className="history-date">{new Date(session.startedAt).toLocaleDateString("zh-CN", { month: "short", day: "numeric" })}</span><span>{session.category}</span><strong>{formatDuration(session.duration)}</strong></div>) : <div className="empty-state"><span>○</span><p>还没有记录。<br />空白也从第一格开始。</p></div>}</div></div><div className="panel heat-panel wide"><div className="panel-heading"><div><p className="eyebrow">日历视图</p><h3>你的安静轨迹</h3></div><span className="heat-legend">少 <i /><i /><i /><i /> 多</span></div><div className="heatmap large">{heatmap.concat(heatmap).map((level, index) => <span key={index} className={`heat-${level}`} />)}</div></div></section>;
}

function Achievements({ sessions, todayTotal }: { sessions: Session[]; todayTotal: number }) {
  const items = [{ icon: "○", title: "第一段空白", desc: "完成第一次记录", done: sessions.length > 0 }, { icon: "◒", title: "不被打扰", desc: "累计安静 30 分钟", done: sessions.reduce((sum, s) => sum + s.duration, 0) >= 1800 || todayTotal >= 1800 }, { icon: "✦", title: "留白练习", desc: "在 3 个不同的日子记录", done: new Set(sessions.map((s) => new Date(s.startedAt).toDateString())).size >= 3 }, { icon: "∞", title: "没有终点", desc: "累计安静 10 小时", done: sessions.reduce((sum, s) => sum + s.duration, 0) >= 36000 }];
  return <section className="subpage"><div className="subpage-intro"><p className="eyebrow">不需要竞争的奖励</p><h2>成就</h2><p>有些事情，完成它本身就是意义。</p></div><div className="achievement-grid">{items.map((item) => <div className={`achievement ${item.done ? "done" : ""}`} key={item.title}><span className="achievement-icon">{item.icon}</span><div><h3>{item.title}</h3><p>{item.desc}</p></div><span className="check">{item.done ? "✓" : "—"}</span></div>)}</div></section>;
}

function Settings() {
  return <section className="subpage"><div className="subpage-intro"><p className="eyebrow">把它调成你的样子</p><h2>设置</h2><p>Still 默认安静。你可以让它更安静。</p></div><div className="panel settings-card"><div className="setting-row"><div><strong>轻触觉反馈</strong><span>开始和结束时轻轻提醒</span></div><button className="toggle on"><i /></button></div><div className="setting-row"><div><strong>每日提醒</strong><span>默认关闭，不主动打扰</span></div><button className="toggle"><i /></button></div><div className="setting-row"><div><strong>声音</strong><span>没有声音也可以</span></div><button className="toggle"><i /></button></div><div className="setting-row"><div><strong>数据同步</strong><span>Supabase 连接待配置</span></div><span className="pill">离线模式</span></div></div><p className="settings-footnote">Still 0.1 · Bundle ID capital.aurumcapital.still<br />你的记录存储在这台设备上。未来连接账户后可跨设备同步。</p></section>;
}




