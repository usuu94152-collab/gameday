import { useState, useEffect, useCallback } from "react";

// ─── 기본 데이터 ──────────────────────────────────────────────────
const DEFAULT_ANCHORS = [
  { id: "anc_morning", time: "AM", timeLabel: "기상 직후", label: "물 500ml + 아침식사", color: "#f5a623", icon: "◐" },
  { id: "anc_workout", time: "PM", timeLabel: "운동 후 30분", label: "운동 완료 + 즉시 영양 섭취", color: "#00a699", icon: "●" },
  { id: "anc_sleep",   time: "PM", timeLabel: "취침 전",    label: "01:00 이전 취침", color: "#7c83fc", icon: "◉" },
];

const DEFAULT_DAILY = [
  { id: "d1",  label: "감사 & 그것진술",         emoji: "🧠" },
  { id: "d2",  label: "폼롤러 / 연조직 마사지",   emoji: "🔄" },
  { id: "d3",  label: "스트레칭 10분+",           emoji: "🤸" },
  { id: "d4",  label: "호흡법 10회 (6-4-10)",     emoji: "🌬" },
  { id: "d5",  label: "수분 충분히 (2L+)",        emoji: "💧" },
  { id: "d6",  label: "채소 & 균형 식단",         emoji: "🥗" },
  { id: "d7",  label: "알코올 없음",              emoji: "🚫" },
  { id: "d8",  label: "오메가3 · 보충제",         emoji: "💊" },
  { id: "d9",  label: "독서 or 학습",             emoji: "📖" },
  { id: "d10", label: "7시간+ 수면 (전날)",       emoji: "🌙" },
];

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

const KO_DAYS = ["일","월","화","수","목","금","토"];

function calcScore(checked, anchors, daily) {
  const anchorDone = anchors.filter(a => checked[a.id]).length;
  const dailyDone  = daily.filter(d => checked[d.id]).length;
  const anchorScore = Math.round((anchorDone / anchors.length) * 50);
  const dailyScore  = Math.round((dailyDone / daily.length) * 50);
  return anchorScore + dailyScore;
}

function grade(s) {
  if (s >= 95) return { label: "PERFECT DAY", color: "#ff385c" };
  if (s >= 80) return { label: "STRONG DAY",  color: "#00a699" };
  if (s >= 60) return { label: "SOLID DAY",   color: "#7c83fc" };
  if (s >= 40) return { label: "OKAY DAY",    color: "#f5a623" };
  return           { label: "REST & RESET",  color: "#b0b0b0" };
}

function dayGrade(s) {
  if (s === null || s === undefined) return { label: "NO DATA", color: "#f7f7f7", textColor: "#dddddd" };
  if (s >= 90) return { label: "PERFECT",  color: "#ff385c", textColor: "#ffffff" };
  if (s >= 70) return { label: "GOOD",     color: "#00a699", textColor: "#ffffff" };
  if (s >= 50) return { label: "NORMAL",   color: "#484848", textColor: "#ffffff" };
  return              { label: "BAD",      color: "#ffe8ed", textColor: "#ff385c" };
}

