import { useEffect, useMemo, useRef, useState } from "react";
import {
  MoreVertical, Plus, Route, Search, X, Pencil, Trash2, Power,
} from "lucide-react";
import { ExternalLinkIcon, BarChart3 } from "lucide-react";

import { api } from "../lib/api";
import { alertConfirm, alertError, alertSuccess } from "../lib/alert";
import { useAuthStore } from "../stores/auth.store";

import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import VoyFuelReportModal from "../components/reports/VoyFuelReportModal";
import { useNavigate } from "react-router-dom";

function fmtDateTime(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" });
}

function pad2(n) { return String(n).padStart(2, "0"); }

function toDatetimeLocalValue(date) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function toISOFromDatetimeLocal(v) { return new Date(v).toISOString(); }

const monthOptions = [
  { value: "all", label: "ทั้งหมด" },
  ...Array.from({ length: 12 }).map((_, i) => ({ value: String(i + 1), label: String(i + 1) })),
];

function yearOptions() {
  const y = new Date().getFullYear();
  return [
    { value: "all", label: "ทั้งหมด" },
    ...[y - 1, y, y + 1, y + 2].map((yy) => ({ value: String(yy), label: String(yy) })),
  ];
}

function statusLabel(status) { return status || "-"; }

export default function VoyPage() {
  const me = useAuthStore((s) => s.me);
  const canManage = useMemo(() => ["EMPLOYEE", "SUPERVISOR", "MANAGER", "ADMIN"].includes(me?.role), [me?.role]);
  const navigate = useNavigate();
  const isPrivileged = ["SUPERVISOR", "MANAGER", "ADMIN"].includes(me?.role);

  const [vessels, setVessels] = useState([]);
  const [loadingVessels, setLoadingVessels] = useState(true);

  const [filters, setFilters] = useState({
    vesselId: "all",
    month: String(new Date().getMonth() + 1),
    year: String(new Date().getFullYear()),
    q: "",
  });

  const [rows, setRows] = useState([]);
  const [loadingRows, setLoadingRows] = useState(true);

  // ── Report state ───────────────────────────────────────────────────────────
  const [openReportFilter, setOpenReportFilter] = useState(false);
  const [openReport, setOpenReport] = useState(false);
  const [reportVesselId, setReportVesselId] = useState("");
  const [reportPeriods, setReportPeriods] = useState([]);
  const [reportPeriodKey, setReportPeriodKey] = useState("");
  const [loadingReportPeriods, setLoadingReportPeriods] = useState(false);
  const [reportVoyages, setReportVoyages] = useState([]);
  const [reportVessel, setReportVessel] = useState(null);

  // ── Create modal ───────────────────────────────────────────────────────────
  const [openCreate, setOpenCreate] = useState(false);
  const [savingCreate, setSavingCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ vesselId: "", voyNo: "", startAt: "", postingMonth: "", postingYear: "" });

  // ── Edit modal ─────────────────────────────────────────────────────────────
  const [openEdit, setOpenEdit] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [editForm, setEditForm] = useState({ vesselId: "", voyNo: "", startAt: "", endAt: "", postingMonth: "", postingYear: "", status: "" });

  // ── Row actions menu ───────────────────────────────────────────────────────
  const [menuOpenId, setMenuOpenId] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (!menuRef.current) return;
      if (menuRef.current.contains(e.target)) return;
      setMenuOpenId(null);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // ── Load vessels ───────────────────────────────────────────────────────────

  const loadVessels = async () => {
    setLoadingVessels(true);
    try {
      const { data } = await api.get("/api/vessels");
      const list = Array.isArray(data) ? data : data?.vessels ?? [];
      setVessels(list);
      if (list.length === 1) setFilters((p) => ({ ...p, vesselId: String(list[0].id) }));
    } catch (e) {
      await alertError("โหลดเรือไม่สำเร็จ", e?.response?.data?.message || "ไม่สามารถโหลดรายการเรือได้");
    } finally {
      setLoadingVessels(false);
    }
  };

  const fetchVoyagesOfVessel = async (vessel) => {
    const params = {};
    if (filters.year !== "all") params.year = Number(filters.year);
    if (filters.month !== "all") params.month = Number(filters.month);
    const { data } = await api.get(`/api/vessels/${vessel.id}/voyages`, { params });
    const list = Array.isArray(data) ? data : data?.voyages ?? [];
    return list.map((v) => ({ ...v, _vessel: { id: vessel.id, name: vessel.name, code: vessel.code } }));
  };

  const loadRows = async () => {
    setLoadingRows(true);
    try {
      if (!vessels || vessels.length === 0) { setRows([]); return; }
      const selected = filters.vesselId;
      let all = [];
      if (selected === "all") {
        const result = await Promise.all(vessels.map((v) => fetchVoyagesOfVessel(v)));
        all = result.flat();
      } else {
        const vessel = vessels.find((v) => String(v.id) === String(selected));
        if (!vessel) { setRows([]); return; }
        all = await fetchVoyagesOfVessel(vessel);
      }
      const q = filters.q.trim().toLowerCase();
      if (q) {
        all = all.filter((r) =>
          (r._vessel?.name ?? "").toLowerCase().includes(q) ||
          (r.status ?? "").toLowerCase().includes(q) ||
          `${r.postingYear ?? ""}-${r.postingMonth ?? ""}`.toLowerCase().includes(q) ||
          String(r.voyNo ?? "").toLowerCase().includes(q) ||
          String(r.id ?? "").includes(q)
        );
      }
      all.sort((a, b) => new Date(b.startAt ?? 0).getTime() - new Date(a.startAt ?? 0).getTime());
      setRows(all);
    } catch (e) {
      await alertError("โหลด Voy ไม่สำเร็จ", e?.response?.data?.message || "ไม่สามารถโหลดรายการ Voy ได้");
    } finally {
      setLoadingRows(false);
    }
  };

  useEffect(() => { loadVessels(); }, []);
  useEffect(() => { if (!loadingVessels) loadRows(); }, [loadingVessels, vessels, filters.vesselId, filters.month, filters.year, filters.q]);

  // ── Report ─────────────────────────────────────────────────────────────────

  const loadReportPeriods = async (vesselId) => {
    if (!vesselId) { setReportPeriods([]); return; }
    setLoadingReportPeriods(true);
    try {
      const { data } = await api.get(`/api/vessels/${vesselId}/voyages`);
      const list = Array.isArray(data) ? data : data?.voyages ?? [];
      const seen = new Set();
      const periods = [];
      for (const v of list) {
        if (!v.postingMonth || !v.postingYear) continue;
        const key = `${v.postingYear}-${String(v.postingMonth).padStart(2, "0")}`;
        if (!seen.has(key)) {
          seen.add(key);
          periods.push({ month: v.postingMonth, year: v.postingYear, key, label: `${v.postingMonth}/${v.postingYear}` });
        }
      }
      periods.sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month);
      setReportPeriods(periods);
      setReportPeriodKey(periods[periods.length - 1]?.key ?? "");
    } catch (e) {
      await alertError("โหลดข้อมูลไม่สำเร็จ", e?.response?.data?.message || "ไม่สามารถโหลดช่วงเดือนได้");
    } finally {
      setLoadingReportPeriods(false);
    }
  };

  const onOpenReportFilter = () => {
    const preVesselId = filters.vesselId !== "all" ? filters.vesselId : (vessels[0] ? String(vessels[0].id) : "");
    setReportVesselId(preVesselId);
    setReportPeriods([]);
    setReportPeriodKey("");
    setOpenReportFilter(true);
    if (preVesselId) loadReportPeriods(preVesselId);
  };

  const submitReportFilter = async () => {
    if (!reportVesselId) return alertError("ข้อมูลไม่ครบ", "กรุณาเลือกเรือ");
    if (!reportPeriodKey) return alertError("ข้อมูลไม่ครบ", "กรุณาเลือกเดือน/ปี");

    const period = reportPeriods.find((p) => p.key === reportPeriodKey);
    if (!period) return alertError("ข้อมูลไม่ถูกต้อง", "ไม่พบช่วงเวลาที่เลือก");

    try {
      const { data } = await api.get(`/api/vessels/${reportVesselId}/voyages`);
      const all = Array.isArray(data) ? data : data?.voyages ?? [];

      const filtered = all
        .filter((v) => {
          if (!v.postingMonth || !v.postingYear) return false;
          const key = `${v.postingYear}-${String(v.postingMonth).padStart(2, "0")}`;
          return key === reportPeriodKey;
        })
        .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()); // ← เพิ่มบรรทัดนี้

      if (filtered.length === 0) return alertError("ไม่มีข้อมูล", "ไม่พบ Voyage ในเดือน/ปีที่เลือก");

      const vessel = vessels.find((v) => String(v.id) === String(reportVesselId));
      setReportVessel(vessel ?? null);
      setReportVoyages(filtered);
      setOpenReportFilter(false);
      setOpenReport(true);
    } catch (e) {
      await alertError("โหลดข้อมูลไม่สำเร็จ", e?.response?.data?.message || "ไม่สามารถโหลด Voyage ได้");
    }
  };

  // ── Create ─────────────────────────────────────────────────────────────────

  const onOpenCreate = () => {
    const now = new Date();
    const firstVesselId = vessels.length === 1 ? String(vessels[0].id) : filters.vesselId !== "all" ? String(filters.vesselId) : "";
    setCreateForm({
      vesselId: firstVesselId, voyNo: "",
      startAt: toDatetimeLocalValue(now),
      postingMonth: filters.month !== "all" ? String(filters.month) : String(now.getMonth() + 1),
      postingYear: filters.year !== "all" ? String(filters.year) : String(now.getFullYear()),
    });
    setOpenCreate(true);
  };

  const onCloseCreate = () => { if (savingCreate) return; setOpenCreate(false); };

  const submitCreate = async (e) => {
    e.preventDefault();
    const vesselId = Number(createForm.vesselId);
    if (!vesselId) return alertError("ข้อมูลไม่ครบ", "กรุณาเลือกเรือ");
    const voyNo = createForm.voyNo.trim();
    if (!voyNo) return alertError("ข้อมูลไม่ครบ", "กรุณากรอก voyNo");
    if (!createForm.startAt) return alertError("ข้อมูลไม่ครบ", "กรุณาเลือกเวลาเริ่ม");
    const startAt = toISOFromDatetimeLocal(createForm.startAt);
    const postingMonth = Number(createForm.postingMonth);
    const postingYear = Number(createForm.postingYear);
    if (!postingMonth || postingMonth < 1 || postingMonth > 12) return alertError("ข้อมูลไม่ถูกต้อง", "เดือนที่บันทึกต้องอยู่ระหว่าง 1-12");
    if (!postingYear || postingYear < 2000) return alertError("ข้อมูลไม่ถูกต้อง", "ปีที่บันทึกไม่ถูกต้อง");
    const vesselName = vessels.find((v) => v.id === vesselId)?.name ?? `ID ${vesselId}`;
    const ok = await alertConfirm({ title: "ยืนยันการสร้าง Voy", text: `สร้าง Voy ${voyNo} ของเรือ "${vesselName}" ใช่หรือไม่`, confirmText: "สร้าง", cancelText: "ยกเลิก" });
    if (!ok) return;
    setSavingCreate(true);
    try {
      await api.post(`/api/vessels/${vesselId}/voyages`, { voyNo, startAt, postingMonth, postingYear });
      setOpenCreate(false);
      await alertSuccess("สร้างสำเร็จ", "สร้าง Voy เรียบร้อย");
      await loadRows();
    } catch (e2) {
      await alertError("สร้างไม่สำเร็จ", e2?.response?.data?.message || "ไม่สามารถสร้าง Voy ได้");
    } finally { setSavingCreate(false); }
  };

  // ── Edit ───────────────────────────────────────────────────────────────────

  const onOpenEdit = (row) => {
    setMenuOpenId(null);
    setEditingRow(row);
    setEditForm({
      vesselId: String(row._vessel?.id ?? ""),
      voyNo: String(row.voyNo ?? ""),
      startAt: row.startAt ? toDatetimeLocalValue(row.startAt) : "",
      endAt: row.endAt ? toDatetimeLocalValue(row.endAt) : "",
      postingMonth: row.postingMonth ? String(row.postingMonth) : "",
      postingYear: row.postingYear ? String(row.postingYear) : "",
      status: row.status ?? "",
    });
    setOpenEdit(true);
  };

  const onCloseEdit = () => { if (savingEdit) return; setOpenEdit(false); setEditingRow(null); };

  const submitEdit = async (e) => {
    e.preventDefault();
    if (!editingRow?.id) return;
    const vesselId = Number(editForm.vesselId);
    if (!vesselId) return alertError("ข้อมูลไม่ครบ", "กรุณาเลือกเรือ");
    const voyNo = editForm.voyNo.trim();
    if (!voyNo) return alertError("ข้อมูลไม่ครบ", "กรุณากรอก voyNo");
    if (!editForm.startAt) return alertError("ข้อมูลไม่ครบ", "กรุณาเลือกเวลาเริ่ม");
    const startAt = toISOFromDatetimeLocal(editForm.startAt);
    const endAt = editForm.endAt ? toISOFromDatetimeLocal(editForm.endAt) : null;
    if (endAt && new Date(endAt) <= new Date(startAt)) return alertError("ข้อมูลไม่ถูกต้อง", "เวลาสิ้นสุดต้องมากกว่าเวลาเริ่ม");
    const postingMonth = Number(editForm.postingMonth);
    const postingYear = Number(editForm.postingYear);
    if (!postingMonth || postingMonth < 1 || postingMonth > 12) return alertError("ข้อมูลไม่ถูกต้อง", "เดือนที่บันทึกต้องอยู่ระหว่าง 1-12");
    if (!postingYear || postingYear < 2000) return alertError("ข้อมูลไม่ถูกต้อง", "ปีที่บันทึกไม่ถูกต้อง");
    const ok = await alertConfirm({ title: "ยืนยันการแก้ไข Voy", text: `แก้ไข Voy ${voyNo} ใช่หรือไม่`, confirmText: "บันทึก", cancelText: "ยกเลิก" });
    if (!ok) return;
    setSavingEdit(true);
    try {
      await api.patch(`/api/voyages/${editingRow.id}`, { vesselId, voyNo, startAt, endAt, postingMonth, postingYear, status: editForm.status || undefined });
      setOpenEdit(false); setEditingRow(null);
      await alertSuccess("บันทึกสำเร็จ", "แก้ไข Voy เรียบร้อย");
      await loadRows();
    } catch (e2) {
      await alertError("บันทึกไม่สำเร็จ", e2?.response?.data?.message || "ไม่สามารถแก้ไข Voy ได้");
    } finally { setSavingEdit(false); }
  };

  // ── Toggle Status ──────────────────────────────────────────────────────────

  const toggleStatus = async (row) => {
    setMenuOpenId(null);
    const isClosed = String(row.status ?? "").toUpperCase() === "CLOSED";
    const nextStatus = isClosed ? "OPEN" : "CLOSED";
    if (nextStatus === "CLOSED" && !row.endAt) return alertError("ยังปิดไม่ได้", "กรุณาแก้ไข Voy เพื่อใส่เวลาสิ้นสุดก่อน");
    const ok = await alertConfirm({ title: isClosed ? "ยืนยันการเปิด Voy" : "ยืนยันการปิด Voy", text: `${isClosed ? "เปิด" : "ปิด"} Voy ${row.voyNo ?? row.id} ใช่หรือไม่`, confirmText: "ยืนยัน", cancelText: "ยกเลิก" });
    if (!ok) return;
    try {
      await api.patch(`/api/voyages/${row.id}/status`, { status: nextStatus });
      await alertSuccess("สำเร็จ", isClosed ? "เปิด Voy เรียบร้อย" : "ปิด Voy เรียบร้อย");
      await loadRows();
    } catch (e) {
      await alertError("ทำรายการไม่สำเร็จ", e?.response?.data?.message || "ไม่สามารถเปลี่ยนสถานะ Voy ได้");
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────

  const deleteVoy = async (row) => {
    setMenuOpenId(null);
    const ok = await alertConfirm({ title: "ยืนยันการลบ Voy", text: `ลบ Voy ${row.voyNo ?? row.id} ใช่หรือไม่`, confirmText: "ลบ", cancelText: "ยกเลิก" });
    if (!ok) return;
    try {
      await api.delete(`/api/voyages/${row.id}`);
      await alertSuccess("ลบสำเร็จ", "ลบ Voy เรียบร้อย");
      await loadRows();
    } catch (e) {
      await alertError("ลบไม่สำเร็จ", e?.response?.data?.message || "ไม่สามารถลบ Voy ได้");
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const selectedPeriod = reportPeriods.find((p) => p.key === reportPeriodKey);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-2xl font-semibold flex items-center gap-2"><Route size={22} />Voy</div>
          <div className="text-sm text-slate-500">รายการ Voyage</div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="report" className="gap-2 cursor-pointer" onClick={onOpenReportFilter}>
            <BarChart3 size={16} /> Report
          </Button>

          {canManage && (
            <Button className="gap-2 cursor-pointer" onClick={onOpenCreate} disabled={loadingVessels || vessels.length === 0}>
              <Plus size={16} /> สร้าง Voy
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="font-medium">รายการ</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full lg:w-auto">
              <div>
                <div className="text-xs text-slate-500 mb-1">เรือ</div>
                <Select value={filters.vesselId} onChange={(e) => setFilters((p) => ({ ...p, vesselId: e.target.value }))} disabled={loadingVessels}>
                  <option value="all">ทั้งหมด</option>
                  {vessels.map((v) => <option key={v.id} value={String(v.id)}>{v.name}</option>)}
                </Select>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">เดือน</div>
                <Select value={filters.month} onChange={(e) => setFilters((p) => ({ ...p, month: e.target.value }))}>
                  {monthOptions.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </Select>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">ปี</div>
                <Select value={filters.year} onChange={(e) => setFilters((p) => ({ ...p, year: e.target.value }))}>
                  {yearOptions().map((y) => <option key={y.value} value={y.value}>{y.label}</option>)}
                </Select>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">ค้นหา</div>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input className="pl-9" placeholder="ค้นหา" value={filters.q} onChange={(e) => setFilters((p) => ({ ...p, q: e.target.value }))} />
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardBody>
          {loadingRows ? (
            <div className="text-sm text-slate-500">กำลังโหลด...</div>
          ) : rows.length === 0 ? (
            <div className="text-sm text-slate-500">ไม่พบข้อมูล</div>
          ) : (
            <div className="overflow-auto rounded-xl border border-slate-100">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="text-left font-medium px-4 py-3">ID</th>
                    <th className="text-left font-medium px-4 py-3">voyNo</th>
                    <th className="text-left font-medium px-4 py-3">เรือ</th>
                    <th className="text-left font-medium px-4 py-3">เริ่ม</th>
                    <th className="text-left font-medium px-4 py-3">สิ้นสุด</th>
                    <th className="text-left font-medium px-4 py-3">เดือน/ปี ที่บันทึก</th>
                    <th className="text-left font-medium px-4 py-3">สถานะ</th>
                    <th className="text-right font-medium px-4 py-3">ตัวเลือก</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-t border-slate-100 hover:bg-white">
                      <td className="px-4 py-3 text-slate-700">{r.id}</td>
                      <td className="px-4 py-3">
                        <button type="button" onClick={() => navigate(`/voy/${r.id}`)}
                          className="group inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-1.5 text-sm font-medium text-sky-700 hover:bg-sky-100 hover:border-sky-300 transition cursor-pointer">
                          {r.voyNo ?? "-"}
                          <ExternalLinkIcon size={16} className="transition-transform group-hover:translate-x-0.5" />
                        </button>
                      </td>
                      <td className="px-4 py-3 text-slate-900">{r._vessel?.name ?? "-"}</td>
                      <td className="px-4 py-3 text-slate-700">{fmtDateTime(r.startAt)}</td>
                      <td className="px-4 py-3 text-slate-700">{fmtDateTime(r.endAt)}</td>
                      <td className="px-4 py-3 text-slate-700">{r.postingMonth && r.postingYear ? `${r.postingMonth}/${r.postingYear}` : "-"}</td>
                      <td className="px-4 py-3 text-slate-700">{statusLabel(r.status)}</td>
                      <td className="px-4 py-3 text-right relative">
                        <Button variant="ghost" onClick={() => setMenuOpenId((p) => (p === r.id ? null : r.id))} className="px-2">
                          <MoreVertical size={18} />
                        </Button>
                        {menuOpenId === r.id && (
                          <div ref={menuRef} className="absolute right-4 mt-2 w-44 rounded-xl border border-slate-200 bg-white shadow-lg z-10 overflow-hidden">
                            {isPrivileged && (
                              <button className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center gap-2" onClick={() => onOpenEdit(r)}>
                                <Pencil size={16} /> แก้ไข
                              </button>
                            )}
                            <button className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center gap-2" onClick={() => toggleStatus(r)}>
                              <Power size={16} /> {String(r.status ?? "").toUpperCase() === "CLOSED" ? "เปิด Voy" : "ปิด Voy"}
                            </button>
                            {isPrivileged && (
                              <button className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center gap-2 text-rose-700" onClick={() => deleteVoy(r)}>
                                <Trash2 size={16} /> ลบ
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* ── Report Filter Modal ────────────────────────────────────────────────── */}
      {openReportFilter && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpenReportFilter(false)} />
          <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2">
            <Card className="shadow-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="font-semibold flex items-center gap-2"><BarChart3 size={18} /> เลือกรายงาน</div>
                  <Button variant="ghost" onClick={() => setOpenReportFilter(false)} className="cursor-pointer"><X size={18} /></Button>
                </div>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">

                  {/* เลือกเรือ */}
                  <div>
                    <label className="text-sm text-slate-600">เรือ</label>
                    <Select
                      value={reportVesselId}
                      onChange={(e) => {
                        setReportVesselId(e.target.value);
                        setReportPeriods([]);
                        setReportPeriodKey("");
                        if (e.target.value) loadReportPeriods(e.target.value);
                      }}
                    >
                      <option value="">-- เลือกเรือ --</option>
                      {vessels.map((v) => <option key={v.id} value={String(v.id)}>{v.name}</option>)}
                    </Select>
                  </div>

                  {/* เลือกเดือน/ปี */}
                  {reportVesselId && (
                    loadingReportPeriods ? (
                      <div className="text-sm text-slate-500">กำลังโหลดช่วงเวลา...</div>
                    ) : reportPeriods.length === 0 ? (
                      <div className="text-sm text-amber-600">ไม่พบข้อมูล Voyage ของเรือนี้</div>
                    ) : (
                      <div>
                        <label className="text-sm text-slate-600">เดือน/ปี</label>
                        <Select
                          value={reportPeriodKey}
                          onChange={(e) => setReportPeriodKey(e.target.value)}
                        >
                          <option value="">-- เลือกเดือน/ปี --</option>
                          {reportPeriods.map((p) => (
                            <option key={p.key} value={p.key}>{p.label}</option>
                          ))}
                        </Select>
                      </div>
                    )
                  )}

                  {/* summary */}
                  {selectedPeriod && (
                    <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2 text-sm text-slate-600">
                      เดือน: <span className="font-medium text-slate-900">{selectedPeriod.label}</span>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="ghost" onClick={() => setOpenReportFilter(false)} className="cursor-pointer">ยกเลิก</Button>
                    <Button
                      className="gap-2 cursor-pointer"
                      onClick={submitReportFilter}
                      disabled={!reportVesselId || !reportPeriodKey || loadingReportPeriods}
                    >
                      <BarChart3 size={16} /> ดูรายงาน
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      )}

      {/* ── Create Modal ────────────────────────────────────────────────────────── */}
      {openCreate && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={onCloseCreate} />
          <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2">
            <Card className="shadow-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="font-semibold">สร้าง Voy</div>
                  <Button variant="ghost" onClick={onCloseCreate} disabled={savingCreate}><X size={18} /></Button>
                </div>
              </CardHeader>
              <CardBody>
                <form className="space-y-3" onSubmit={submitCreate}>
                  <div>
                    <label className="text-sm text-slate-600">เรือ</label>
                    <Select value={createForm.vesselId} onChange={(e) => setCreateForm((p) => ({ ...p, vesselId: e.target.value }))} disabled={vessels.length === 1}>
                      <option value="">-- เลือกเรือ --</option>
                      {vessels.map((v) => <option key={v.id} value={String(v.id)}>{v.name}</option>)}
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm text-slate-600">voyNo</label>
                    <Input value={createForm.voyNo} onChange={(e) => setCreateForm((p) => ({ ...p, voyNo: e.target.value }))} placeholder="เช่น V2026001N" />
                  </div>
                  <div>
                    <label className="text-sm text-slate-600">เวลาเริ่ม</label>
                    <Input type="datetime-local" value={createForm.startAt} onChange={(e) => setCreateForm((p) => ({ ...p, startAt: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm text-slate-600">เดือนที่บันทึก</label>
                      <Select value={createForm.postingMonth} onChange={(e) => setCreateForm((p) => ({ ...p, postingMonth: e.target.value }))}>
                        {Array.from({ length: 12 }).map((_, i) => <option key={i + 1} value={String(i + 1)}>{i + 1}</option>)}
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm text-slate-600">ปีที่บันทึก</label>
                      <Input value={createForm.postingYear} onChange={(e) => setCreateForm((p) => ({ ...p, postingYear: e.target.value }))} placeholder="เช่น 2026" />
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <Button type="button" variant="ghost" onClick={onCloseCreate} disabled={savingCreate}>ยกเลิก</Button>
                    <Button type="submit" disabled={savingCreate} className="gap-2">
                      <Plus size={16} />{savingCreate ? "กำลังบันทึก..." : "สร้าง"}
                    </Button>
                  </div>
                </form>
              </CardBody>
            </Card>
          </div>
        </div>
      )}

      {/* ── Edit Modal ──────────────────────────────────────────────────────────── */}
      {openEdit && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={onCloseEdit} />
          <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2">
            <Card className="shadow-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="font-semibold">แก้ไข Voy</div>
                  <Button variant="ghost" onClick={onCloseEdit} disabled={savingEdit}><X size={18} /></Button>
                </div>
              </CardHeader>
              <CardBody>
                <form className="space-y-3" onSubmit={submitEdit}>
                  <div>
                    <label className="text-sm text-slate-600">เรือ</label>
                    <Select value={editForm.vesselId} onChange={(e) => setEditForm((p) => ({ ...p, vesselId: e.target.value }))}>
                      <option value="">-- เลือกเรือ --</option>
                      {vessels.map((v) => <option key={v.id} value={String(v.id)}>{v.name}</option>)}
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm text-slate-600">voyNo</label>
                    <Input value={editForm.voyNo} onChange={(e) => setEditForm((p) => ({ ...p, voyNo: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm text-slate-600">เวลาเริ่ม</label>
                      <Input type="datetime-local" value={editForm.startAt} onChange={(e) => setEditForm((p) => ({ ...p, startAt: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-sm text-slate-600">เวลาสิ้นสุด</label>
                      <Input type="datetime-local" value={editForm.endAt} onChange={(e) => setEditForm((p) => ({ ...p, endAt: e.target.value }))} placeholder="เว้นว่างได้" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm text-slate-600">เดือนที่บันทึก</label>
                      <Select value={editForm.postingMonth} onChange={(e) => setEditForm((p) => ({ ...p, postingMonth: e.target.value }))}>
                        {Array.from({ length: 12 }).map((_, i) => <option key={i + 1} value={String(i + 1)}>{i + 1}</option>)}
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm text-slate-600">ปีที่บันทึก</label>
                      <Input value={editForm.postingYear} onChange={(e) => setEditForm((p) => ({ ...p, postingYear: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-slate-600">สถานะ</label>
                    <Input value={editForm.status} onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value }))} placeholder="เช่น OPEN / CLOSED" />
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <Button type="button" variant="ghost" onClick={onCloseEdit} disabled={savingEdit}>ยกเลิก</Button>
                    <Button type="submit" disabled={savingEdit} className="gap-2">
                      <Pencil size={16} />{savingEdit ? "กำลังบันทึก..." : "บันทึก"}
                    </Button>
                  </div>
                </form>
              </CardBody>
            </Card>
          </div>
        </div>
      )}

      {/* ── Report Modal ─────────────────────────────────────────────────────────── */}
      <VoyFuelReportModal
        open={openReport}
        onClose={() => setOpenReport(false)}
        vessel={reportVessel}
        period={selectedPeriod}
        voyages={reportVoyages}
        kpi={950}
      />
    </div>
  );
}