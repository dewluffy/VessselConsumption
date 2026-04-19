import { useEffect, useMemo, useState } from "react";
import {
  BarChart3, Ship, Anchor, Fuel, LayoutDashboard, TrendingUp,
  MapPin,
} from "lucide-react";
import { api } from "../lib/api";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import Select from "../components/ui/Select";

// ── helpers ────────────────────────────────────────────────────────────────

function safeNum(v) { const n = Number(v); return Number.isFinite(n) ? n : 0; }

function fmtN(n, d = 0) {
  return Number(n || 0).toLocaleString("th-TH", { minimumFractionDigits: d, maximumFractionDigits: d });
}

function hoursBetween(s, e) {
  if (!s || !e) return 0;
  const ms = new Date(e) - new Date(s);
  return ms > 0 ? ms / 3600000 : 0;
}

function fmtDT(v) {
  if (!v) return "-";
  return new Date(v).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" });
}

const SOFT = {
  pageBg: "linear-gradient(180deg, #f7fbfa 0%, #f5f7fb 100%)",
  cardBg: "rgba(255,255,255,0.88)",
  cardBorder: "1px solid rgba(148, 163, 184, 0.14)",
  cardShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
  text: "#0f172a",
  subtext: "#64748b",
  muted: "#94a3b8",
  tabBg: "#eef7f5",
  tabActiveBg: "linear-gradient(135deg, #dff4ee 0%, #e8f2ff 100%)",
  tabActiveText: "#0f766e",
  metricBg: "linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(243,248,255,0.95) 100%)",
  surface: "#f8fafc",
  barTrack: "#eaf1f7",
  blue: "#7aa2f7",
  teal: "#5fb7a6",
  green: "#86c9a7",
  amber: "#e7b36a",
  violet: "#a78bfa",
  rose: "#f199ad",
  cyan: "#7dc8d8",
  gray: "#a8b3c7",
};

function GlassPanel({ children, style = {} }) {
  return (
    <div
      style={{
        background: SOFT.cardBg,
        border: SOFT.cardBorder,
        boxShadow: SOFT.cardShadow,
        borderRadius: 22,
        backdropFilter: "blur(8px)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ── sub-components ─────────────────────────────────────────────────────────

function MetricCard({ label, value, unit = "", color = SOFT.text }) {
  return (
    <div
      style={{
        background: SOFT.metricBg,
        borderRadius: 18,
        padding: "1rem 1rem 0.95rem",
        border: "1px solid rgba(255,255,255,0.8)",
        boxShadow: "0 8px 18px rgba(148, 163, 184, 0.10)",
      }}
    >
      <p style={{ fontSize: 13, color: SOFT.subtext, margin: "0 0 6px", fontWeight: 500 }}>{label}</p>
      <p style={{ fontSize: 24, fontWeight: 700, margin: 0, color, letterSpacing: "-0.02em" }}>
        {value} <span style={{ fontSize: 13, fontWeight: 500, color: SOFT.subtext }}>{unit}</span>
      </p>
    </div>
  );
}

function StatusBadge({ status }) {
  const st = String(status ?? "").toUpperCase();
  const map = {
    OPEN:   { bg: "#e8f7f0", color: "#15803d" },
    CLOSED: { bg: "#eef2f7", color: "#64748b" },
    default:{ bg: "#fff5e8", color: "#b45309" },
  };
  const theme = map[st] || map.default;

  return (
    <span
      style={{
        background: theme.bg,
        color: theme.color,
        borderRadius: 999,
        padding: "5px 12px",
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: "0.02em",
      }}
    >
      {status ?? "-"}
    </span>
  );
}

function SectionTitle({ children }) {
  return (
    <p
      style={{
        fontSize: 13,
        fontWeight: 700,
        color: SOFT.subtext,
        margin: "0 0 14px",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
      }}
    >
      {children}
    </p>
  );
}

function BarRow({ label, value, max, color = SOFT.blue, suffix = "" }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6, gap: 12 }}>
        <span style={{ color: SOFT.text, fontWeight: 600 }}>{label}</span>
        <span style={{ color: SOFT.subtext, fontWeight: 700 }}>{fmtN(value, 1)}{suffix}</span>
      </div>
      <div style={{ height: 10, background: SOFT.barTrack, borderRadius: 999, overflow: "hidden" }}>
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: `linear-gradient(90deg, ${color}, ${color}cc)`,
            borderRadius: 999,
            transition: "width 0.4s ease",
            boxShadow: `0 4px 10px ${color}33`,
          }}
        />
      </div>
    </div>
  );
}

function SoftSelect({ value, onChange, children }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.9)",
        border: "1px solid rgba(148,163,184,0.18)",
        borderRadius: 14,
        padding: 2,
        boxShadow: "0 4px 12px rgba(15,23,42,0.04)",
      }}
    >
      <Select value={value} onChange={onChange}>
        {children}
      </Select>
    </div>
  );
}