// ─── 월간 캘린더 리뷰 ─────────────────────────────────────────────
function ReviewView({ history }) {
  const now = new Date();
  const [viewYear,  setViewYear]  = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selected,  setSelected]  = useState(null);

  const scoreMap = {};
  for (const h of history) {
    const [y, m] = h.date.split("-").map(Number);
    if (y === viewYear && m === viewMonth + 1) scoreMap[h.date] = h.total;
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y-1); setViewMonth(11); }
    else setViewMonth(m => m-1);
    setSelected(null);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y+1); setViewMonth(0); }
    else setViewMonth(m => m+1);
    setSelected(null);
  }

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const monthScores = Object.values(scoreMap);
  const monthAvg = monthScores.length > 0
    ? Math.round(monthScores.reduce((a,b) => a+b, 0) / monthScores.length)
    : null;
  const perfect = monthScores.filter(s => s >= 90).length;
  const good    = monthScores.filter(s => s >= 70 && s < 90).length;
  const normal  = monthScores.filter(s => s >= 50 && s < 70).length;
  const bad     = monthScores.filter(s => s < 50).length;
  const recorded = monthScores.length;

  const selectedKey = selected
    ? `${viewYear}-${String(viewMonth+1).padStart(2,"0")}-${String(selected).padStart(2,"0")}`
    : null;
  const selectedScore = selectedKey ? scoreMap[selectedKey] : null;
  const todayStr = todayKey();
  const MONTH_NAMES = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];

  const S = {
    wrap: { padding: "0 0 40px", background: "#f7f7f7", minHeight: "100vh" },
    header: {
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "28px 22px 20px", background: "#ffffff",
      borderBottom: "1px solid #dddddd",
    },
    monthLabel: {
      fontSize: 20, fontWeight: 700, letterSpacing: 1, color: "#222222",
    },
    navBtn: {
      background: "#ffffff", border: "1px solid #dddddd",
      borderRadius: 9999, color: "#222222",
      fontSize: 14, padding: "8px 16px", cursor: "pointer",
      fontWeight: 500,
    },
    statsRow: {
      display: "grid", gridTemplateColumns: "1fr 1fr",
      gap: 8, padding: "16px 16px 12px",
    },
    statCard: {
      background: "#ffffff", border: "1px solid #dddddd",
      borderRadius: 14, padding: "16px 18px",
      boxShadow: "rgba(0,0,0,0.04) 0 2px 6px",
    },
    statNum: (color) => ({
      fontSize: 32, fontWeight: 700, color, lineHeight: 1,
    }),
    statLabel: {
      fontSize: 10, color: "#6a6a6a", letterSpacing: 1, marginTop: 4, fontWeight: 500,
    },
    legend: {
      display: "flex", gap: 10, padding: "0 16px 14px", flexWrap: "wrap",
    },
    legendDot: (color) => ({
      width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0,
    }),
    legendText: { fontSize: 10, color: "#6a6a6a", letterSpacing: 0.5 },
    calWrap: { padding: "0 16px", background: "#ffffff", margin: "0 0 8px", borderRadius: 14, border: "1px solid #dddddd", marginLeft: 16, marginRight: 16 },
    weekRow: {
      display: "grid", gridTemplateColumns: "repeat(7, 1fr)",
      gap: 3, padding: "14px 0 8px",
    },
    weekDay: {
      textAlign: "center", fontSize: 10, color: "#6a6a6a",
      letterSpacing: 0.5, fontWeight: 600,
    },
    calGrid: {
      display: "grid", gridTemplateColumns: "repeat(7, 1fr)",
      gap: 4, paddingBottom: 14,
    },
    dayCell: (score, isToday, isSelected) => {
      const dg = dayGrade(score);
      return {
        aspectRatio: "1",
        borderRadius: 9999,
        background: score !== undefined ? dg.color : "transparent",
        border: isSelected ? "2px solid #222222"
               : isToday   ? "2px solid #ff385c"
               : score !== undefined ? "none" : "none",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: score !== undefined ? "pointer" : "default",
        transition: "all 0.15s",
      };
    },
    dayNum: (score) => {
      const dg = dayGrade(score);
      return {
        fontSize: 11, fontWeight: score !== undefined ? 600 : 400,
        color: score !== undefined ? dg.textColor : "#dddddd",
      };
    },
    detailBox: {
      margin: "0 16px 12px",
      padding: "16px 20px",
      background: "#ffffff",
      border: "1px solid #dddddd",
      borderRadius: 14,
      display: "flex", alignItems: "center", gap: 16,
      boxShadow: "rgba(0,0,0,0.04) 0 2px 6px",
    },
    detailScore: (color) => ({
      fontSize: 40, fontWeight: 700, color, lineHeight: 1,
    }),
    detailLabel: (color) => ({
      fontSize: 14, fontWeight: 700, color, letterSpacing: 1,
    }),
    detailDate: { fontSize: 12, color: "#6a6a6a", marginTop: 4 },
  };

  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <button style={S.navBtn} onClick={prevMonth}>←</button>
        <div style={S.monthLabel}>{MONTH_NAMES[viewMonth]} {viewYear}</div>
        <button style={S.navBtn} onClick={nextMonth}>→</button>
      </div>

      <div style={S.statsRow}>
        <div style={S.statCard}>
          <div style={S.statNum(monthAvg !== null ? dayGrade(monthAvg).color : "#dddddd")}>
            {monthAvg ?? "—"}
          </div>
          <div style={S.statLabel}>MONTHLY AVG</div>
        </div>
        <div style={S.statCard}>
          <div style={S.statNum("#222222")}>{recorded}</div>
          <div style={S.statLabel}>DAYS RECORDED</div>
        </div>
      </div>

      <div style={S.legend}>
        {[
          { label: "PERFECT 90+", color: "#ff385c" },
          { label: "GOOD 70+",    color: "#00a699" },
          { label: "NORMAL 50+",  color: "#484848" },
          { label: "BAD ~49",     color: "#ffe8ed" },
        ].map(({ label, color }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={S.legendDot(color)} />
            <span style={S.legendText}>{label}</span>
          </div>
        ))}
      </div>

      <div style={S.calWrap}>
        <div style={S.weekRow}>
          {["SUN","MON","TUE","WED","THU","FRI","SAT"].map(d => (
            <div key={d} style={S.weekDay}>{d}</div>
          ))}
        </div>
        <div style={S.calGrid}>
          {cells.map((day, i) => {
            if (!day) return <div key={`empty-${i}`} />;
            const key = `${viewYear}-${String(viewMonth+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
            const score = scoreMap[key];
            const isToday = key === todayStr;
            const isSelected = selected === day;
            return (
              <div
                key={key}
                style={S.dayCell(score, isToday, isSelected)}
                onClick={() => score !== undefined && setSelected(isSelected ? null : day)}
              >
                <span style={S.dayNum(score)}>{day}</span>
              </div>
            );
          })}
        </div>
      </div>

      {selected && selectedScore !== undefined && (
        <div style={S.detailBox}>
          <div style={S.detailScore(dayGrade(selectedScore).color)}>{selectedScore}</div>
          <div>
            <div style={S.detailLabel(dayGrade(selectedScore).color)}>
              {dayGrade(selectedScore).label} DAY
            </div>
            <div style={S.detailDate}>
              {viewYear}년 {viewMonth+1}월 {selected}일
              {" "}({KO_DAYS[new Date(viewYear, viewMonth, selected).getDay()]}요일)
            </div>
          </div>
        </div>
      )}

      {recorded > 0 && (
        <div style={{ padding: "0 16px" }}>
          <div style={{
            background: "#ffffff", border: "1px solid #dddddd",
            borderRadius: 14, padding: "16px 18px",
          }}>
            <div style={{ fontSize: 10, color: "#6a6a6a", letterSpacing: 1, marginBottom: 10, fontWeight: 600 }}>
              THIS MONTH
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {[
                { count: perfect, color: "#ff385c", label: "PERFECT" },
                { count: good,    color: "#00a699", label: "GOOD" },
                { count: normal,  color: "#484848", label: "NORMAL" },
                { count: bad,     color: "#ffe8ed", label: "BAD" },
              ].map(({ count, color, label }) => count > 0 && (
                <div key={label} style={{
                  flex: count, background: color, borderRadius: 6,
                  padding: "8px 0", textAlign: "center",
                  transition: "flex 0.4s ease",
                }}>
                  <div style={{
                    fontSize: 13, fontWeight: 700,
                    color: label === "BAD" ? "#ff385c" : "#ffffff",
                  }}>
                    {count}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 4, marginTop: 5 }}>
              {[
                { count: perfect, label: "PERFECT" },
                { count: good,    label: "GOOD" },
                { count: normal,  label: "NORMAL" },
                { count: bad,     label: "BAD" },
              ].map(({ count, label }) => count > 0 && (
                <div key={label} style={{ flex: count, textAlign: "center", fontSize: 9, color: "#9b9b9b" }}>
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 편집 모달 ────────────────────────────────────────────────────
function EditModal({ anchors, daily, onClose, onSave }) {
  const [editAnchors, setEditAnchors] = useState(anchors.map(a => ({ ...a })));
  const [editDaily,   setEditDaily]   = useState(daily.map(d => ({ ...d })));
  const [tab, setTab] = useState("anchor");
  const [newLabel, setNewLabel] = useState("");
  const [newEmoji, setNewEmoji] = useState("⭐");

  function updateAnchorLabel(id, val) {
    setEditAnchors(prev => prev.map(a => a.id === id ? { ...a, label: val } : a));
  }
  function updateAnchorTime(id, val) {
    setEditAnchors(prev => prev.map(a => a.id === id ? { ...a, timeLabel: val } : a));
  }
  function updateDailyLabel(id, val) {
    setEditDaily(prev => prev.map(d => d.id === id ? { ...d, label: val } : d));
  }
  function removeDaily(id) {
    setEditDaily(prev => prev.filter(d => d.id !== id));
  }
  function addDaily() {
    if (!newLabel.trim()) return;
    setEditDaily(prev => [...prev, { id: `custom_${Date.now()}`, label: newLabel.trim(), emoji: newEmoji }]);
    setNewLabel("");
  }

  const S = {
    overlay: {
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
      zIndex: 1000, display: "flex", alignItems: "flex-end",
    },
    sheet: {
      width: "100%", background: "#ffffff",
      borderRadius: "20px 20px 0 0",
      border: "1px solid #dddddd",
      borderBottom: "none",
      maxHeight: "80vh", display: "flex", flexDirection: "column",
      boxShadow: "rgba(0,0,0,0.1) 0 -4px 20px",
    },
    handle: {
      width: 36, height: 4, background: "#dddddd", borderRadius: 2,
      margin: "12px auto 0",
    },
    header: {
      padding: "16px 20px 0",
      display: "flex", justifyContent: "space-between", alignItems: "center",
    },
    title: { fontSize: 18, color: "#222222", fontWeight: 700 },
    tabs: { display: "flex", gap: 0, margin: "14px 20px 0", borderBottom: "1px solid #dddddd" },
    tab: (active) => ({
      padding: "10px 16px", fontSize: 13, fontWeight: 600,
      color: active ? "#ff385c" : "#6a6a6a",
      borderBottom: active ? "2px solid #ff385c" : "2px solid transparent",
      background: "none", border: "none", cursor: "pointer",
    }),
    body: { overflowY: "auto", padding: "16px 20px", flex: 1 },
    row: {
      display: "flex", alignItems: "center", gap: 8,
      padding: "10px 12px", marginBottom: 6,
      background: "#f7f7f7", borderRadius: 10,
      border: "1px solid #ebebeb",
    },
    inp: {
      flex: 1, background: "none", border: "none",
      color: "#222222", fontSize: 13, outline: "none",
    },
    smallInp: {
      width: 80, background: "none", border: "none",
      color: "#6a6a6a", fontSize: 11, outline: "none",
    },
    removeBtn: { background: "none", border: "none", color: "#b0b0b0", cursor: "pointer", fontSize: 16 },
    addRow: { display: "flex", gap: 8, marginTop: 12, alignItems: "center" },
    addInp: {
      flex: 1, background: "#f7f7f7", border: "1px solid #dddddd",
      borderRadius: 9999, color: "#222222", fontSize: 13,
      padding: "10px 16px", outline: "none",
    },
    emojiInp: {
      width: 44, background: "#f7f7f7", border: "1px solid #dddddd",
      borderRadius: 9999, color: "#222222", fontSize: 18,
      textAlign: "center", padding: "8px 4px", outline: "none",
    },
    addBtn: {
      background: "#ff385c", border: "none", borderRadius: 9999,
      color: "#ffffff", fontWeight: 600,
      fontSize: 13, padding: "10px 20px", cursor: "pointer",
    },
    footer: { padding: "12px 20px 32px", display: "flex", gap: 8 },
    cancelBtn: {
      flex: 1, background: "#ffffff", border: "1px solid #dddddd",
      borderRadius: 9999, color: "#222222", fontSize: 14, fontWeight: 500,
      padding: "14px", cursor: "pointer",
    },
    saveBtn: {
      flex: 2, background: "#ff385c", border: "none",
      borderRadius: 9999, color: "#ffffff", fontWeight: 600,
      fontSize: 16, padding: "14px", cursor: "pointer",
    },
    hintText: { fontSize: 11, color: "#9b9b9b", marginBottom: 14, lineHeight: 1.5 },
  };

  return (
    <div style={S.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={S.sheet}>
        <div style={S.handle} />
        <div style={S.header}>
          <div style={S.title}>항목 편집</div>
          <button onClick={onClose} style={{ ...S.removeBtn, fontSize: 20 }}>✕</button>
        </div>
        <div style={S.tabs}>
          <button style={S.tab(tab === "anchor")} onClick={() => setTab("anchor")}>앵커 (3)</button>
          <button style={S.tab(tab === "daily")}  onClick={() => setTab("daily")}>데일리 목록</button>
        </div>
        <div style={S.body}>
          {tab === "anchor" && (
            <>
              <div style={S.hintText}>시간이 중요한 3개 항목. 텍스트만 수정 가능해.</div>
              {editAnchors.map(a => (
                <div key={a.id} style={{ ...S.row, borderLeft: `3px solid ${a.color}` }}>
                  <span style={{ fontSize: 16, width: 22 }}>{a.icon}</span>
                  <div style={{ flex: 1 }}>
                    <input value={a.label} onChange={e => updateAnchorLabel(a.id, e.target.value)} style={S.inp} />
                    <input value={a.timeLabel} onChange={e => updateAnchorTime(a.id, e.target.value)}
                      style={{ ...S.smallInp, display: "block", marginTop: 3 }} placeholder="타이밍" />
                  </div>
                </div>
              ))}
            </>
          )}
          {tab === "daily" && (
            <>
              <div style={S.hintText}>언제 해도 되는 항목들. 자유롭게 추가·삭제.</div>
              {editDaily.map(d => (
                <div key={d.id} style={S.row}>
                  <span style={{ fontSize: 16, width: 26 }}>{d.emoji}</span>
                  <input value={d.label} onChange={e => updateDailyLabel(d.id, e.target.value)} style={S.inp} />
                  <button onClick={() => removeDaily(d.id)} style={S.removeBtn}>✕</button>
                </div>
              ))}
              <div style={S.addRow}>
                <input value={newEmoji} onChange={e => setNewEmoji(e.target.value)} style={S.emojiInp} placeholder="😀" />
                <input value={newLabel} onChange={e => setNewLabel(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addDaily()}
                  style={S.addInp} placeholder="새 항목 입력..." />
                <button onClick={addDaily} style={S.addBtn}>추가</button>
              </div>
            </>
          )}
        </div>
        <div style={S.footer}>
          <button onClick={onClose} style={S.cancelBtn}>취소</button>
          <button onClick={() => onSave(editAnchors, editDaily)} style={S.saveBtn}>저장</button>
        </div>
      </div>
    </div>
  );
}

// ─── 메인 앱 ─────────────────────────────────────────────────────
export default function App() {
  const today = todayKey();
  const [anchors, setAnchors] = useState(DEFAULT_ANCHORS);
  const [daily,   setDaily]   = useState(DEFAULT_DAILY);
  const [checked, setChecked] = useState({});
  const [history, setHistory] = useState([]);
  const [loaded,  setLoaded]  = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [tab, setTab] = useState("today");

  useEffect(() => {
    async function load() {
      try { const r = await window.storage.get("simple:anchors"); if (r) setAnchors(JSON.parse(r.value)); } catch {}
      try { const r = await window.storage.get("simple:daily");   if (r) setDaily(JSON.parse(r.value)); }   catch {}
      try { const r = await window.storage.get(`simple:checked:${today}`); if (r) setChecked(JSON.parse(r.value)); } catch {}
      try { const r = await window.storage.get("simple:history"); if (r) setHistory(JSON.parse(r.value)); } catch {}
      setTimeout(() => setLoaded(true), 80);
    }
    load();
  }, []);

  async function persist(newChecked, newAnchors = anchors, newDaily = daily) {
    try {
      await window.storage.set(`simple:checked:${today}`, JSON.stringify(newChecked));
      const total = calcScore(newChecked, newAnchors, newDaily);
      const hist = [...history.filter(h => h.date !== today), { date: today, total }]
        .sort((a,b) => a.date.localeCompare(b.date));
      setHistory(hist);
      await window.storage.set("simple:history", JSON.stringify(hist));
    } catch {}
  }

  function toggle(id) {
    const next = { ...checked, [id]: !checked[id] };
    setChecked(next);
    persist(next);
  }

  function handleSave(newAnchors, newDaily) {
    setAnchors(newAnchors);
    setDaily(newDaily);
    setShowEdit(false);
    try {
      window.storage.set("simple:anchors", JSON.stringify(newAnchors));
      window.storage.set("simple:daily",   JSON.stringify(newDaily));
    } catch {}
    persist(checked, newAnchors, newDaily);
  }

  const score = calcScore(checked, anchors, daily);
  const g = grade(score);
  const anchorDone = anchors.filter(a => checked[a.id]).length;
  const dailyDone  = daily.filter(d => checked[d.id]).length;

  const avg7 = history.length > 0
    ? Math.round(history.slice(-7).reduce((a,h) => a+h.total, 0) / Math.min(history.length, 7))
    : null;
  const streak = (() => {
    const sorted = [...history].sort((a,b) => b.date.localeCompare(a.date));
    let s = 0;
    for (const h of sorted) { if (h.total >= 40) s++; else break; }
    return s;
  })();

  const todayLabel = (() => {
    const [y,m,d] = today.split("-").map(Number);
    return `${m}월 ${d}일 ${KO_DAYS[new Date(y,m-1,d).getDay()]}요일`;
  })();

  const font = "'Airbnb Cereal VF', Circular, Inter, -apple-system, system-ui, sans-serif";

  const S = {
    app: {
      minHeight: "100vh",
      background: "#f7f7f7",
      color: "#222222",
      fontFamily: font,
      paddingBottom: 72,
      maxWidth: 480,
      margin: "0 auto",
    },

    // 상단 헤더
    topBar: {
      background: "#ffffff",
      borderBottom: "1px solid #ebebeb",
      padding: "24px 20px 20px",
      display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    },
    dateText: { fontSize: 12, color: "#6a6a6a", letterSpacing: 0.3, marginBottom: 2 },
    dayTitle: {
      fontSize: 22, fontWeight: 700,
      color: "#222222", lineHeight: 1.2,
    },
    editBtn: {
      background: "#ffffff", border: "1px solid #dddddd",
      borderRadius: 9999, color: "#222222",
      fontSize: 12, fontWeight: 500,
      padding: "8px 16px", cursor: "pointer",
      marginTop: 2,
    },

    // 스코어 카드
    scoreCard: {
      margin: "16px 16px 0",
      padding: "20px",
      background: "#ffffff",
      border: "1px solid #ebebeb",
      borderRadius: 14,
      display: "flex", alignItems: "center", gap: 16,
      boxShadow: "rgba(0,0,0,0.02) 0 0 0 1px, rgba(0,0,0,0.04) 0 2px 6px, rgba(0,0,0,0.08) 0 4px 8px",
    },
    bigScore: {
      fontSize: 52, lineHeight: 1, fontWeight: 700,
      color: g.color,
      transition: "color 0.3s",
    },
    scoreRight: { flex: 1 },
    gradeLabel: {
      fontSize: 13, fontWeight: 700, letterSpacing: 1,
      color: g.color, lineHeight: 1,
    },
    progressTrack: {
      height: 4, background: "#f2f2f2",
      borderRadius: 9999, marginTop: 8, overflow: "hidden",
    },
    progressFill: {
      height: "100%", background: g.color,
      borderRadius: 9999,
      width: `${score}%`,
      transition: "width 0.6s ease, background 0.3s",
    },
    miniStats: { display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" },
    miniStat: (color) => ({
      fontSize: 11, color, fontWeight: 500,
    }),
    dot: { fontSize: 11, color: "#dddddd" },

    // 히스토리 바
    histBar: {
      display: "flex", gap: 4, alignItems: "flex-end",
      padding: "14px 16px 0",
    },

    // 섹션 라벨
    sectionLabel: {
      fontSize: 11, color: "#6a6a6a", fontWeight: 600, letterSpacing: 0.5,
      padding: "20px 20px 10px",
      display: "flex", justifyContent: "space-between", alignItems: "center",
    },

    // 앵커 카드
    anchorGrid: {
      display: "flex", flexDirection: "column", gap: 8,
      padding: "0 16px",
    },
    anchorCard: (color, done) => ({
      display: "flex", alignItems: "center", gap: 14,
      padding: "16px 18px",
      background: done ? color + "0f" : "#ffffff",
      border: `1px solid ${done ? color + "40" : "#ebebeb"}`,
      borderRadius: 14, cursor: "pointer",
      transition: "all 0.2s",
      boxShadow: done ? "none" : "rgba(0,0,0,0.02) 0 1px 4px",
    }),
    anchorIconWrap: (color, done) => ({
      width: 38, height: 38,
      background: done ? color : "#f7f7f7",
      borderRadius: 10,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 16, transition: "all 0.2s", flexShrink: 0,
    }),
    anchorTime: (color, done) => ({
      fontSize: 10, color: done ? color : "#9b9b9b",
      fontWeight: 600, letterSpacing: 0.3, marginBottom: 3,
    }),
    anchorLabel: (done) => ({
      fontSize: 13, fontWeight: 500,
      color: done ? "#222222" : "#6a6a6a",
      transition: "color 0.2s",
    }),
    checkCircle: (color, done) => ({
      width: 22, height: 22, borderRadius: "50%",
      border: done ? `2px solid ${color}` : "2px solid #dddddd",
      background: done ? color : "transparent",
      display: "flex", alignItems: "center", justifyContent: "center",
      transition: "all 0.2s", flexShrink: 0,
    }),

    // 데일리 그리드
    dailyGrid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 8, padding: "0 16px",
    },
    dailyItem: (done) => ({
      display: "flex", alignItems: "center", gap: 8,
      padding: "13px 14px",
      background: done ? "#fff5f7" : "#ffffff",
      border: `1px solid ${done ? "#ff385c30" : "#ebebeb"}`,
      borderRadius: 12, cursor: "pointer",
      transition: "all 0.15s",
      boxShadow: done ? "none" : "rgba(0,0,0,0.02) 0 1px 3px",
    }),
    dailyEmoji: { fontSize: 16, flexShrink: 0 },
    dailyLabel: (done) => ({
      fontSize: 11, fontWeight: 500,
      color: done ? "#ff385c" : "#6a6a6a",
      lineHeight: 1.3, transition: "color 0.15s", flex: 1,
    }),
    dailyCheck: (done) => ({
      marginLeft: "auto", width: 16, height: 16,
      borderRadius: 4,
      border: done ? "2px solid #ff385c" : "2px solid #dddddd",
      background: done ? "#ff385c" : "transparent",
      flexShrink: 0, transition: "all 0.15s",
      display: "flex", alignItems: "center", justifyContent: "center",
    }),

    // 하단 인용
    quote: {
      margin: "20px 16px 0",
      padding: "16px 18px",
      background: "#ffffff",
      borderRadius: 14,
      borderLeft: "3px solid #ff385c",
      border: "1px solid #ebebeb",
      borderLeftColor: "#ff385c",
      borderLeftWidth: 3,
    },
    quoteText: { fontSize: 13, color: "#3f3f3f", lineHeight: 1.8 },
    quoteBy: { fontSize: 11, color: "#9b9b9b", marginTop: 8 },
  };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {showEdit && (
        <EditModal
          anchors={anchors} daily={daily}
          onClose={() => setShowEdit(false)}
          onSave={handleSave}
        />
      )}

      <div style={S.app}>

        {/* 상단 헤더 */}
        <div style={S.topBar}>
          <div>
            <div style={S.dateText}>{todayLabel}</div>
            <div style={S.dayTitle}>Everyday is Game Day</div>
          </div>
          {tab === "today" && (
            <button style={S.editBtn} onClick={() => setShowEdit(true)}>편집</button>
          )}
        </div>

        {/* ── TODAY 탭 ── */}
        {tab === "today" && (
          <>
            {/* 스코어 카드 */}
            <div style={{
              ...S.scoreCard,
              opacity: loaded ? 1 : 0,
              transform: loaded ? "translateY(0)" : "translateY(12px)",
              transition: "all 0.5s ease, border-color 0.3s",
            }}>
              <div style={S.bigScore}>{score}</div>
              <div style={S.scoreRight}>
                <div style={S.gradeLabel}>{g.label}</div>
                <div style={S.progressTrack}>
                  <div style={S.progressFill} />
                </div>
                <div style={S.miniStats}>
                  <span style={S.miniStat(g.color)}>앵커 {anchorDone}/{anchors.length}</span>
                  <span style={S.dot}>·</span>
                  <span style={S.miniStat("#00a699")}>데일리 {dailyDone}/{daily.length}</span>
                  {streak > 0 && (
                    <>
                      <span style={S.dot}>·</span>
                      <span style={S.miniStat("#f5a623")}>🔥 {streak}일 연속</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* 히스토리 바 */}
            {history.length > 1 && (
              <div style={S.histBar}>
                {history.slice(-10).map((h) => {
                  const hg = grade(h.total);
                  const isToday = h.date === today;
                  return (
                    <div key={h.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <div style={{
                        width: "100%",
                        height: `${Math.max(h.total * 0.28, 3)}px`,
                        background: hg.color,
                        borderRadius: "3px 3px 0 0",
                        opacity: isToday ? 1 : 0.25,
                      }} />
                    </div>
                  );
                })}
              </div>
            )}

            {/* ANCHOR 섹션 */}
            <div style={S.sectionLabel}>
              <span>타이밍이 중요한 앵커</span>
              <span style={{ color: g.color, fontWeight: 700 }}>{anchorDone} / 3</span>
            </div>
            <div style={S.anchorGrid}>
              {anchors.map((anc, i) => {
                const done = !!checked[anc.id];
                return (
                  <div key={anc.id} style={{
                    ...S.anchorCard(anc.color, done),
                    opacity: loaded ? 1 : 0,
                    transform: loaded ? "translateY(0)" : "translateY(10px)",
                    transition: `all 0.2s, opacity 0.4s ease ${i * 0.08}s, transform 0.4s ease ${i * 0.08}s`,
                  }} onClick={() => toggle(anc.id)}>
                    <div style={S.anchorIconWrap(anc.color, done)}>
                      <span style={{ color: done ? "#ffffff" : anc.color, fontSize: 16 }}>{anc.icon}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={S.anchorTime(anc.color, done)}>{anc.timeLabel}</div>
                      <div style={S.anchorLabel(done)}>{anc.label}</div>
                    </div>
                    <div style={S.checkCircle(anc.color, done)}>
                      {done && (
                        <svg width="10" height="8" viewBox="0 0 10 8">
                          <path d="M1 4l3 3 5-6" stroke="#ffffff" strokeWidth="2" fill="none"
                            strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* DAILY 섹션 */}
            <div style={S.sectionLabel}>
              <span>오늘 중 하면 되는 것들</span>
              <span style={{ color: "#ff385c", fontWeight: 700 }}>{dailyDone} / {daily.length}</span>
            </div>
            <div style={S.dailyGrid}>
              {daily.map((item, i) => {
                const done = !!checked[item.id];
                return (
                  <div key={item.id} style={{
                    ...S.dailyItem(done),
                    opacity: loaded ? 1 : 0,
                    transition: `all 0.15s, opacity 0.4s ease ${i * 0.04}s`,
                  }} onClick={() => toggle(item.id)}>
                    <span style={S.dailyEmoji}>{item.emoji}</span>
                    <span style={S.dailyLabel(done)}>{item.label}</span>
                    <div style={S.dailyCheck(done)}>
                      {done && (
                        <svg width="8" height="6" viewBox="0 0 8 6">
                          <path d="M1 3l2 2 4-4" stroke="#ffffff" strokeWidth="1.5" fill="none"
                            strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 하단 인용 */}
            <div style={S.quote}>
              <div style={S.quoteText}>
                내일의 성공은 오늘의 성공 없이 불가능하다.<br />
                이제 하루가 지났고 364일이 남았다.
              </div>
              <div style={S.quoteBy}>— EXOS</div>
            </div>
          </>
        )}

        {/* ── REVIEW 탭 ── */}
        {tab === "review" && <ReviewView history={history} />}

        {/* 하단 탭바 */}
        <div style={{
          position: "fixed", bottom: 0, left: "50%",
          transform: "translateX(-50%)",
          width: "100%", maxWidth: 480,
          background: "#ffffff",
          borderTop: "1px solid #ebebeb",
          display: "flex", zIndex: 100,
        }}>
          {[
            { id: "today",  icon: "◉", label: "오늘" },
            { id: "review", icon: "▦", label: "리뷰" },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex: 1, padding: "14px 0 18px",
              background: "none", border: "none", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
            }}>
              <span style={{
                fontSize: 18,
                color: tab === t.id ? "#ff385c" : "#dddddd",
                transition: "color 0.2s",
              }}>
                {t.icon}
              </span>
              <span style={{
                fontSize: 10, fontWeight: 600, letterSpacing: 0.3,
                color: tab === t.id ? "#ff385c" : "#9b9b9b",
                transition: "color 0.2s",
              }}>{t.label}</span>
            </button>
          ))}
        </div>

      </div>
    </>
  );
}
