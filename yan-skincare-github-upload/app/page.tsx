"use client";

import { useEffect, useMemo, useState } from "react";

type Item = { id: number; name: string; type: string; color: string; repeat: boolean; createdAt: string };
type Entry = { id: number; itemId: number; date: string; feeling: string };
type View = "home" | "trend" | "calendar" | "settings";

const seedItems: Item[] = [
  { id: 1, name: "舒缓修护面膜", type: "面膜", color: "#9ca4a1", repeat: true, createdAt: "2026-07-01" },
  { id: 2, name: "果酸清洁泥膜", type: "清洁", color: "#eb8c55", repeat: true, createdAt: "2026-07-01" },
  { id: 3, name: "新精华试用", type: "精华", color: "#b99bc6", repeat: false, createdAt: "2026-07-18" },
];
const seedEntries: Entry[] = [
  { id: 1, itemId: 1, date: "2026-07-19", feeling: "很温和，脸颊没有泛红。" },
  { id: 2, itemId: 2, date: "2026-07-21", feeling: "T 区清洁得很干净，下次缩短两分钟。" },
  { id: 3, itemId: 3, date: "2026-07-18", feeling: "吸收快，第一次使用感受不错。" },
];

const pad = (n: number) => String(n).padStart(2, "0");
const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = toISO(new Date());
const demoToday = today.startsWith("2026-07") ? today : "2026-07-22";

