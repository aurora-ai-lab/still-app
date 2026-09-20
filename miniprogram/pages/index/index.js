const categories = ["发呆", "散步", "看窗外", "喝水", "不知道"];

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return h > 0 ? `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

Page({
  data: {
    activeSince: null,
    elapsed: 0,
    todayTotal: 0,
    sessions: [],
    categories,
    selectedCategory: "发呆",
    showEnd: false,
    shareText: ""
  },

  onLoad() {
    const sessions = wx.getStorageSync("still-sessions") || [];
    const activeSince = wx.getStorageSync("still-active-since") || null;
    this.setData({ sessions, activeSince });
    this.recalculate();
    this.timer = setInterval(() => this.recalculate(), 1000);
  },

  onUnload() {
    clearInterval(this.timer);
  },

  recalculate() {
    const sessions = this.data.sessions || [];
    const today = new Date().toISOString().slice(0, 10);
    const saved = sessions.filter((item) => item.date === today).reduce((sum, item) => sum + item.duration, 0);
    const elapsed = this.data.activeSince ? Math.floor((Date.now() - this.data.activeSince) / 1000) : 0;
    this.setData({ elapsed, todayTotal: saved + elapsed });
  },

  start() {
    const activeSince = Date.now();
    wx.setStorageSync("still-active-since", activeSince);
    this.setData({ activeSince });
    wx.vibrateShort({ type: "light" });
  },

  stop() {
    this.setData({ showEnd: true });
  },

  chooseCategory(event) {
    this.setData({ selectedCategory: event.currentTarget.dataset.category });
  },

  finish() {
    if (!this.data.activeSince) return;
    const endedAt = Date.now();
    const duration = Math.floor((endedAt - this.data.activeSince) / 1000);
    const sessions = this.data.sessions.slice();
    if (duration >= 60) {
      sessions.unshift({
        id: `${endedAt}`,
        date: new Date(this.data.activeSince).toISOString().slice(0, 10),
        startedAt: this.data.activeSince,
        endedAt,
        duration,
        category: this.data.selectedCategory
      });
      wx.setStorageSync("still-sessions", sessions);
    }
    wx.removeStorageSync("still-active-since");
    this.setData({ activeSince: null, showEnd: false, sessions });
    wx.vibrateShort({ type: "light" });
    this.recalculate();
  },

  share() {
    const minutes = Math.floor(this.data.todayTotal / 60);
    this.setData({ shareText: `今日无事发生 ${minutes} 分钟。什么都没发生，也很好。` });
    wx.setClipboardData({ data: this.data.shareText });
  },

  noop() {}
});
