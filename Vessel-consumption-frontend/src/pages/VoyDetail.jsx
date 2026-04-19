import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Route, ClipboardList, Droplets, Plus, X, Trash2, Pencil } from "lucide-react";
import { useAuthStore } from "../stores/auth.store";

import { alertConfirm, alertError, alertSuccess } from "../lib/alert";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { useVoyDetailStore } from "../stores/voyDetail.store";

const ACTIVITY_TYPES = [
  { value: "CARGO_LOAD",      label: "Cargo work / Load" },
  { value: "CARGO_DISCHARGE", label: "Cargo work / Discharge" },
  { value: "MANOEUVRING",     label: "Manoeuvring" },
  { value: "FULL_SPEED_AWAY", label: "Full speed away" },
  { value: "ANCHORING",       label: "Anchoring" },
  { value: "OTHER",           label: "Other" },
];

const BERTH_OPTIONS = [
  { value: "BKK", label: "BKK" },
  { value: "LCB", label: "LCB" },
];

const BERTH_SUB_OPTIONS = {
  BKK: [
    { value: "BMT",     label: "BMT" },
    { value: "STT 6",   label: "STT 6" },
    { value: "STT 4A",  label: "STT 4A" },
    { value: "PAT 20G", label: "PAT 20G" },
    { value: "TICT",    label: "TICT" },
    { value: "TCT",     label: "TCT" },
  ],
  LCB: [
    { value: "KLN",  label: "KLN" },
    { value: "SCSP", label: "SCSP" },
    { value: "PA1",  label: "PA1" },
    { value: "PA2",  label: "PA2" },
    { value: "A0",   label: "A0" },
    { value: "A1",   label: "A1" },
    { value: "A2",   label: "A2" },
    { value: "A3",   label: "A3" },
    { value: "B1",   label: "B1" },
    { value: "B2",   label: "B2" },
    { value: "B3",   label: "B3" },
    { value: "B4",   label: "B4" },
    { value: "B5",   label: "B5" },
    { value: "C1",   label: "C1" },
    { value: "C2",   label: "C2" },
    { value: "C3",   label: "C3" },
    { value: "D1",   label: "D1" },
    { value: "D2",   label: "D2" },
    { value: "D3",   label: "D3" },
  ],
};

const CURRENT_OPTIONS = [
  { value: "AGAINST", label: "ทวนน้ำ" },
  { value: "WITH",    label: "ตามน้ำ" },
];

const WIND_OPTIONS = [
  { value: "N",  label: "N (เหนือ)" },
  { value: "NE", label: "NE (ตะวันออกเฉียงเหนือ)" },
  { value: "E",  label: "E (ตะวันออก)" },
  { value: "SE", label: "SE (ตะวันออกเฉียงใต้)" },
  { value: "S",  label: "S (ใต้)" },
  { value: "SW", label: "SW (ตะวันตกเฉียงใต้)" },
  { value: "W",  label: "W (ตะวันตก)" },
  { value: "NW", label: "NW (ตะวันตกเฉียงเหนือ)" },
];

function typeLabel(type) {
  return ACTIVITY_TYPES.find((t) => t.value === type)?.label ?? type ?? "-";
}

function fmtDateTime(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" });
}

function toDatetimeLocalValue(date) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm   = String(d.getMonth() + 1).padStart(2, "0");
  const dd   = String(d.getDate()).padStart(2, "0");
  const hh   = String(d.getHours()).padStart(2, "0");
  const mi   = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function toISOFromDatetimeLocal(v) { return new Date(v).toISOString(); }

function hoursBetween(startAt, endAt) {
  if (!startAt || !endAt) return 0;
  const s = new Date(startAt).getTime();
  const e = new Date(endAt).getTime();
  if (Number.isNaN(s) || Number.isNaN(e) || e <= s) return 0;
  return (e - s) / 3600000;
}

const EMPTY_ACT_FORM = {
  startAt: "", endAt: "",
  container20Count: "", container40Count: "", totalContainerWeight: "",
  draftFore: "", draftAft: "", berth: "", berthSub: "",
  anchorLocation: "",
  generator1Count: "", generator1Hours: "",
  generator2Count: "", generator2Hours: "",
  deckgenCount: "", deckgenHours: "",
  mainEngine1Count: "", mainEngine1Hours: "",
  mainEngine2Count: "", mainEngine2Hours: "",
  reeferCount: "", fuelUsed: "", avgSpeed: "",
  currentDirection: "", windDirection: "",
  remark: "",
};

function TabButton({ active, onClick, icon: Icon, children }) {
  return (
    <button onClick={onClick} className={[
      "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition cursor-pointer",
      active ? "border-slate-200 bg-white text-slate-900 shadow-sm" : "border-transparent bg-slate-50 text-slate-600 hover:bg-slate-100",
    ].join(" ")}>
      <Icon size={16} />{children}
    </button>
  );
}