export default function Home() {
  const [view, setView] = useState<View>("home");
  const [items, setItems] = useState<Item[]>(seedItems);
  const [entries, setEntries] = useState<Entry[]>(seedEntries);
  const [type, setType] = useState("全部");
  const [modal, setModal] = useState<"item" | "record" | null>(null);
  const [active, setActive] = useState<Item | null>(null);
  const [month, setMonth] = useState(new Date(2026, 6, 1));
  const [selectedDate, setSelectedDate] = useState(demoToday);
  const [period, setPeriod] = useState<"week" | "month" | "year">("month");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("yan-skincare-v1");
      if (saved) { const data = JSON.parse(saved); setItems(data.items); setEntries(data.entries); }
    } catch {}
  }, []);
  useEffect(() => { localStorage.setItem("yan-skincare-v1", JSON.stringify({ items, entries })); }, [items, entries]);

  const types = ["全部", ...Array.from(new Set(items.map(i => i.type)))];
  const visible = type === "全部" ? items : items.filter(i => i.type === type);
  const dateEntries = entries.filter(e => e.date === selectedDate);

  function saveItem(form: FormData) {
    const name = String(form.get("name") || "").trim();
    if (!name) return;
    const newItem: Item = { id: Date.now(), name, type: String(form.get("type") || "其他"), color: String(form.get("color")), repeat: form.get("repeat") === "on", createdAt: demoToday };
    setItems(v => [newItem, ...v]); setModal(null);
  }
  function saveRecord(form: FormData) {
    if (!active) return;
    const date = String(form.get("date"));
    setEntries(v => [{ id: Date.now(), itemId: active.id, date, feeling: String(form.get("feeling") || "") }, ...v]);
    if (!active.repeat) setItems(v => v.filter(i => i.id !== active.id));
    setModal(null); setSelectedDate(date);
  }
  function openRecord(item: Item) { setActive(item); setModal("record"); }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button className="brand" onClick={() => setView("home")} aria-label="颜首页"><span>颜</span><small>YAN</small></button>
        <nav>{navItems.map(n => <NavButton key={n.id} {...n} active={view === n.id} onClick={() => setView(n.id as View)} />)}</nav>
      </aside>

      <main>
        <header className="topbar">
          <div><h1>{viewTitle[view]}</h1></div>
          <button className="add-button" onClick={() => setModal("item")}><span>+</span> 新建护肤</button>
        </header>

        {view === "home" && <section>
          <div className="section-row"><div className="chips">{types.map(t => <button key={t} className={type === t ? "active" : ""} onClick={() => setType(t)}>{t}</button>)}</div><span className="subtle">{visible.length} 个项目</span></div>
          <div className="card-grid">{visible.map(item => {
            const last = entries.filter(e => e.itemId === item.id).sort((a,b) => b.date.localeCompare(a.date))[0];
            const done = entries.some(e => e.itemId === item.id && e.date === demoToday);
            return <article className="care-card" key={item.id}>
              <div className="card-top"><span className="care-icon" style={{ background: `${item.color}22`, color: item.color }}>✿</span><span className={`repeat-tag ${item.repeat ? "" : "once"}`}>{item.repeat ? "重复" : "单次"}</span></div>
              <div><span className="type-label" style={{ color: item.color }}>{item.type}</span><h3>{item.name}</h3><p>{last ? `上次 · ${last.date.slice(5).replace("-", ".")}` : "还没有记录"}</p></div>
              <button className={`record-button ${done ? "done" : ""}`} onClick={() => openRecord(item)}>{done ? "已记录 · 再添一次" : "记录今天"}<span>↗</span></button>
            </article>;
          })}</div>
        </section>}

        {view === "trend" && <Trend items={items} entries={entries} period={period} setPeriod={setPeriod} />}
        {view === "calendar" && <Calendar month={month} setMonth={setMonth} items={items} entries={entries} selectedDate={selectedDate} setSelectedDate={setSelectedDate} dateEntries={dateEntries} openRecord={openRecord} />}
        {view === "settings" && <Settings />}
      </main>

      <nav className="mobile-nav">{navItems.map(n => <NavButton key={n.id} {...n} active={view === n.id} onClick={() => setView(n.id as View)} />)}<button onClick={() => setModal("item")}><span>＋</span><small>新建</small></button></nav>

      {modal && <div className="modal-backdrop" onMouseDown={() => setModal(null)}><div className="modal" onMouseDown={e => e.stopPropagation()}>
        <div className="modal-head"><div><span className="eyebrow">{modal === "item" ? "NEW ROUTINE" : "SKIN NOTE"}</span><h2>{modal === "item" ? "新建护肤" : `记录·${active?.name}`}</h2></div><button onClick={() => setModal(null)}>×</button></div>
        {modal === "item" ? <form action={saveItem}>
          <label>护肤名称<input name="name" placeholder="例如：晚间视黄醇" autoFocus /></label>
          <div className="form-row"><label>类型<input name="type" placeholder="面膜 / 精华 / 清洁" /></label><label>标记颜色<input name="color" type="color" defaultValue="#c78f77" /></label></div>
          <label className="toggle-row"><span><strong>定期重复</strong><small>关闭后，完成一次即作为单次记录</small></span><input name="repeat" type="checkbox" defaultChecked /></label>
          <button className="primary" type="submit">保存护肤项目</button>
        </form> : <form action={saveRecord}>
          <label>使用日期<input name="date" type="date" defaultValue={selectedDate || demoToday} /></label>
          <label>使用感受<textarea name="feeling" rows={5} placeholder="记录质地、吸收、刺激感或肌肤变化…" /></label>
          <p className="form-tip">{active?.repeat ? "保存后会留在护肤列表，方便下次继续记录。" : "这是单次护肤，保存后将从待记录列表移除。"}</p>
          <button className="primary" type="submit">保存这次感受</button>
        </form>}
      </div></div>}
    </div>
  );
}

const navItems = [{id:"home", icon:"⌂", label:"首页"},{id:"trend", icon:"↗", label:"趋势"},{id:"calendar", icon:"▦", label:"日历"},{id:"settings", icon:"✳", label:"设置"}];
const viewTitle: Record<View,string> = { home: "今日护肤", trend: "趋势回顾", calendar: "护肤日历", settings: "设置" };
function NavButton({icon,label,active,onClick}:{icon:string,label:string,active:boolean,onClick:()=>void}) { return <button className={active ? "active" : ""} onClick={onClick}><span>{icon}</span><small>{label}</small></button> }