// ── TAB DEFINITIONS ────────────────────────────────────────────────────────

const TABS = [
  { id: "fleet",    label: "Fleet Live Status",   icon: Ship },
  { id: "voyage",   label: "Voyage Performance",  icon: TrendingUp },
  { id: "port",     label: "Port / Terminal",     icon: MapPin },
  { id: "fuel",     label: "Fuel & Cost Analysis",icon: Fuel },
  { id: "summary",  label: "Management Summary",  icon: LayoutDashboard },
];

// ── DASHBOARD 1: Fleet Live Status ─────────────────────────────────────────

function FleetLiveStatus({ vessels }) {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!vessels.length) return;
    const fetch = async () => {
      setLoading(true);
      const results = await Promise.all(vessels.map(async (v) => {
        try {
          const { data: d } = await api.get(`/api/vessels/${v.id}/voyages`, { params: { status: "OPEN" } });
          const list = (Array.isArray(d) ? d : d?.voyages ?? []);
          list.sort((a, b) => new Date(b.startAt) - new Date(a.startAt));
          const voy = list[0] ?? null;

          let lastActivity = null;
          if (voy) {
            const { data: ad } = await api.get(`/api/voyages/${voy.id}/activities`);
            const acts = Array.isArray(ad) ? ad : ad?.activities ?? [];
            acts.sort((a, b) => new Date(b.startAt) - new Date(a.startAt));
            lastActivity = acts[0] ?? null;
          }
          return { vessel: v, voy, lastActivity };
        } catch {
          return { vessel: v, voy: null, lastActivity: null };
        }
      }));
      setData(results);
      setLoading(false);
    };
    fetch();
  }, [vessels]);

  const typeLabel = (t) => ({ CARGO_LOAD: "Cargo Load", CARGO_DISCHARGE: "Cargo Discharge", MANOEUVRING: "Manoeuvring", FULL_SPEED_AWAY: "Full Speed Away", ANCHORING: "Anchoring", OTHER: "Other" }[t] ?? t ?? "-");

  if (loading) return <div style={{ color: SOFT.subtext, fontSize: 14 }}>กำลังโหลด...</div>;

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 18 }}>
        {data.map(({ vessel, voy, lastActivity }) => (
          <GlassPanel key={vessel.id} style={{ padding: "1.1rem 1.2rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #d8f1eb 0%, #e5eeff 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 6px 14px rgba(95,183,166,0.18)",
                  }}
                >
                  <Ship size={19} style={{ color: "#0f766e" }} />
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: SOFT.text }}>{vessel.name}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: SOFT.subtext }}>{vessel.code}</p>
                </div>
              </div>
              <StatusBadge status={voy?.status ?? "NO VOYAGE"} />
            </div>

            {voy ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 13 }}>
                <div style={{ background: SOFT.surface, borderRadius: 16, padding: "10px 12px" }}>
                  <p style={{ margin: "0 0 2px", color: SOFT.subtext, fontSize: 12 }}>Voyage</p>
                  <p style={{ margin: 0, fontWeight: 700, color: SOFT.text }}>{voy.voyNo ?? `#${voy.id}`}</p>
                </div>
                <div style={{ background: SOFT.surface, borderRadius: 16, padding: "10px 12px" }}>
                  <p style={{ margin: "0 0 2px", color: SOFT.subtext, fontSize: 12 }}>เริ่มต้น</p>
                  <p style={{ margin: 0, fontWeight: 700, color: SOFT.text }}>{fmtDT(voy.startAt)}</p>
                </div>
                <div style={{ background: SOFT.surface, borderRadius: 16, padding: "10px 12px", gridColumn: "1/-1" }}>
                  <p style={{ margin: "0 0 3px", color: SOFT.subtext, fontSize: 12 }}>Activity ล่าสุด</p>
                  <p style={{ margin: 0, fontWeight: 700, color: SOFT.text }}>{lastActivity ? typeLabel(lastActivity.type) : "-"}</p>
                  {lastActivity?.avgSpeed && <p style={{ margin: "4px 0 0", fontSize: 12, color: SOFT.subtext }}>ความเร็ว {lastActivity.avgSpeed} knots</p>}
                  {lastActivity?.anchorLocation && <p style={{ margin: "4px 0 0", fontSize: 12, color: SOFT.subtext }}>สถานที่: {lastActivity.anchorLocation}</p>}
                  {lastActivity?.berth && <p style={{ margin: "4px 0 0", fontSize: 12, color: SOFT.subtext }}>ท่า: {lastActivity.berth}{lastActivity.berthSub ? ` – ${lastActivity.berthSub}` : ""}</p>}
                  {lastActivity && <p style={{ margin: "4px 0 0", fontSize: 12, color: SOFT.subtext }}>{fmtDT(lastActivity.startAt)}</p>}
                </div>
              </div>
            ) : (
              <p style={{ fontSize: 13, color: SOFT.subtext, margin: 0 }}>ไม่มี Voyage ที่เปิดอยู่</p>
            )}
          </GlassPanel>
        ))}
      </div>
    </div>
  );
}