export default function VoyDetailPage() {
  const { id } = useParams();
  const voyageId = Number(id);
  const navigate = useNavigate();

  const {
    voy, activities, fuel,
    loadingVoy, loadingActivities, loadingFuel,
    fetchAll, fetchActivities, fetchFuel, fetchPreviousRob,
    createActivity, updateActivity, deleteActivity,
    updateFuelRob, createFuelBunker, updateFuelBunker, deleteFuelBunker,
    updateVoyage,
  } = useVoyDetailStore();

  const me = useAuthStore((s) => s.me);
  const isCharterer = me?.role === "CHARTERER";

  const [tab, setTab] = useState("activity");

  // Activity modal
  const [openActModal, setOpenActModal] = useState(false);
  const [savingAct, setSavingAct]       = useState(false);
  const [actStep, setActStep]           = useState("type");
  const [editActId, setEditActId]       = useState(null);
  const [actType, setActType]           = useState("");
  const [actForm, setActForm]           = useState(EMPTY_ACT_FORM);

  // Fuel ROB
  const [robSaved, setRobSaved]                 = useState(false);
  const [fuelRobForm, setFuelRobForm]           = useState({ openingRob: "", closingRob: "" });
  const [prevRobInfo, setPrevRobInfo]           = useState(null);
  const [showManualInput, setShowManualInput]   = useState(false);
  const [manualMeasureDate, setManualMeasureDate] = useState("");
  const [manualRob, setManualRob]               = useState("");

  // End date
  const [editingEndAt, setEditingEndAt] = useState(false);
  const [endAtForm, setEndAtForm]       = useState("");
  const [savingEndAt, setSavingEndAt]   = useState(false);

  // Bunker modal
  const [openBunkerModal, setOpenBunkerModal] = useState(false);
  const [savingBunker, setSavingBunker]       = useState(false);
  const [editBunkerId, setEditBunkerId]       = useState(null);
  const [bunkerForm, setBunkerForm]           = useState({ at: "", amount: "", remark: "" });

  const title = useMemo(() => {
    if (!voy) return `Voy #${id}`;
    return voy.voyNo ? `Voy ${voy.voyNo}` : `Voy #${voy.id}`;
  }, [voy, id]);

  // โหลดข้อมูลทั้งหมด + previous ROB
  useEffect(() => {
    if (!Number.isFinite(voyageId) || voyageId <= 0) return;
    (async () => {
      try {
        await fetchAll(voyageId);
        const prev = await fetchPreviousRob(voyageId);
        setPrevRobInfo(prev);
        if (prev.hasPrevious && prev.openingRob != null) {
          setFuelRobForm((p) => ({ ...p, openingRob: String(prev.openingRob) }));
        }
      } catch (e) {
        await alertError("โหลดข้อมูลไม่สำเร็จ", e?.response?.data?.message || e?.message || "ไม่สามารถโหลดข้อมูลได้");
      }
    })();
  }, [voyageId, fetchAll, fetchPreviousRob]);

  // sync fuel rob จาก DB
  useEffect(() => {
    if (!fuel?.rob) return;
    const opening = Number(fuel.rob.openingRob ?? 0);
    if (opening > 0) setFuelRobForm((p) => ({ ...p, openingRob: String(opening) }));
  }, [fuel]);

  // sync endAt จาก voy
  useEffect(() => {
    if (!voy) return;
    setEndAtForm(voy.endAt ? toDatetimeLocalValue(voy.endAt) : "");
  }, [voy]);

  const sums = useMemo(() => {
    const base = { count: 0, durationHours: 0, fuelUsed: 0, reeferCount: 0, container20Count: 0, container40Count: 0, fswAvgSpeedSum: 0, fswCount: 0 };
    for (const a of activities) {
      base.count         += 1;
      base.durationHours += hoursBetween(a.startAt, a.endAt);
      base.fuelUsed      += Number(a.fuelUsed ?? 0) || 0;
      base.reeferCount   += Number(a.reeferCount ?? 0) || 0;
      if (a.type === "CARGO_LOAD" || a.type === "CARGO_DISCHARGE" || a.type === "ANCHORING") {
        base.container20Count += Number(a.container20Count ?? 0) || 0;
        base.container40Count += Number(a.container40Count ?? 0) || 0;
      }
      if (a.type === "FULL_SPEED_AWAY" && a.avgSpeed != null) {
        base.fswAvgSpeedSum += Number(a.avgSpeed) || 0;
        base.fswCount       += 1;
      }
    }
    return { ...base, fswAvg: base.fswCount ? base.fswAvgSpeedSum / base.fswCount : 0 };
  }, [activities]);

  const fuelConsumedFromActivities = useMemo(() => {
    const v = fuel?.computed?.consumedFromActivities;
    return v != null ? Number(v) || 0 : Number(sums.fuelUsed) || 0;
  }, [fuel, sums]);

  const fuelBunkeredTotal = useMemo(() =>
    (fuel?.bunkers ?? []).reduce((acc, b) => acc + (Number(b.amount ?? 0) || 0), 0), [fuel]);

  const expectedClosing = useMemo(() =>
    (Number(fuelRobForm.openingRob ?? 0) || 0) + fuelBunkeredTotal - fuelConsumedFromActivities,
    [fuelRobForm.openingRob, fuelBunkeredTotal, fuelConsumedFromActivities]);

  const diff = useMemo(() =>
    (Number(fuelRobForm.closingRob ?? 0) || 0) - expectedClosing,
    [fuelRobForm.closingRob, expectedClosing]);

  // auto-calculate closing ROB
  useEffect(() => {
    const opening = Number(fuelRobForm.openingRob) || 0;
    const closing = opening + fuelBunkeredTotal - fuelConsumedFromActivities;
    setFuelRobForm((p) => ({ ...p, closingRob: closing.toFixed(2) }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fuelRobForm.openingRob, fuelBunkeredTotal, fuelConsumedFromActivities]);

  // ── Activity helpers ──────────────────────────────────────────────────────

  const openCreateActivity = () => {
    const now = new Date();
    setOpenActModal(true); setSavingAct(false); setEditActId(null); setActStep("type"); setActType("");
    setActForm({ ...EMPTY_ACT_FORM, startAt: toDatetimeLocalValue(now), endAt: toDatetimeLocalValue(now) });
  };

  const openEditActivity = (a) => {
    setOpenActModal(true); setSavingAct(false); setEditActId(a.id); setActStep("form"); setActType(a.type);
    setActForm({
      startAt: a.startAt ? toDatetimeLocalValue(a.startAt) : "",
      endAt:   a.endAt   ? toDatetimeLocalValue(a.endAt)   : "",
      container20Count:     a.container20Count     ?? "",
      container40Count:     a.container40Count     ?? "",
      totalContainerWeight: a.totalContainerWeight ?? "",
      draftFore:      a.draftFore      ?? "",
      draftAft:       a.draftAft       ?? "",
      berth:          a.berth          ?? "",
      berthSub:       a.berthSub       ?? "",
      anchorLocation: a.anchorLocation ?? "",
      generator1Count: a.generator1Count ?? "",
      generator1Hours: a.generator1Hours ?? "",
      generator2Count: a.generator2Count ?? "",
      generator2Hours: a.generator2Hours ?? "",
      deckgenCount:    a.deckgenCount    ?? "",
      deckgenHours:    a.deckgenHours    ?? "",
      mainEngine1Count: a.mainEngine1Count ?? "",
      mainEngine1Hours: a.mainEngine1Hours ?? "",
      mainEngine2Count: a.mainEngine2Count ?? "",
      mainEngine2Hours: a.mainEngine2Hours ?? "",
      reeferCount:      a.reeferCount      ?? "",
      fuelUsed:         a.fuelUsed         ?? "",
      avgSpeed:         a.avgSpeed         ?? "",
      currentDirection: a.currentDirection ?? "",
      windDirection:    a.windDirection    ?? "",
      remark:           a.remark           ?? "",
    });
  };

  const closeActModal   = () => { if (savingAct) return; setOpenActModal(false); setEditActId(null); };
  const goNextToActForm = async () => {
    if (!actType) { await alertError("ข้อมูลไม่ครบ", "กรุณาเลือกประเภท Activity"); return; }
    setActStep("form");
  };

  const set = (key) => (e) => setActForm((p) => ({ ...p, [key]: e.target.value }));
  const f   = (key) => String(actForm[key] ?? "").trim();

  const validateActForm = () => {
    if (!actType) return "กรุณาเลือกประเภท Activity";
    if (!actForm.startAt || !actForm.endAt) return "กรุณาเลือกเวลาเริ่ม/สิ้นสุด";
    const s = new Date(toISOFromDatetimeLocal(actForm.startAt));
    const e = new Date(toISOFromDatetimeLocal(actForm.endAt));
    if (e <= s) return "เวลาสิ้นสุดต้องมากกว่าเวลาเริ่ม";
    if (actType === "OTHER") { if (!actForm.remark.trim()) return "กรุณากรอกรายละเอียด"; return null; }

    const isCargo = actType === "CARGO_LOAD" || actType === "CARGO_DISCHARGE";
    const isAnch  = actType === "ANCHORING";
    const isFSW   = actType === "FULL_SPEED_AWAY";
    const isMano  = actType === "MANOEUVRING";

    if (isCargo) {
      const req = [
        ["container20Count","จำนวนตู้ 20\""],["container40Count","จำนวนตู้ 40\""],
        ["totalContainerWeight","น้ำหนักตู้ทั้งหมด"],
        ["generator1Count","เครื่องไฟฟ้า 1 (จำนวน)"],["generator1Hours","เครื่องไฟฟ้า 1 (ชั่วโมง)"],
        ["generator2Count","เครื่องไฟฟ้า 2 (จำนวน)"],["generator2Hours","เครื่องไฟฟ้า 2 (ชั่วโมง)"],
        ["deckgenCount","Deckgen (จำนวน)"],["deckgenHours","Deckgen (ชั่วโมง)"],
        ["reeferCount","จำนวนตู้ Reefer"],
      ];
      for (const [k,lbl] of req) if (f(k)==="") return `กรุณากรอก ${lbl}`;
    }
    if (isAnch) {
      const req = [
        ["container20Count","จำนวนตู้ 20\""],["container40Count","จำนวนตู้ 40\""],
        ["generator1Count","เครื่องไฟฟ้า 1 (จำนวน)"],["generator1Hours","เครื่องไฟฟ้า 1 (ชั่วโมง)"],
        ["generator2Count","เครื่องไฟฟ้า 2 (จำนวน)"],["generator2Hours","เครื่องไฟฟ้า 2 (ชั่วโมง)"],
        ["deckgenCount","Deckgen (จำนวน)"],["deckgenHours","Deckgen (ชั่วโมง)"],
        ["reeferCount","จำนวนตู้ Reefer"],
      ];
      for (const [k,lbl] of req) if (f(k)==="") return `กรุณากรอก ${lbl}`;
    }
    if (isFSW || isMano) {
      const req = [
        ["mainEngine1Count","เครื่องจักรใหญ่ 1 (จำนวน)"],["mainEngine1Hours","เครื่องจักรใหญ่ 1 (ชั่วโมง)"],
        ["mainEngine2Count","เครื่องจักรใหญ่ 2 (จำนวน)"],["mainEngine2Hours","เครื่องจักรใหญ่ 2 (ชั่วโมง)"],
        ["generator1Count","เครื่องไฟฟ้า 1 (จำนวน)"],["generator1Hours","เครื่องไฟฟ้า 1 (ชั่วโมง)"],
        ["generator2Count","เครื่องไฟฟ้า 2 (จำนวน)"],["generator2Hours","เครื่องไฟฟ้า 2 (ชั่วโมง)"],
        ["reeferCount","จำนวนตู้ Reefer"],
      ];
      for (const [k,lbl] of req) if (f(k)==="") return `กรุณากรอก ${lbl}`;
      if (isFSW && f("avgSpeed")==="") return "กรุณากรอกความเร็วเฉลี่ย";
    }
    return null;
  };

  const submitActivity = async (e) => {
    e.preventDefault();
    const msg = validateActForm();
    if (msg) { await alertError("ข้อมูลไม่ครบ/ไม่ถูกต้อง", msg); return; }

    const isCargo = actType === "CARGO_LOAD" || actType === "CARGO_DISCHARGE";
    const isAnch  = actType === "ANCHORING";
    const isFSW   = actType === "FULL_SPEED_AWAY";
    const isMano  = actType === "MANOEUVRING";

    const payload = { type: actType, startAt: toISOFromDatetimeLocal(actForm.startAt), endAt: toISOFromDatetimeLocal(actForm.endAt) };

    if (actType === "OTHER") {
      payload.remark = actForm.remark.trim();
    } else if (isCargo) {
      payload.container20Count     = Number(actForm.container20Count);
      payload.container40Count     = Number(actForm.container40Count);
      payload.totalContainerWeight = Number(actForm.totalContainerWeight);
      payload.generator1Count = Number(actForm.generator1Count);
      payload.generator1Hours = Number(actForm.generator1Hours);
      payload.generator2Count = Number(actForm.generator2Count);
      payload.generator2Hours = Number(actForm.generator2Hours);
      payload.deckgenCount    = Number(actForm.deckgenCount);
      payload.deckgenHours    = Number(actForm.deckgenHours);
      payload.reeferCount     = Number(actForm.reeferCount);
      if (f("draftFore")) payload.draftFore = actForm.draftFore.trim();
      if (f("draftAft"))  payload.draftAft  = actForm.draftAft.trim();
      if (f("berth"))     payload.berth     = actForm.berth;
      if (f("berthSub"))  payload.berthSub  = actForm.berthSub;
      if (f("fuelUsed"))  payload.fuelUsed  = Number(actForm.fuelUsed);
      if (f("remark"))    payload.remark    = actForm.remark.trim();
    } else if (isAnch) {
      payload.container20Count = Number(actForm.container20Count);
      payload.container40Count = Number(actForm.container40Count);
      payload.generator1Count  = Number(actForm.generator1Count);
      payload.generator1Hours  = Number(actForm.generator1Hours);
      payload.generator2Count  = Number(actForm.generator2Count);
      payload.generator2Hours  = Number(actForm.generator2Hours);
      payload.deckgenCount     = Number(actForm.deckgenCount);
      payload.deckgenHours     = Number(actForm.deckgenHours);
      payload.reeferCount      = Number(actForm.reeferCount);
      if (f("draftFore"))      payload.draftFore      = actForm.draftFore.trim();
      if (f("draftAft"))       payload.draftAft       = actForm.draftAft.trim();
      if (f("anchorLocation")) payload.anchorLocation = actForm.anchorLocation.trim();
      if (f("fuelUsed"))       payload.fuelUsed       = Number(actForm.fuelUsed);
      if (f("remark"))         payload.remark         = actForm.remark.trim();
    } else if (isFSW || isMano) {
      payload.reeferCount      = Number(actForm.reeferCount);
      payload.mainEngine1Count = Number(actForm.mainEngine1Count);
      payload.mainEngine1Hours = Number(actForm.mainEngine1Hours);
      payload.mainEngine2Count = Number(actForm.mainEngine2Count);
      payload.mainEngine2Hours = Number(actForm.mainEngine2Hours);
      payload.generator1Count  = Number(actForm.generator1Count);
      payload.generator1Hours  = Number(actForm.generator1Hours);
      payload.generator2Count  = Number(actForm.generator2Count);
      payload.generator2Hours  = Number(actForm.generator2Hours);
      if (f("currentDirection")) payload.currentDirection = actForm.currentDirection;
      if (f("fuelUsed"))         payload.fuelUsed         = Number(actForm.fuelUsed);
      if (f("remark"))           payload.remark           = actForm.remark.trim();
      if (isFSW) {
        payload.avgSpeed = Number(actForm.avgSpeed);
        if (f("windDirection")) payload.windDirection = actForm.windDirection;
      }
    }

    const ok = await alertConfirm({
      title: editActId ? "ยืนยันการบันทึก" : "ยืนยันการสร้าง",
      text: `${editActId ? "บันทึก" : "สร้าง"} ${typeLabel(actType)} ใช่หรือไม่`,
      confirmText: editActId ? "บันทึก" : "สร้าง", cancelText: "ยกเลิก",
    });
    if (!ok) return;

    setSavingAct(true);
    try {
      if (editActId) {
        await updateActivity(editActId, payload);
        await alertSuccess("บันทึกสำเร็จ", "แก้ไข Activity เรียบร้อย");
      } else {
        await createActivity(voyageId, payload);
        await alertSuccess("สร้างสำเร็จ", "เพิ่ม Activity เรียบร้อย");
      }
      setOpenActModal(false); setEditActId(null);
      await fetchActivities(voyageId); await fetchFuel(voyageId);
    } catch (err) {
      await alertError("ทำรายการไม่สำเร็จ", err?.response?.data?.message || err?.message || "ไม่สามารถทำรายการได้");
    } finally { setSavingAct(false); }
  };

  const onDeleteActivity = async (a) => {
    const ok = await alertConfirm({ title: "ยืนยันการลบ", text: `ลบ ${typeLabel(a.type)} ใช่หรือไม่`, confirmText: "ลบ", cancelText: "ยกเลิก" });
    if (!ok) return;
    try {
      await deleteActivity(a.id); await alertSuccess("ลบสำเร็จ", "ลบ Activity เรียบร้อย");
      await fetchActivities(voyageId); await fetchFuel(voyageId);
    } catch (err) { await alertError("ลบไม่สำเร็จ", err?.response?.data?.message || err?.message); }
  };

  // ── Form renderer ─────────────────────────────────────────────────────────

  const renderActFields = () => {
    const isCargo = actType === "CARGO_LOAD" || actType === "CARGO_DISCHARGE";
    const isAnch  = actType === "ANCHORING";
    const isFSW   = actType === "FULL_SPEED_AWAY";
    const isMano  = actType === "MANOEUVRING";
    const isOther = actType === "OTHER";

    const TimeFields = (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div><label className="text-sm text-slate-600">เวลาเริ่ม</label><Input type="datetime-local" value={actForm.startAt} onChange={set("startAt")} /></div>
        <div><label className="text-sm text-slate-600">เวลาสิ้นสุด</label><Input type="datetime-local" value={actForm.endAt} onChange={set("endAt")} /></div>
      </div>
    );
    const GeneratorFields = (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><label className="text-sm text-slate-600">เครื่องไฟฟ้า 1 (จำนวน)</label><Input value={actForm.generator1Count} onChange={set("generator1Count")} placeholder="เช่น 1" /></div>
          <div><label className="text-sm text-slate-600">เครื่องไฟฟ้า 1 (ชั่วโมง)</label><Input value={actForm.generator1Hours} onChange={set("generator1Hours")} placeholder="เช่น 4.5" /></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><label className="text-sm text-slate-600">เครื่องไฟฟ้า 2 (จำนวน)</label><Input value={actForm.generator2Count} onChange={set("generator2Count")} placeholder="เช่น 1" /></div>
          <div><label className="text-sm text-slate-600">เครื่องไฟฟ้า 2 (ชั่วโมง)</label><Input value={actForm.generator2Hours} onChange={set("generator2Hours")} placeholder="เช่น 4.5" /></div>
        </div>
      </>
    );
    const DeckgenFields = (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div><label className="text-sm text-slate-600">Deckgen (จำนวน)</label><Input value={actForm.deckgenCount} onChange={set("deckgenCount")} placeholder="เช่น 1" /></div>
        <div><label className="text-sm text-slate-600">Deckgen (ชั่วโมง)</label><Input value={actForm.deckgenHours} onChange={set("deckgenHours")} placeholder="เช่น 2.5" /></div>
      </div>
    );
    const DraftFields = (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div><label className="text-sm text-slate-600">Draft หัว</label><Input value={actForm.draftFore} onChange={set("draftFore")} placeholder="เช่น 5.20" /></div>
        <div><label className="text-sm text-slate-600">Draft ท้าย</label><Input value={actForm.draftAft} onChange={set("draftAft")} placeholder="เช่น 5.80" /></div>
      </div>
    );
    const MainEngine12Fields = (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><label className="text-sm text-slate-600">เครื่องจักรใหญ่ 1 (จำนวน)</label><Input value={actForm.mainEngine1Count} onChange={set("mainEngine1Count")} placeholder="เช่น 1" /></div>
          <div><label className="text-sm text-slate-600">เครื่องจักรใหญ่ 1 (ชั่วโมง)</label><Input value={actForm.mainEngine1Hours} onChange={set("mainEngine1Hours")} placeholder="เช่น 4.5" /></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><label className="text-sm text-slate-600">เครื่องจักรใหญ่ 2 (จำนวน)</label><Input value={actForm.mainEngine2Count} onChange={set("mainEngine2Count")} placeholder="เช่น 1" /></div>
          <div><label className="text-sm text-slate-600">เครื่องจักรใหญ่ 2 (ชั่วโมง)</label><Input value={actForm.mainEngine2Hours} onChange={set("mainEngine2Hours")} placeholder="เช่น 4.5" /></div>
        </div>
      </>
    );
    const CurrentField = (
      <div>
        <label className="text-sm text-slate-600">กระแสน้ำ</label>
        <Select value={actForm.currentDirection} onChange={set("currentDirection")}>
          <option value="">-- เลือก --</option>
          {CURRENT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </Select>
      </div>
    );
    const FuelRemarkFields = (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div><label className="text-sm text-slate-600">ยอดน้ำมันที่ใช้ (ไม่บังคับ)</label><Input value={actForm.fuelUsed} onChange={set("fuelUsed")} placeholder="เช่น 120.5" /></div>
        <div><label className="text-sm text-slate-600">หมายเหตุ</label><Input value={actForm.remark} onChange={set("remark")} placeholder="หมายเหตุ" /></div>
      </div>
    );

    if (isOther) return (
      <div className="space-y-3">
        {TimeFields}
        <div><label className="text-sm text-slate-600">รายละเอียด</label><Input value={actForm.remark} onChange={set("remark")} placeholder="กรอกรายละเอียด" /></div>
      </div>
    );

    if (isCargo) return (
      <div className="space-y-3">
        {TimeFields}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-slate-600">ท่าเทียบ (โซน)</label>
            <Select value={actForm.berth} onChange={(e) => setActForm((p) => ({ ...p, berth: e.target.value, berthSub: "" }))}>
              <option value="">-- เลือกโซน --</option>
              {BERTH_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
          </div>
          <div>
            <label className="text-sm text-slate-600">ท่าเทียบ (ท่าย่อย)</label>
            <Select value={actForm.berthSub} onChange={set("berthSub")} disabled={!actForm.berth}>
              <option value="">-- เลือกท่า --</option>
              {(BERTH_SUB_OPTIONS[actForm.berth] ?? []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><label className="text-sm text-slate-600">จำนวนตู้ 20"</label><Input value={actForm.container20Count} onChange={set("container20Count")} placeholder="เช่น 10" /></div>
          <div><label className="text-sm text-slate-600">จำนวนตู้ 40"</label><Input value={actForm.container40Count} onChange={set("container40Count")} placeholder="เช่น 5" /></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><label className="text-sm text-slate-600">น้ำหนักตู้ทั้งหมด</label><Input value={actForm.totalContainerWeight} onChange={set("totalContainerWeight")} placeholder="เช่น 350.5" /></div>
          <div><label className="text-sm text-slate-600">จำนวนตู้ Reefer</label><Input value={actForm.reeferCount} onChange={set("reeferCount")} placeholder="เช่น 3" /></div>
        </div>
        {GeneratorFields}{DeckgenFields}{DraftFields}{FuelRemarkFields}
      </div>
    );

    if (isAnch) return (
      <div className="space-y-3">
        {TimeFields}
        <div><label className="text-sm text-slate-600">สถานที่</label><Input value={actForm.anchorLocation} onChange={set("anchorLocation")} placeholder="เช่น อ่าวไทย" /></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><label className="text-sm text-slate-600">จำนวนตู้ 20"</label><Input value={actForm.container20Count} onChange={set("container20Count")} placeholder="เช่น 10" /></div>
          <div><label className="text-sm text-slate-600">จำนวนตู้ 40"</label><Input value={actForm.container40Count} onChange={set("container40Count")} placeholder="เช่น 5" /></div>
        </div>
        <div><label className="text-sm text-slate-600">จำนวนตู้ Reefer</label><Input value={actForm.reeferCount} onChange={set("reeferCount")} placeholder="เช่น 3" /></div>
        {GeneratorFields}{DeckgenFields}{DraftFields}{FuelRemarkFields}
      </div>
    );

    if (isFSW) return (
      <div className="space-y-3">
        {TimeFields}
        <div><label className="text-sm text-slate-600">ความเร็วเฉลี่ย (นอต)</label><Input value={actForm.avgSpeed} onChange={set("avgSpeed")} placeholder="เช่น 12.5" /></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {CurrentField}
          <div>
            <label className="text-sm text-slate-600">ทิศทางลม</label>
            <Select value={actForm.windDirection} onChange={set("windDirection")}>
              <option value="">-- เลือก --</option>
              {WIND_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
          </div>
        </div>
        <div><label className="text-sm text-slate-600">จำนวนตู้ Reefer</label><Input value={actForm.reeferCount} onChange={set("reeferCount")} placeholder="เช่น 3" /></div>
        {MainEngine12Fields}{GeneratorFields}{FuelRemarkFields}
      </div>
    );

    if (isMano) return (
      <div className="space-y-3">
        {TimeFields}
        {CurrentField}
        <div><label className="text-sm text-slate-600">จำนวนตู้ Reefer</label><Input value={actForm.reeferCount} onChange={set("reeferCount")} placeholder="เช่น 3" /></div>
        {MainEngine12Fields}{GeneratorFields}{FuelRemarkFields}
      </div>
    );

    return null;
  };

  // ── Fuel / EndAt helpers ──────────────────────────────────────────────────

  const saveEndAt = async () => {
    if (!endAtForm) return alertError("ข้อมูลไม่ครบ", "กรุณาเลือกวันที่สิ้นสุด");
    const endAt = toISOFromDatetimeLocal(endAtForm);
    if (voy?.startAt && new Date(endAt) <= new Date(voy.startAt)) {
      return alertError("ข้อมูลไม่ถูกต้อง", "วันที่สิ้นสุดต้องมากกว่าวันที่เริ่ม");
    }
    const ok = await alertConfirm({ title: "ยืนยัน", text: "ต้องการบันทึกวันที่สิ้นสุดใช่หรือไม่", confirmText: "บันทึก", cancelText: "ยกเลิก" });
    if (!ok) return;
    setSavingEndAt(true);
    try {
      await updateVoyage(voyageId, { endAt });
      await fetchAll(voyageId);
      setEditingEndAt(false);
      await alertSuccess("บันทึกสำเร็จ", "อัปเดตวันที่สิ้นสุดเรียบร้อย");
    } catch (err) {
      await alertError("บันทึกไม่สำเร็จ", err?.response?.data?.message || err?.message);
    } finally { setSavingEndAt(false); }
  };

  const saveRob = async () => {
    if (!voy?.endAt) return alertError("ข้อมูลไม่ครบ", "กรุณาระบุวันที่สิ้นสุด Voyage ก่อนบันทึก ROB");
    const opening = Number(fuelRobForm.openingRob);
    const closing = Number(fuelRobForm.closingRob);
    if (Number.isNaN(opening) || opening < 0) return alertError("ข้อมูลไม่ถูกต้อง", "น้ำมันคงเหลือตอนเริ่มงาน ต้องเป็นตัวเลขและ >= 0");
    const ok = await alertConfirm({ title: "ยืนยันการบันทึก", text: "ต้องการบันทึก ROB ใช่หรือไม่", confirmText: "บันทึก", cancelText: "ยกเลิก" });
    if (!ok) return;
    try {
      await updateFuelRob(voyageId, { openingRob: opening, closingRob: closing, unit: "L" });
      await alertSuccess("บันทึกสำเร็จ", "อัปเดต ROB เรียบร้อย");
      setRobSaved(true);
      await fetchFuel(voyageId);
    } catch (err) { await alertError("บันทึกไม่สำเร็จ", err?.response?.data?.message || err?.message); }
  };

  const openCreateBunker = () => {
    const now = new Date();
    setOpenBunkerModal(true); setSavingBunker(false); setEditBunkerId(null);
    setBunkerForm({ at: toDatetimeLocalValue(now), amount: "", remark: "" });
  };
  const openEditBunker = (b) => {
    setOpenBunkerModal(true); setSavingBunker(false); setEditBunkerId(b.id);
    setBunkerForm({ at: b.at ? toDatetimeLocalValue(b.at) : "", amount: b.amount ?? "", remark: b.remark ?? "" });
  };
  const closeBunkerModal = () => { if (savingBunker) return; setOpenBunkerModal(false); setEditBunkerId(null); };

  const submitBunker = async (e) => {
    e.preventDefault();
    if (!bunkerForm.at) return alertError("ข้อมูลไม่ครบ", "กรุณาเลือกวันที่/เวลา");
    const amount = Number(bunkerForm.amount);
    if (Number.isNaN(amount) || amount <= 0) return alertError("ข้อมูลไม่ถูกต้อง", "จำนวนที่เติมต้องเป็นตัวเลขและ > 0");
    const ok = await alertConfirm({ title: editBunkerId ? "ยืนยันการบันทึก" : "ยืนยันการเพิ่ม", text: "ต้องการบันทึกใช่หรือไม่", confirmText: editBunkerId ? "บันทึก" : "เพิ่ม", cancelText: "ยกเลิก" });
    if (!ok) return;
    setSavingBunker(true);
    try {
      const payload = { at: toISOFromDatetimeLocal(bunkerForm.at), amount, unit: "L", remark: bunkerForm.remark?.trim() || undefined };
      if (editBunkerId) { await updateFuelBunker(editBunkerId, payload); await alertSuccess("บันทึกสำเร็จ", "แก้ไขรายการเติมเรียบร้อย"); }
      else              { await createFuelBunker(voyageId, payload);     await alertSuccess("เพิ่มสำเร็จ",   "เพิ่มรายการเติมเรียบร้อย"); }
      closeBunkerModal(); await fetchFuel(voyageId);
    } catch (err) { await alertError("ทำรายการไม่สำเร็จ", err?.response?.data?.message || err?.message); }
    finally { setSavingBunker(false); }
  };

  const onDeleteBunker = async (b) => {
    const ok = await alertConfirm({ title: "ยืนยันการลบ", text: "ต้องการลบรายการเติมใช่หรือไม่", confirmText: "ลบ", cancelText: "ยกเลิก" });
    if (!ok) return;
    try { await deleteFuelBunker(b.id); await alertSuccess("ลบสำเร็จ", "ลบรายการเติมเรียบร้อย"); await fetchFuel(voyageId); }
    catch (err) { await alertError("ลบไม่สำเร็จ", err?.response?.data?.message || err?.message); }
  };

  const loading = loadingVoy;
  const hasVoy  = !!voy;

  const byTypeRows = useMemo(() => {
    const map = fuel?.computed?.byActivityType;
    if (map && typeof map === "object" && Object.keys(map).length > 0) {
      return ACTIVITY_TYPES.filter((t) => t.value !== "OTHER").map((t) => ({ type: t.value, label: t.label, sum: Number(map[t.value] ?? 0) || 0 }));
    }
    return ACTIVITY_TYPES.filter((t) => t.value !== "OTHER").map((t) => {
      const sum = activities.filter((a) => a.type === t.value).reduce((acc, a) => acc + (Number(a.fuelUsed ?? 0) || 0), 0);
      return { type: t.value, label: t.label, sum };
    });
  }, [fuel, activities]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2 cursor-pointer"><ArrowLeft size={16} />กลับ</Button>
          <div>
            <div className="text-2xl font-semibold flex items-center gap-2"><Route size={22} />{title}</div>
            <div className="text-sm text-slate-500">รายละเอียด</div>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="font-medium">ข้อมูล</div>
            <div className="flex gap-2">
              <TabButton active={tab === "activity"}    onClick={() => setTab("activity")}    icon={ClipboardList}>Activity</TabButton>
              <TabButton active={tab === "consumption"} onClick={() => setTab("consumption")} icon={Droplets}>Consumption</TabButton>
            </div>
          </div>
        </CardHeader>

        <CardBody>
          {loading ? <div className="text-sm text-slate-500">กำลังโหลด...</div>
          : !hasVoy ? <div className="text-sm text-slate-500">ไม่พบข้อมูล</div>
          : (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "voyNo",              value: voy.voyNo ?? "-" },
                  { label: "เริ่ม",              value: fmtDateTime(voy.startAt) },
                  { label: "สิ้นสุด",            value: fmtDateTime(voy.endAt) },
                  { label: "เดือน/ปี ที่บันทึก", value: voy.postingMonth && voy.postingYear ? `${voy.postingMonth}/${voy.postingYear}` : "-" },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <div className="text-xs text-slate-500">{item.label}</div>
                    <div className="text-sm font-semibold text-slate-900">{item.value}</div>
                  </div>
                ))}
              </div>

              {tab === "activity" ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium text-slate-900">Activity</div>
                    {!isCharterer && (
                      <Button onClick={openCreateActivity} className="gap-2 cursor-pointer">
                        <Plus size={16} /> สร้าง Activity
                      </Button>
                    )}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl border border-slate-100 bg-white p-3"><div className="text-xs text-slate-500">จำนวนรายการ</div><div className="text-lg font-semibold text-slate-900">{sums.count}</div></div>
                    <div className="rounded-xl border border-slate-100 bg-white p-3"><div className="text-xs text-slate-500">ชั่วโมงรวม</div><div className="text-lg font-semibold text-slate-900">{sums.durationHours.toFixed(2)}</div></div>
                    <div className="rounded-xl border border-slate-100 bg-white p-3"><div className="text-xs text-slate-500">FuelUsed รวม</div><div className="text-lg font-semibold text-slate-900">{sums.fuelUsed.toFixed(2)}</div></div>
                    <div className="rounded-xl border border-slate-100 bg-white p-3">
                      <div className="text-xs text-slate-500">ตู้รวม (20" + 40")</div>
                      <div className="text-lg font-semibold text-slate-900">
                        {sums.container20Count + sums.container40Count}
                        <span className="text-xs font-normal text-slate-400 ml-1">({sums.container20Count} + {sums.container40Count})</span>
                      </div>
                    </div>
                  </div>

                  {loadingActivities ? <div className="text-sm text-slate-500">กำลังโหลด...</div>
                  : activities.length === 0 ? <div className="text-sm text-slate-500">ยังไม่มี Activity</div>
                  : (
                    <div className="overflow-auto rounded-xl border border-slate-100">
                      <table className="min-w-full text-sm">
                        <thead className="bg-slate-50 text-slate-600">
                          <tr>
                            <th className="text-left font-medium px-4 py-3">ประเภท</th>
                            <th className="text-left font-medium px-4 py-3">เริ่ม</th>
                            <th className="text-left font-medium px-4 py-3">สิ้นสุด</th>
                            <th className="text-left font-medium px-4 py-3">ชั่วโมง</th>
                            <th className="text-left font-medium px-4 py-3">FuelUsed</th>
                            <th className="text-right font-medium px-4 py-3">ตัวเลือก</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activities.map((a) => (
                            <tr key={a.id} className="border-t border-slate-100 hover:bg-white">
                              <td className="px-4 py-3 text-slate-900">{typeLabel(a.type)}</td>
                              <td className="px-4 py-3 text-slate-700">{fmtDateTime(a.startAt)}</td>
                              <td className="px-4 py-3 text-slate-700">{fmtDateTime(a.endAt)}</td>
                              <td className="px-4 py-3 text-slate-700">{hoursBetween(a.startAt, a.endAt).toFixed(2)}</td>
                              <td className="px-4 py-3 text-slate-700">{a.fuelUsed != null ? Number(a.fuelUsed).toFixed(2) : "-"}</td>
                              <td className="px-4 py-3 text-right">
                                {!isCharterer && (
                                  <div className="inline-flex gap-2">
                                    <Button variant="ghost" className="gap-2 cursor-pointer" onClick={() => openEditActivity(a)}><Pencil size={16} />แก้ไข</Button>
                                    <Button variant="ghost" className="gap-2 text-rose-700 cursor-pointer" onClick={() => onDeleteActivity(a)}><Trash2 size={16} />ลบ</Button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium text-slate-900">Consumption (Fuel)</div>
                    <div className="flex gap-2">
                      <Button variant="ghost" onClick={() => fetchFuel(voyageId)} className="cursor-pointer">รีเฟรช</Button>
                      {!isCharterer && (
                        <Button onClick={openCreateBunker} className="gap-2 cursor-pointer">
                          <Plus size={16} /> เพิ่มรายการเติม
                        </Button>
                      )}
                    </div>
                  </div>

                  {loadingFuel ? <div className="text-sm text-slate-500">กำลังโหลด...</div> : (
                    <>
                      {/* วันที่สิ้นสุด */}
                      {!isCharterer && (
                        <div className="rounded-xl border border-slate-100 bg-white p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-sm font-medium text-slate-700">วันที่สิ้นสุด Voyage</div>
                            {!editingEndAt && (
                              <button
                                onClick={() => setEditingEndAt(true)}
                                className="text-xs text-blue-600 hover:underline cursor-pointer"
                              >
                                {voy?.endAt ? "แก้ไข" : "ระบุวันที่"}
                              </button>
                            )}
                          </div>

                          {editingEndAt ? (
                            <div className="flex gap-2 items-center">
                              <div className="flex-1">
                                <Input
                                  type="datetime-local"
                                  value={endAtForm}
                                  onChange={(e) => setEndAtForm(e.target.value)}
                                />
                              </div>
                              <Button onClick={saveEndAt} disabled={savingEndAt} className="cursor-pointer shrink-0">
                                {savingEndAt ? "กำลังบันทึก..." : "บันทึก"}
                              </Button>
                              <Button
                                variant="ghost"
                                onClick={() => { setEditingEndAt(false); setEndAtForm(voy?.endAt ? toDatetimeLocalValue(voy.endAt) : ""); }}
                                disabled={savingEndAt}
                                className="cursor-pointer shrink-0"
                              >
                                ยกเลิก
                              </Button>
                            </div>
                          ) : (
                            <div className={["text-sm", voy?.endAt ? "text-slate-900 font-medium" : "text-amber-600"].join(" ")}>
                              {voy?.endAt ? fmtDateTime(voy.endAt) : "⚠ ยังไม่ระบุวันที่สิ้นสุด (จำเป็นสำหรับบันทึก ROB)"}
                            </div>
                          )}
                        </div>
                      )}

                      {/* ROB Cards */}
                      <div className="grid gap-3 lg:grid-cols-3">

                        {/* Opening ROB */}
                        <div className="rounded-xl border border-slate-100 bg-white p-4 space-y-3">
                          <div className="text-xs text-slate-500">น้ำมันคงเหลือตอนเริ่มงาน (ลิตร)</div>

                          <div className="space-y-0.5">
                            <div className="text-lg font-semibold text-slate-900">
                              {Number(fuelRobForm.openingRob || 0).toLocaleString()} L
                            </div>
                            {manualMeasureDate && manualRob ? (
                              <div className="text-xs text-blue-600">
                                วัดเมื่อ {fmtDateTime(new Date(manualMeasureDate))}
                              </div>
                            ) : prevRobInfo?.hasPrevious ? (
                              <div className="text-xs text-emerald-600">
                                auto จาก {prevRobInfo.fromVoyNo} ({new Date(prevRobInfo.fromEndAt).toLocaleDateString("th-TH")})
                              </div>
                            ) : null}
                          </div>

                          {!isCharterer && (
                            <div className="border-t border-slate-100 pt-3 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-500">วัดน้ำมันคงเหลือ</span>
                                <button
                                  onClick={() => setShowManualInput((p) => !p)}
                                  className="text-xs text-blue-600 hover:underline cursor-pointer"
                                >
                                  {showManualInput ? "ซ่อน" : "กรอกค่า"}
                                </button>
                              </div>
                              {showManualInput && (
                                <div className="space-y-2">
                                  <div>
                                    <label className="text-xs text-slate-500">วันที่วัด</label>
                                    <Input
                                      type="datetime-local"
                                      value={manualMeasureDate}
                                      onChange={(e) => setManualMeasureDate(e.target.value)}
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs text-slate-500">น้ำมันคงเหลือ (ลิตร)</label>
                                    <Input
                                      type="number"
                                      value={manualRob}
                                      onChange={(e) => setManualRob(e.target.value)}
                                      placeholder="เช่น 12000"
                                    />
                                  </div>
                                  <Button
                                    className="w-full cursor-pointer"
                                    onClick={() => {
                                      if (!manualRob)         return alertError("ข้อมูลไม่ครบ", "กรุณากรอกน้ำมันคงเหลือ");
                                      if (!manualMeasureDate) return alertError("ข้อมูลไม่ครบ", "กรุณาเลือกวันที่วัด");
                                      setFuelRobForm((p) => ({ ...p, openingRob: manualRob }));
                                      setShowManualInput(false);
                                    }}
                                  >
                                    บันทึกค่าวัด
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Closing ROB */}
                        <div className="rounded-xl border border-slate-100 bg-white p-4 space-y-1">
                          <div className="text-xs text-slate-500">น้ำมันคงเหลือตอนจบงาน (ลิตร)</div>
                          <div className="text-lg font-semibold text-slate-900">
                            {Number(fuelRobForm.closingRob || 0).toLocaleString()} L
                          </div>
                          <div className="text-xs text-slate-400">คำนวณอัตโนมัติ</div>
                        </div>

                        {/* ตรวจสอบ */}
                        <div className="rounded-xl border border-slate-100 bg-white p-4 flex flex-col justify-between">
                          <div>
                            <div className="text-xs text-slate-500">ตรวจสอบ</div>
                            <div className="mt-2 space-y-1 text-sm">
                              <div className="flex justify-between"><span className="text-slate-600">Opening ROB</span><span className="font-medium text-slate-900">{(Number(fuelRobForm.openingRob) || 0).toFixed(2)}</span></div>
                              <div className="flex justify-between"><span className="text-slate-600">Total Bunkered</span><span className="font-medium text-slate-900">{fuelBunkeredTotal.toFixed(2)}</span></div>
                              <div className="flex justify-between"><span className="text-slate-600">Consumed</span><span className="font-medium text-slate-900">{fuelConsumedFromActivities.toFixed(2)}</span></div>
                              <div className="flex justify-between border-t border-slate-100 pt-1">
                                <span className="text-slate-600 font-medium">Closing ROB</span>
                                <span className="font-semibold text-slate-900">{(Number(fuelRobForm.closingRob) || 0).toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                          {!isCharterer && (
                            <div className="pt-3">
                              {robSaved ? (
                                <Button variant="ghost" className="w-full cursor-pointer gap-2" onClick={() => setRobSaved(false)}>
                                  <Pencil size={16} /> แก้ไข ROB
                                </Button>
                              ) : (
                                <Button onClick={saveRob} className="w-full cursor-pointer">บันทึก ROB</Button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* สรุปการใช้งานตาม Activity */}
                      <div className="rounded-xl border border-slate-100 bg-white p-4">
                        <div className="font-medium text-slate-900 mb-3">สรุปการใช้งานตาม Activity</div>
                        <div className="overflow-auto rounded-xl border border-slate-100">
                          <table className="min-w-full text-sm">
                            <thead className="bg-slate-50 text-slate-600">
                              <tr><th className="text-left font-medium px-4 py-3">ประเภท</th><th className="text-right font-medium px-4 py-3">FuelUsed (ลิตร)</th></tr>
                            </thead>
                            <tbody>
                              {byTypeRows.map((r) => (
                                <tr key={r.type} className="border-t border-slate-100">
                                  <td className="px-4 py-3 text-slate-900">{r.label}</td>
                                  <td className="px-4 py-3 text-right text-slate-900 font-medium">{r.sum.toFixed(2)}</td>
                                </tr>
                              ))}
                              <tr className="border-t border-slate-100 bg-slate-50">
                                <td className="px-4 py-3 text-slate-900 font-semibold">รวม</td>
                                <td className="px-4 py-3 text-right text-slate-900 font-semibold">{fuelConsumedFromActivities.toFixed(2)}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* รายการเติมน้ำมัน */}
                      <div className="rounded-xl border border-slate-100 bg-white p-4">
                        <div className="font-medium text-slate-900 mb-3">รายการเติมน้ำมัน</div>
                        {fuel?.bunkers?.length ? (
                          <div className="overflow-auto rounded-xl border border-slate-100">
                            <table className="min-w-full text-sm">
                              <thead className="bg-slate-50 text-slate-600">
                                <tr>
                                  <th className="text-left font-medium px-4 py-3">วันที่/เวลา</th>
                                  <th className="text-right font-medium px-4 py-3">จำนวน (ลิตร)</th>
                                  <th className="text-left font-medium px-4 py-3">หมายเหตุ</th>
                                  <th className="text-right font-medium px-4 py-3">ตัวเลือก</th>
                                </tr>
                              </thead>
                              <tbody>
                                {fuel.bunkers.map((b) => (
                                  <tr key={b.id} className="border-t border-slate-100 hover:bg-white">
                                    <td className="px-4 py-3 text-slate-700">{fmtDateTime(b.at)}</td>
                                    <td className="px-4 py-3 text-right text-slate-900 font-medium">{(Number(b.amount ?? 0) || 0).toFixed(2)}</td>
                                    <td className="px-4 py-3 text-slate-700">{b.remark || "-"}</td>
                                    <td className="px-4 py-3 text-right">
                                      {!isCharterer && (
                                        <div className="inline-flex gap-2">
                                          <Button variant="ghost" className="gap-2 cursor-pointer" onClick={() => openEditBunker(b)}><Pencil size={16} />แก้ไข</Button>
                                          <Button variant="ghost" className="gap-2 text-rose-700 cursor-pointer" onClick={() => onDeleteBunker(b)}><Trash2 size={16} />ลบ</Button>
                                        </div>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : <div className="text-sm text-slate-500">ยังไม่มีรายการเติม</div>}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Activity Modal */}
      {openActModal && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={closeActModal} />
          <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-xl -translate-x-1/2 -translate-y-1/2 max-h-[90vh] overflow-y-auto">
            <Card className="shadow-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{editActId ? "แก้ไข Activity" : "สร้าง Activity"}</div>
                  <Button variant="ghost" onClick={closeActModal} disabled={savingAct} className="cursor-pointer"><X size={18} /></Button>
                </div>
              </CardHeader>
              <CardBody>
                {actStep === "type" ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-slate-600">ประเภท</label>
                      <Select value={actType} onChange={(e) => setActType(e.target.value)}>
                        <option value="">-- เลือก --</option>
                        {ACTIVITY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </Select>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <Button type="button" variant="ghost" onClick={closeActModal} className="cursor-pointer">ยกเลิก</Button>
                      <Button type="button" className="gap-2 cursor-pointer" onClick={goNextToActForm}>ถัดไป</Button>
                    </div>
                  </div>
                ) : (
                  <form className="space-y-3" onSubmit={submitActivity}>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-slate-600">ประเภท: <span className="font-medium text-slate-900">{typeLabel(actType)}</span></div>
                      <Button type="button" variant="ghost" onClick={() => setActStep("type")} disabled={savingAct} className="cursor-pointer">เปลี่ยนประเภท</Button>
                    </div>
                    {renderActFields()}
                    <div className="flex justify-end gap-2 pt-2">
                      <Button type="button" variant="ghost" onClick={closeActModal} disabled={savingAct} className="cursor-pointer">ยกเลิก</Button>
                      <Button type="submit" disabled={savingAct} className="gap-2 cursor-pointer">
                        <Plus size={16} />{savingAct ? "กำลังบันทึก..." : editActId ? "บันทึก" : "สร้าง"}
                      </Button>
                    </div>
                  </form>
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      )}

      {/* Bunker Modal */}
      {openBunkerModal && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={closeBunkerModal} />
          <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2">
            <Card className="shadow-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{editBunkerId ? "แก้ไขรายการเติม" : "เพิ่มรายการเติม"}</div>
                  <Button variant="ghost" onClick={closeBunkerModal} disabled={savingBunker} className="cursor-pointer"><X size={18} /></Button>
                </div>
              </CardHeader>
              <CardBody>
                <form className="space-y-3" onSubmit={submitBunker}>
                  <div><label className="text-sm text-slate-600">วันที่/เวลา</label><Input type="datetime-local" value={bunkerForm.at} onChange={(e) => setBunkerForm((p) => ({ ...p, at: e.target.value }))} /></div>
                  <div><label className="text-sm text-slate-600">จำนวน (ลิตร)</label><Input value={bunkerForm.amount} onChange={(e) => setBunkerForm((p) => ({ ...p, amount: e.target.value }))} placeholder="เช่น 5000" /></div>
                  <div><label className="text-sm text-slate-600">หมายเหตุ (ถ้ามี)</label><Input value={bunkerForm.remark} onChange={(e) => setBunkerForm((p) => ({ ...p, remark: e.target.value }))} placeholder="เช่น ท่าเรือ" /></div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="ghost" onClick={closeBunkerModal} disabled={savingBunker} className="cursor-pointer">ยกเลิก</Button>
                    <Button type="submit" disabled={savingBunker} className="cursor-pointer">{savingBunker ? "กำลังบันทึก..." : editBunkerId ? "บันทึก" : "เพิ่ม"}</Button>
                  </div>
                </form>
              </CardBody>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}