function Trend({items, entries, period, setPeriod}:{items:Item[],entries:Entry[],period:string,setPeriod:(p:"week"|"month"|"year")=>void}) {
  const days = period === "week" ? 7 : period === "month" ? 31 : 12;
  return <section>
    <div className="stats"><div><strong>{items.length}</strong><span>护肤项目</span></div><div><strong>{entries.length}</strong><span>记录次数</span></div><div><strong>{new Set(entries.map(e=>e.date)).size}</strong><span>记录天数</span></div><div><strong>{Math.round(entries.length / Math.max(items.length,1) * 10) / 10}</strong><span>平均次数</span></div></div>
    <div className="trend-head"><div className="segmented">{[["week","周"],["month","月"],["year","年"]].map(([p,l])=><button key={p} className={period===p?"active":""} onClick={()=>setPeriod(p as "week"|"month"|"year")}>{l}</button>)}</div><span className="subtle">2026 年 07 月</span></div>
    <div className="trend-list">{items.map(item=><article key={item.id} className="trend-card"><div className="trend-label"><span className="care-icon" style={{background:`${item.color}22`,color:item.color}}>✿</span><div><h3>{item.name}</h3><p>{entries.filter(e=>e.itemId===item.id).length} 次记录</p></div></div><div className={`heatmap ${period}`}>{Array.from({length:days},(_,i)=>{const hit=entries.some(e=>e.itemId===item.id && (period!=="month" || Number(e.date.slice(-2))===i+1));return <i key={i} className={hit?"hit":""} style={hit?{background:item.color}:{}} title={`${i+1}`} />})}</div></article>)}</div>
  </section>
}

function Calendar({month,setMonth,items,entries,selectedDate,setSelectedDate,dateEntries,openRecord}:{month:Date,setMonth:(d:Date)=>void,items:Item[],entries:Entry[],selectedDate:string,setSelectedDate:(d:string)=>void,dateEntries:Entry[],openRecord:(i:Item)=>void}) {
  const year=month.getFullYear(), m=month.getMonth(), start=new Date(year,m,1).getDay(), count=new Date(year,m+1,0).getDate();
  const cells=Array.from({length:42},(_,i)=>{const day=i-start+1; return day>0&&day<=count?day:null});
  return <section className="calendar-layout"><div className="calendar-panel"><div className="calendar-head"><button onClick={()=>setMonth(new Date(year,m-1,1))}>‹</button><h2>{year} 年 {pad(m+1)} 月</h2><button onClick={()=>setMonth(new Date(year,m+1,1))}>›</button></div><div className="weekdays">{["日","一","二","三","四","五","六"].map(d=><span key={d}>{d}</span>)}</div><div className="calendar-grid">{cells.map((day,i)=>{const iso=day?`${year}-${pad(m+1)}-${pad(day)}`:"";const hits=entries.filter(e=>e.date===iso);return <button key={i} disabled={!day} className={selectedDate===iso?"selected":""} onClick={()=>day&&setSelectedDate(iso)}>{day&&<><span>{day}</span><em>{hits.slice(0,3).map(h=>{const item=items.find(x=>x.id===h.itemId);return <i key={h.id} style={{background:item?.color}}/>})}</em></>}</button>})}</div></div>
    <aside className="day-panel"><span className="eyebrow">SELECTED DAY</span><h2>{selectedDate.slice(5).replace("-", " 月 ")} 日</h2>{dateEntries.length?dateEntries.map(e=>{const item=items.find(i=>i.id===e.itemId);return <div className="day-entry" key={e.id}><i style={{background:item?.color}}/><div><strong>{item?.name || "已完成的单次护肤"}</strong><p>{e.feeling||"未填写使用感受"}</p></div></div>}):<div className="empty-day"><span>☾</span><p>这天还没有护肤记录</p></div>}<button className="outline" onClick={()=>items[0]&&openRecord(items[0])}>+  补记这一天</button></aside>
  </section>
}

function Settings(){return <section className="settings-grid"><div><span className="eyebrow">PREFERENCES</span><h2>记录偏好</h2><p>调整「颜」的记录和显示方式。</p></div><div className="settings-card">{[["类型管理","整理面膜、精华、清洁等护肤类型"],["项目归档","查看不再使用的护肤项目"],["提醒设置","选择护肤提醒时间"],["周起始日","当前从周日开始"],["深色模式","跟随系统外观"],["数据导出","导出全部护肤记录与感受"]].map(([a,b])=><button key={a}><span><strong>{a}</strong><small>{b}</small></span><em>›</em></button>)}</div><div className="data-note"><strong>数据保存在当前设备</strong><p>这一版不需要登录，您的护肤记录只保存在此浏览器中。</p></div></section>}