// ── DASHBOARD 2: Voyage Performance ───────────────────────────────────────

function VoyagePerformance({ vessels }) {
  const [selectedVessel, setSelectedVessel] = useState("");
  const [selectedMonth,  setSelectedMonth]  = useState(String(new Date().getMonth() + 1));
  const [selectedYear,   setSelectedYear]   = useState(String(new Date().getFullYear()));
  const [data, setData]   = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!vessels.length) return;
    setSelectedVessel(String(vessels[0].id));
  }, [vessels]);

  useEffect(() => {
    if (!selectedVessel) return;
    const fetch = async () => {
      setLoading(true);
      try {
        const params = {};
        if (selectedMonth !== "all") params.month = Number(selectedMonth);
        if (selectedYear  !== "all") params.year  = Number(selectedYear);
        const { data: d } = await api.get(`/api/vessels/${selectedVessel}/voyages`, { params });
        const voyages = (Array.isArray(d) ? d : d?.voyages ?? []).slice(0, 20);

        const rows = await Promise.all(voyages.map(async (v) => {
          const { data: ad } = await api.get(`/api/voyages/${v.id}/activities`);
          const acts = Array.isArray(ad) ? ad : ad?.activities ?? [];
          const anchorH = acts.filter((a) => a.type === "ANCHORING").reduce((s, a) => s + hoursBetween(a.startAt, a.endAt), 0);
          const fswH    = acts.filter((a) => a.type === "FULL_SPEED_AWAY").reduce((s, a) => s + hoursBetween(a.startAt, a.endAt), 0);
          const manoH   = acts.filter((a) => a.type === "MANOEUVRING").reduce((s, a) => s + hoursBetween(a.startAt, a.endAt), 0);
          const cargoH  = acts.filter((a) => a.type === "CARGO_LOAD" || a.type === "CARGO_DISCHARGE").reduce((s, a) => s + hoursBetween(a.startAt, a.endAt), 0);
          const totalH  = hoursBetween(v.startAt, v.endAt);
          return { voyNo: v.voyNo || `#${v.id}`, totalH, anchorH, fswH, manoH, cargoH, status: v.status };
        }));
        setData(rows);
      } catch {
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [selectedVessel, selectedMonth, selectedYear]);

  const totalH     = data.reduce((s, r) => s + r.totalH, 0);
  const totalAncH  = data.reduce((s, r) => s + r.anchorH, 0);
  const totalFswH  = data.reduce((s, r) => s + r.fswH, 0);
  const totalCarH  = data.reduce((s, r) => s + r.cargoH, 0);
  const maxTotal   = Math.max(...data.map((r) => r.totalH), 1);

  const months = Array.from({ length: 12 }, (_, i) => ({ value: String(i+1), label: String(i+1) }));
  const years  = [2024,2025,2026,2027].map((y) => ({ value: String(y), label: String(y) }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <div style={{ minWidth: 180 }}>
          <p style={{ fontSize: 12, color: SOFT.subtext, margin: "0 0 6px", fontWeight: 600 }}>เรือ</p>
          <SoftSelect value={selectedVessel} onChange={(e) => setSelectedVessel(e.target.value)}>
            {vessels.map((v) => <option key={v.id} value={String(v.id)}>{v.name}</option>)}
          </SoftSelect>
        </div>
        <div style={{ minWidth: 90 }}>
          <p style={{ fontSize: 12, color: SOFT.subtext, margin: "0 0 6px", fontWeight: 600 }}>เดือน</p>
          <SoftSelect value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
            <option value="all">ทั้งหมด</option>
            {months.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </SoftSelect>
        </div>
        <div style={{ minWidth: 100 }}>
          <p style={{ fontSize: 12, color: SOFT.subtext, margin: "0 0 6px", fontWeight: 600 }}>ปี</p>
          <SoftSelect value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
            {years.map((y) => <option key={y.value} value={y.value}>{y.label}</option>)}
          </SoftSelect>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
        <MetricCard label="จำนวน Voyage" value={data.length} unit="เที่ยว" color={SOFT.blue} />
        <MetricCard label="ชั่วโมงรวม" value={fmtN(totalH, 1)} unit="ชม." color={SOFT.text} />
        <MetricCard label="Idle Time รวม" value={fmtN(totalAncH, 1)} unit="ชม." color={SOFT.amber} />
        <MetricCard label="แล่นเร็ว (FSW)" value={fmtN(totalFswH, 1)} unit="ชม." color={SOFT.cyan} />
        <MetricCard label="ขนถ่ายสินค้ารวม" value={fmtN(totalCarH, 1)} unit="ชม." color={SOFT.green} />
      </div>

      {loading ? (
        <div style={{ fontSize: 14, color: SOFT.subtext }}>กำลังโหลด...</div>
      ) : data.length === 0 ? (
        <div style={{ fontSize: 14, color: SOFT.subtext }}>ไม่พบข้อมูล</div>
      ) : (
        <GlassPanel style={{ padding: "1rem 1.25rem" }}>
          <SectionTitle>ระยะเวลาแต่ละ Voyage (ชั่วโมง)</SectionTitle>
          {data.map((r, i) => (
            <BarRow key={i} label={r.voyNo} value={r.totalH} max={maxTotal} color={SOFT.blue} suffix=" ชม." />
          ))}
        </GlassPanel>
      )}

      {!loading && data.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <GlassPanel style={{ padding: "1rem 1.25rem" }}>
            <SectionTitle>Idle Time (ชั่วโมง)</SectionTitle>
            {data.map((r, i) => (
              <BarRow key={i} label={r.voyNo} value={r.anchorH} max={Math.max(...data.map((d) => d.anchorH), 1)} color={SOFT.amber} suffix=" ชม." />
            ))}
          </GlassPanel>
          <GlassPanel style={{ padding: "1rem 1.25rem" }}>
            <SectionTitle>Manoeuvring (ชั่วโมง)</SectionTitle>
            {data.map((r, i) => (
              <BarRow key={i} label={r.voyNo} value={r.manoH} max={Math.max(...data.map((d) => d.manoH), 1)} color={SOFT.violet} suffix=" ชม." />
            ))}
          </GlassPanel>
        </div>
      )}
    </div>
  );
}

// ── DASHBOARD 3: Port / Terminal Efficiency ────────────────────────────────

function PortTerminalEfficiency({ vessels }) {
  const [selectedVessel, setSelectedVessel] = useState("");
  const [selectedMonth,  setSelectedMonth]  = useState(String(new Date().getMonth() + 1));
  const [selectedYear,   setSelectedYear]   = useState(String(new Date().getFullYear()));
  const [portData, setPortData] = useState([]);
  const [loading,  setLoading]  = useState(false);

  useEffect(() => {
    if (vessels.length) setSelectedVessel(String(vessels[0].id));
  }, [vessels]);

  useEffect(() => {
    if (!selectedVessel) return;
    const fetch = async () => {
      setLoading(true);
      try {
        const params = {};
        if (selectedMonth !== "all") params.month = Number(selectedMonth);
        if (selectedYear  !== "all") params.year  = Number(selectedYear);
        const { data: d } = await api.get(`/api/vessels/${selectedVessel}/voyages`, { params });
        const voyages = Array.isArray(d) ? d : d?.voyages ?? [];

        const berthMap = {};
        await Promise.all(voyages.slice(0, 30).map(async (v) => {
          const { data: ad } = await api.get(`/api/voyages/${v.id}/activities`);
          const acts = Array.isArray(ad) ? ad : ad?.activities ?? [];
          for (const a of acts) {
            if ((a.type === "CARGO_LOAD" || a.type === "CARGO_DISCHARGE") && a.berth) {
              const key = a.berthSub ? `${a.berth} – ${a.berthSub}` : a.berth;
              if (!berthMap[key]) berthMap[key] = { name: key, hours: 0, teus: 0, weight: 0, calls: 0 };
              berthMap[key].hours  += hoursBetween(a.startAt, a.endAt);
              berthMap[key].teus   += safeNum(a.container20Count) + safeNum(a.container40Count);
              berthMap[key].weight += safeNum(a.totalContainerWeight);
              berthMap[key].calls  += 1;
            }
          }
        }));

        const list = Object.values(berthMap).sort((a, b) => b.hours - a.hours);
        setPortData(list);
      } catch {
        setPortData([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [selectedVessel, selectedMonth, selectedYear]);

  const maxH = Math.max(...portData.map((p) => p.hours), 1);
  const maxT = Math.max(...portData.map((p) => p.teus), 1);
  const months = Array.from({ length: 12 }, (_, i) => ({ value: String(i+1), label: String(i+1) }));
  const years  = [2024,2025,2026,2027].map((y) => ({ value: String(y), label: String(y) }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <div style={{ minWidth: 180 }}>
          <p style={{ fontSize: 12, color: SOFT.subtext, margin: "0 0 6px", fontWeight: 600 }}>เรือ</p>
          <SoftSelect value={selectedVessel} onChange={(e) => setSelectedVessel(e.target.value)}>
            {vessels.map((v) => <option key={v.id} value={String(v.id)}>{v.name}</option>)}
          </SoftSelect>
        </div>
        <div style={{ minWidth: 90 }}>
          <p style={{ fontSize: 12, color: SOFT.subtext, margin: "0 0 6px", fontWeight: 600 }}>เดือน</p>
          <SoftSelect value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
            <option value="all">ทั้งหมด</option>
            {months.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </SoftSelect>
        </div>
        <div style={{ minWidth: 100 }}>
          <p style={{ fontSize: 12, color: SOFT.subtext, margin: "0 0 6px", fontWeight: 600 }}>ปี</p>
          <SoftSelect value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
            {years.map((y) => <option key={y.value} value={y.value}>{y.label}</option>)}
          </SoftSelect>
        </div>
      </div>

      {loading ? (
        <div style={{ fontSize: 14, color: SOFT.subtext }}>กำลังโหลด...</div>
      ) : portData.length === 0 ? (
        <div style={{ fontSize: 14, color: SOFT.subtext }}>ไม่พบข้อมูลท่าเรือ</div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
            <MetricCard label="จำนวนท่า" value={portData.length} unit="ท่า" color={SOFT.blue} />
            <MetricCard label="รวมเวลาเทียบท่า" value={fmtN(portData.reduce((s,p)=>s+p.hours,0),1)} unit="ชม." color={SOFT.rose} />
            <MetricCard label="TEUs ทั้งหมด" value={fmtN(portData.reduce((s,p)=>s+p.teus,0))} color={SOFT.green} />
            <MetricCard label="น้ำหนักรวม" value={fmtN(portData.reduce((s,p)=>s+p.weight,0),0)} unit="MT" color={SOFT.violet} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <GlassPanel style={{ padding: "1rem 1.25rem" }}>
              <SectionTitle>เวลาเทียบท่า (ชั่วโมง)</SectionTitle>
              {portData.map((p, i) => (
                <BarRow key={i} label={p.name} value={p.hours} max={maxH} color={SOFT.rose} suffix=" ชม." />
              ))}
            </GlassPanel>
            <GlassPanel style={{ padding: "1rem 1.25rem" }}>
              <SectionTitle>TEUs ขึ้น-ลง</SectionTitle>
              {portData.map((p, i) => (
                <BarRow key={i} label={p.name} value={p.teus} max={maxT} color={SOFT.green} suffix=" TEU" />
              ))}
            </GlassPanel>
          </div>

          <GlassPanel style={{ overflow: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f3f7fb" }}>
                  {["ท่าเรือ","จำนวนครั้ง","ชั่วโมงรวม","ชม./ครั้ง","TEUs","น้ำหนัก MT"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "12px 16px", fontWeight: 700, color: SOFT.subtext }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {portData.map((p, i) => (
                  <tr key={i} style={{ borderTop: "1px solid rgba(148,163,184,0.12)" }}>
                    <td style={{ padding: "12px 16px", fontWeight: 700, color: SOFT.text }}>{p.name}</td>
                    <td style={{ padding: "12px 16px", color: SOFT.subtext }}>{p.calls}</td>
                    <td style={{ padding: "12px 16px", color: SOFT.subtext }}>{fmtN(p.hours, 1)}</td>
                    <td style={{ padding: "12px 16px", color: SOFT.subtext }}>{fmtN(p.calls > 0 ? p.hours / p.calls : 0, 1)}</td>
                    <td style={{ padding: "12px 16px", color: SOFT.subtext }}>{fmtN(p.teus)}</td>
                    <td style={{ padding: "12px 16px", color: SOFT.subtext }}>{fmtN(p.weight, 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </GlassPanel>
        </>
      )}
    </div>
  );
}

// ── DASHBOARD 4: Fuel & Cost Analysis ─────────────────────────────────────

function FuelCostAnalysis({ vessels }) {
  const [selectedMonth, setSelectedMonth] = useState(String(new Date().getMonth() + 1));
  const [selectedYear,  setSelectedYear]  = useState(String(new Date().getFullYear()));
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!vessels.length) return;
    const fetch = async () => {
      setLoading(true);
      try {
        const rows = await Promise.all(vessels.map(async (vessel) => {
          const params = {};
          if (selectedMonth !== "all") params.month = Number(selectedMonth);
          if (selectedYear  !== "all") params.year  = Number(selectedYear);
          const { data: d } = await api.get(`/api/vessels/${vessel.id}/voyages`, { params });
          const voyages = Array.isArray(d) ? d : d?.voyages ?? [];

          let totalFuel = 0, voyCount = 0;
          const byType = { CARGO_LOAD: 0, CARGO_DISCHARGE: 0, MANOEUVRING: 0, FULL_SPEED_AWAY: 0, ANCHORING: 0, OTHER: 0 };

          await Promise.all(voyages.slice(0, 20).map(async (v) => {
            const { data: ad } = await api.get(`/api/voyages/${v.id}/activities`);
            const acts = Array.isArray(ad) ? ad : ad?.activities ?? [];
            for (const a of acts) {
              const fuel = safeNum(a.fuelUsed);
              totalFuel += fuel;
              if (byType[a.type] !== undefined) byType[a.type] += fuel;
            }
            voyCount++;
          }));

          return { vessel, totalFuel, voyCount, avgPerVoy: voyCount > 0 ? totalFuel / voyCount : 0, byType };
        }));
        setData(rows);
      } catch {
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [vessels, selectedMonth, selectedYear]);

  const maxFuel  = Math.max(...data.map((r) => r.totalFuel), 1);
  const maxAvg   = Math.max(...data.map((r) => r.avgPerVoy), 1);
  const months   = Array.from({ length: 12 }, (_, i) => ({ value: String(i+1), label: String(i+1) }));
  const years    = [2024,2025,2026,2027].map((y) => ({ value: String(y), label: String(y) }));
  const typeColors = { CARGO_LOAD: SOFT.blue, CARGO_DISCHARGE: "#8ea2ff", MANOEUVRING: SOFT.violet, FULL_SPEED_AWAY: SOFT.cyan, ANCHORING: SOFT.amber, OTHER: SOFT.gray };
  const typeLabels = { CARGO_LOAD: "Cargo Load", CARGO_DISCHARGE: "Cargo Discharge", MANOEUVRING: "Manoeuvring", FULL_SPEED_AWAY: "Full Speed Away", ANCHORING: "Anchoring", OTHER: "Other" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <div style={{ minWidth: 90 }}>
          <p style={{ fontSize: 12, color: SOFT.subtext, margin: "0 0 6px", fontWeight: 600 }}>เดือน</p>
          <SoftSelect value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
            <option value="all">ทั้งหมด</option>
            {months.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </SoftSelect>
        </div>
        <div style={{ minWidth: 100 }}>
          <p style={{ fontSize: 12, color: SOFT.subtext, margin: "0 0 6px", fontWeight: 600 }}>ปี</p>
          <SoftSelect value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
            {years.map((y) => <option key={y.value} value={y.value}>{y.label}</option>)}
          </SoftSelect>
        </div>
      </div>

      {loading ? (
        <div style={{ fontSize: 14, color: SOFT.subtext }}>กำลังโหลด...</div>
      ) : data.length === 0 ? (
        <div style={{ fontSize: 14, color: SOFT.subtext }}>ไม่พบข้อมูล</div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
            <MetricCard label="น้ำมันรวมทุกลำ" value={fmtN(data.reduce((s,r)=>s+r.totalFuel,0),0)} unit="L" color={SOFT.blue} />
            <MetricCard label="เฉลี่ย/Voyage" value={fmtN(data.reduce((s,r)=>s+r.avgPerVoy,0)/Math.max(data.length,1),0)} unit="L" color={SOFT.green} />
            <MetricCard label="Voyages รวม" value={data.reduce((s,r)=>s+r.voyCount,0)} unit="เที่ยว" color={SOFT.violet} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <GlassPanel style={{ padding: "1rem 1.25rem" }}>
              <SectionTitle>น้ำมันรวม (ลิตร)</SectionTitle>
              {data.map((r, i) => (
                <BarRow key={i} label={r.vessel.name} value={r.totalFuel} max={maxFuel} color={SOFT.blue} suffix=" L" />
              ))}
            </GlassPanel>
            <GlassPanel style={{ padding: "1rem 1.25rem" }}>
              <SectionTitle>เฉลี่ยต่อ Voyage (ลิตร)</SectionTitle>
              {data.map((r, i) => (
                <BarRow key={i} label={r.vessel.name} value={r.avgPerVoy} max={maxAvg} color={SOFT.green} suffix=" L" />
              ))}
            </GlassPanel>
          </div>

          {data.map((r) => {
            const total = Object.values(r.byType).reduce((s, v) => s + v, 0) || 1;
            return (
              <GlassPanel key={r.vessel.id} style={{ padding: "1rem 1.25rem" }}>
                <SectionTitle>{r.vessel.name} — สัดส่วนการใช้น้ำมันตาม Activity</SectionTitle>
                <div style={{ display: "flex", height: 20, borderRadius: 999, overflow: "hidden", marginBottom: 14, background: SOFT.barTrack }}>
                  {Object.entries(r.byType).filter(([,v])=>v>0).map(([type, val]) => (
                    <div key={type} title={`${typeLabels[type]}: ${fmtN(val,0)} L`} style={{ width: `${(val/total)*100}%`, background: typeColors[type] }} />
                  ))}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 16px" }}>
                  {Object.entries(r.byType).filter(([,v])=>v>0).map(([type, val]) => (
                    <span key={type} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: SOFT.subtext, fontWeight: 600 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 999, background: typeColors[type], flexShrink: 0 }} />
                      {typeLabels[type]}: {fmtN(val,0)} L ({fmtN((val/total)*100,1)}%)
                    </span>
                  ))}
                </div>
              </GlassPanel>
            );
          })}
        </>
      )}
    </div>
  );
}

// ── DASHBOARD 5: Management Summary ───────────────────────────────────────

function ManagementSummary({ vessels }) {
  const [selectedYear,  setSelectedYear]  = useState(String(new Date().getFullYear()));
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);

  const years = [2024,2025,2026,2027].map((y) => ({ value: String(y), label: String(y) }));

  useEffect(() => {
    if (!vessels.length) return;
    const fetch = async () => {
      setLoading(true);
      try {
        const allVoy = [];
        await Promise.all(vessels.map(async (vessel) => {
          const { data: d } = await api.get(`/api/vessels/${vessel.id}/voyages`, { params: { year: Number(selectedYear) } });
          const list = (Array.isArray(d) ? d : d?.voyages ?? []).map((v) => ({ ...v, _vessel: vessel }));
          allVoy.push(...list);
        }));

        const byMonth = {};
        for (let m = 1; m <= 12; m++) byMonth[m] = { voyCount: 0, fuel: 0, teus: 0, anchorH: 0, vessels: new Set() };

        await Promise.all(allVoy.slice(0, 60).map(async (v) => {
          const m = v.postingMonth;
          if (!m || !byMonth[m]) return;
          byMonth[m].voyCount++;
          byMonth[m].vessels.add(v._vessel.id);
          const { data: ad } = await api.get(`/api/voyages/${v.id}/activities`);
          const acts = Array.isArray(ad) ? ad : ad?.activities ?? [];
          for (const a of acts) {
            byMonth[m].fuel += safeNum(a.fuelUsed);
            if (a.type === "CARGO_LOAD") byMonth[m].teus += safeNum(a.container20Count) + safeNum(a.container40Count);
            if (a.type === "ANCHORING") byMonth[m].anchorH += hoursBetween(a.startAt, a.endAt);
          }
        }));

        const months = Object.entries(byMonth).map(([m, v]) => ({ month: Number(m), ...v, vessels: v.vessels.size }));
        setData({
          totalVoy:   allVoy.length,
          totalFuel:  months.reduce((s, m) => s + m.fuel, 0),
          totalTeus:  months.reduce((s, m) => s + m.teus, 0),
          totalAncH:  months.reduce((s, m) => s + m.anchorH, 0),
          months,
        });
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [vessels, selectedYear]);

  const maxFuel = data ? Math.max(...data.months.map((m) => m.fuel), 1) : 1;
  const maxVoy  = data ? Math.max(...data.months.map((m) => m.voyCount), 1) : 1;
  const monthNames = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ minWidth: 100 }}>
          <p style={{ fontSize: 12, color: SOFT.subtext, margin: "0 0 6px", fontWeight: 600 }}>ปี</p>
          <SoftSelect value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
            {years.map((y) => <option key={y.value} value={y.value}>{y.label}</option>)}
          </SoftSelect>
        </div>
      </div>

      {loading ? (
        <div style={{ fontSize: 14, color: SOFT.subtext }}>กำลังโหลด...</div>
      ) : !data ? (
        <div style={{ fontSize: 14, color: SOFT.subtext }}>ไม่พบข้อมูล</div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
            <MetricCard label="Voyages ทั้งปี" value={fmtN(data.totalVoy)} unit="เที่ยว" color={SOFT.blue} />
            <MetricCard label="น้ำมันรวมทั้งปี" value={fmtN(data.totalFuel, 0)} unit="L" color={SOFT.amber} />
            <MetricCard label="TEUs ทั้งปี" value={fmtN(data.totalTeus, 0)} unit="TEU" color={SOFT.cyan} />
            <MetricCard label="Idle Time รวม" value={fmtN(data.totalAncH, 1)} unit="ชม." color={SOFT.rose} />
          </div>

          <GlassPanel style={{ padding: "1rem 1.25rem" }}>
            <SectionTitle>จำนวน Voyage รายเดือน</SectionTitle>
            {data.months.filter((m) => m.voyCount > 0).map((m) => (
              <BarRow key={m.month} label={monthNames[m.month-1]} value={m.voyCount} max={maxVoy} color={SOFT.violet} suffix=" เที่ยว" />
            ))}
          </GlassPanel>

          <GlassPanel style={{ padding: "1rem 1.25rem" }}>
            <SectionTitle>การใช้น้ำมัน รายเดือน (ลิตร)</SectionTitle>
            {data.months.filter((m) => m.fuel > 0).map((m) => (
              <BarRow key={m.month} label={monthNames[m.month-1]} value={m.fuel} max={maxFuel} color={SOFT.amber} suffix=" L" />
            ))}
          </GlassPanel>

          <GlassPanel style={{ overflow: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f3f7fb" }}>
                  {["เดือน","Voyages","น้ำมัน (L)","TEUs","Idle Time (ชม.)","เฉลี่ยน้ำมัน/Voy"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "12px 16px", fontWeight: 700, color: SOFT.subtext }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.months.filter((m) => m.voyCount > 0).map((m) => (
                  <tr key={m.month} style={{ borderTop: "1px solid rgba(148,163,184,0.12)" }}>
                    <td style={{ padding: "12px 16px", fontWeight: 700, color: SOFT.text }}>{monthNames[m.month-1]}</td>
                    <td style={{ padding: "12px 16px", color: SOFT.subtext }}>{m.voyCount}</td>
                    <td style={{ padding: "12px 16px", color: SOFT.subtext }}>{fmtN(m.fuel, 0)}</td>
                    <td style={{ padding: "12px 16px", color: SOFT.subtext }}>{fmtN(m.teus, 0)}</td>
                    <td style={{ padding: "12px 16px", color: SOFT.subtext }}>{fmtN(m.anchorH, 1)}</td>
                    <td style={{ padding: "12px 16px", color: SOFT.subtext }}>{fmtN(m.voyCount > 0 ? m.fuel / m.voyCount : 0, 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </GlassPanel>
        </>
      )}
    </div>
  );
}

// ── MAIN DASHBOARD PAGE ────────────────────────────────────────────────────

export default function DashboardPage() {
  const [activeTab,      setActiveTab]      = useState("fleet");
  const [vessels,        setVessels]        = useState([]);
  const [loadingVessels, setLoadingVessels] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get("/api/vessels");
        setVessels(Array.isArray(data) ? data : data?.vessels ?? []);
      } catch {
        // silent
      } finally {
        setLoadingVessels(false);
      }
    };
    fetch();
  }, []);

  const activeTabDef = TABS.find((t) => t.id === activeTab);

  return (
    <div className="space-y-5" style={{ background: SOFT.pageBg, minHeight: "100%", padding: "4px 2px 10px" }}>
      <div
        style={{
          background: "linear-gradient(135deg, rgba(223,244,238,0.8) 0%, rgba(232,242,255,0.82) 55%, rgba(245,240,255,0.8) 100%)",
          borderRadius: 24,
          padding: "1.25rem 1.4rem",
          border: "1px solid rgba(255,255,255,0.7)",
          boxShadow: "0 12px 28px rgba(148,163,184,0.10)",
        }}
      >
        <div className="text-2xl font-semibold flex items-center gap-2" style={{ color: SOFT.text }}>
          <BarChart3 size={22} style={{ color: SOFT.tabActiveText }} /> Dashboard
        </div>
        <div className="text-sm" style={{ color: SOFT.subtext, marginTop: 4 }}>ภาพรวมการปฏิบัติงาน</div>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 16px",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                background: isActive ? SOFT.tabActiveBg : SOFT.tabBg,
                border: isActive ? "1px solid rgba(95,183,166,0.28)" : "1px solid rgba(148,163,184,0.10)",
                borderRadius: 999,
                color: isActive ? SOFT.tabActiveText : SOFT.subtext,
                boxShadow: isActive ? "0 8px 18px rgba(95,183,166,0.14)" : "none",
                transition: "all 0.18s ease",
              }}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <div className="font-medium flex items-center gap-2" style={{ color: SOFT.text }}>
            {activeTabDef && <activeTabDef.icon size={16} style={{ color: SOFT.tabActiveText }} />}
            {activeTabDef?.label}
          </div>
        </CardHeader>
        <CardBody>
          {loadingVessels ? (
            <div className="text-sm" style={{ color: SOFT.subtext }}>กำลังโหลดข้อมูลเรือ...</div>
          ) : vessels.length === 0 ? (
            <div className="text-sm" style={{ color: SOFT.subtext }}>ไม่พบข้อมูลเรือ</div>
          ) : (
            <>
              {activeTab === "fleet"   && <FleetLiveStatus vessels={vessels} />}
              {activeTab === "voyage"  && <VoyagePerformance vessels={vessels} />}
              {activeTab === "port"    && <PortTerminalEfficiency vessels={vessels} />}
              {activeTab === "fuel"    && <FuelCostAnalysis vessels={vessels} />}
              {activeTab === "summary" && <ManagementSummary vessels={vessels} />}
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
