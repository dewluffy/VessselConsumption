// src/pages/Vessels.jsx
import { useEffect, useState } from "react";
import { Ship, Plus, Pencil, Trash2, X, ChevronDown, ChevronUp, Users } from "lucide-react";

import { alertConfirm, alertError, alertSuccess } from "../lib/alert";
import Button from "../components/ui/Button";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import VesselForm from "../components/vessels/VesselForm";
import { useVesselStore } from "../stores/vessel.store";
import Select from "../components/ui/Select";

import { vesselApi } from "../api/vessel.api";
import { api } from "../lib/api";

// ── helper ────────────────────────────────────────────────────────────────────
function fmt(v, unit = "") {
  if (v == null || v === "") return "-";
  return `${v}${unit ? " " + unit : ""}`;
}

// ── Vessel detail card (expand) ───────────────────────────────────────────────
function VesselDetail({ v }) {
  const sections = [
    {
      title: "ข้อมูลทะเบียน",
      rows: [
        ["IMO Number", fmt(v.imoNumber)],
        ["MMSI", fmt(v.mmsi)],
        ["Call Sign", fmt(v.callSign)],
        ["Registration No.", fmt(v.registrationNo)],
        ["Flag", fmt(v.flag)],
        ["Port of Registry", fmt(v.portOfRegistry)],
        ["Classification", fmt(v.classification)],
        ["Year Built", fmt(v.yearBuilt)],
        ["Last Drydock", v.lastDrydock ? new Date(v.lastDrydock).toLocaleDateString("th-TH") : "-"],
      ],
    },
    {
      title: "ขนาดเรือ",
      rows: [
        ["LOA", fmt(v.loaMeters, "m")],
        ["Breadth", fmt(v.breadthMeters, "m")],
        ["Depth", fmt(v.depthMeters, "m")],
        ["Draft Summer", fmt(v.draftSummer, "m")],
        ["Draft Tropical", fmt(v.draftTropical, "m")],
        ["Draft Tropical FW", fmt(v.draftTropicalFw, "m")],
        ["Draft AFT at full load", fmt(v.draftAftFullLoad, "m")],
        ["FWA", fmt(v.fwa, "mm")],
        ["Light Ship", fmt(v.lightShip, "MT")],
        ["DWT Summer", fmt(v.dwtSummer, "MT")],
        ["DWT Tropical", fmt(v.dwtTropical, "MT")],
        ["TPC", fmt(v.tpc, "MT")],
        ["GRT", fmt(v.grt, "T")],
        ["NRT", fmt(v.nrt, "T")],
      ],
    },
    {
      title: "Speed & Consumption",
      rows: [
        ["Normal Speed", fmt(v.normalSpeed, "kts")],
        ["Normal Full RPM", fmt(v.normalFullRpm, "RPM")],
        ["Maximum Speed", fmt(v.maximumSpeed, "kts")],
        ["Maximum RPM", fmt(v.maximumRpm, "RPM")],
      ],
    },
    {
      title: "Main Engine",
      rows: [
        ["M/E (P)", fmt(v.mainEngineP)],
        ["M/E (P) Power", fmt(v.mainEnginePKw, "kW")],
        ["M/E (P) Consumption", fmt(v.mainEnginePCons, "L/HR")],
        ["M/E (S)", fmt(v.mainEngineS)],
        ["M/E (S) Power", fmt(v.mainEngineSKw, "kW")],
        ["M/E (S) Consumption", fmt(v.mainEngineSCons, "L/HR")],
        ["M/Es Consumption (Max RPM)", fmt(v.mainEngineMaxCons, "L/HR")],
      ],
    },
    {
      title: "Generator",
      rows: [
        ["G/E No.1", fmt(v.generator1)],
        ["G/E No.1 Power", fmt(v.generator1Kw, "kW")],
        ["G/E No.1 Consumption", fmt(v.generator1Cons, "L/HR")],
        ["G/E No.2", fmt(v.generator2)],
        ["G/E No.2 Power", fmt(v.generator2Kw, "kW")],
        ["G/E No.2 Consumption", fmt(v.generator2Cons, "L/HR")],
        ["Aux Engine", fmt(v.auxEngine)],
      ],
    },
    {
      title: "Tank & Cargo",
      rows: [
        ["Fuel Bunker Tank", fmt(v.fuelBunkerTankCbm, "CBM")],
        ["Fresh Water Tank", fmt(v.freshWaterTankCbm, "CBM")],
        ["Container Stowage", fmt(v.containerStowageTeu, "TEU")],
        ["Max Cargo Capacity", fmt(v.maxCargoCapacityMt, "MT")],
        ["No. of Cargo Hold", fmt(v.noOfCargoHold)],
        ["No. of Row", fmt(v.noOfRow)],
        ["Reefer Points", fmt(v.reeferPoints, "Unit")],
        ["DG Approved", v.dgApproved == null ? "-" : v.dgApproved ? "Yes" : "No"],
      ],
    },
    {
      title: "Ship's Contact",
      rows: [
        ["Email", fmt(v.contactEmail)],
        ["Phone", fmt(v.contactPhone)],
        ["Line", fmt(v.contactLine)],
      ],
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 p-4 border-t border-slate-100 bg-slate-50">
      {sections.map((sec) => (
        <div key={sec.title} className="rounded-xl border border-slate-100 bg-white p-3 space-y-1">
          <div className="text-xs font-medium text-slate-500 mb-2">{sec.title}</div>
          {sec.rows.map(([label, val]) => (
            <div key={label} className="flex justify-between gap-2 text-sm">
              <span className="text-slate-500 shrink-0">{label}</span>
              <span className="text-slate-900 text-right">{val}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function VesselsPage() {
  const { vessels, loading, fetchVessels, createVessel, updateVessel, removeVessel } =
    useVesselStore();

  const [expandedId, setExpandedId] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [editVessel, setEditVessel] = useState(null); // null = create mode
  const [saving, setSaving] = useState(false);
  const [assignVessel, setAssignVessel] = useState(null);
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [loadingAssign, setLoadingAssign] = useState(false);
  const [savingAssign, setSavingAssign] = useState(false);

  useEffect(() => {
    (async () => {
      try { await fetchVessels(); }
      catch (e) { await alertError("โหลดข้อมูลไม่สำเร็จ", e?.response?.data?.message || e?.message); }
    })();
  }, [fetchVessels]);

  const openCreate = () => { setEditVessel(null); setOpenModal(true); };
  const openEdit = (v) => { setEditVessel(v); setOpenModal(true); };
  const closeModal = () => { if (saving) return; setOpenModal(false); setEditVessel(null); };

  const handleSubmit = async (payload) => {
    setSaving(true);
    try {
      if (editVessel) {
        await updateVessel(editVessel.id, payload);
        await alertSuccess("บันทึกสำเร็จ", "แก้ไขข้อมูลเรือเรียบร้อย");
      } else {
        await createVessel(payload);
        await alertSuccess("สร้างสำเร็จ", "เพิ่มเรือเรียบร้อย");
      }
      closeModal();
    } catch (err) {
      await alertError("ทำรายการไม่สำเร็จ", err?.response?.data?.message || err?.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (v) => {
    const ok = await alertConfirm({
      title: "ยืนยันการลบ",
      text: `ลบเรือ ${v.name} ใช่หรือไม่`,
      confirmText: "ลบ", cancelText: "ยกเลิก",
    });
    if (!ok) return;
    try {
      await removeVessel(v.id);
      await alertSuccess("ลบสำเร็จ", "ลบเรือเรียบร้อย");
      if (expandedId === v.id) setExpandedId(null);
    } catch (err) {
      await alertError("ลบไม่สำเร็จ", err?.response?.data?.message || err?.message);
    }
  };

  const openAssign = async (v) => {
    setAssignVessel(v);
    setSelectedUserId("");
    setLoadingAssign(true);
    try {
      const [assignRes, userRes] = await Promise.all([
        vesselApi.getAssignments(v.id),
        api.get("/api/users?minimal=true"),
      ]);
      setAssignedUsers(Array.isArray(assignRes.data) ? assignRes.data : []);
      setAvailableUsers(Array.isArray(userRes.data) ? userRes.data : []);
    } catch (err) {
      await alertError("โหลดข้อมูลไม่สำเร็จ", err?.response?.data?.message || err?.message);
    } finally {
      setLoadingAssign(false);
    }
  };

  const closeAssign = () => {
    if (savingAssign) return;
    setAssignVessel(null);
    setAssignedUsers([]);
    setAvailableUsers([]);
    setSelectedUserId("");
  };

  const handleAssign = async () => {
    if (!selectedUserId) return alertError("ข้อมูลไม่ครบ", "กรุณาเลือก User");
    setSavingAssign(true);
    try {
      await vesselApi.assignUser(assignVessel.id, { userId: Number(selectedUserId) });
      await alertSuccess("สำเร็จ", "Assign User เรียบร้อย");
      const res = await vesselApi.getAssignments(assignVessel.id);
      setAssignedUsers(Array.isArray(res.data) ? res.data : []);
      setSelectedUserId("");
    } catch (err) {
      await alertError("ไม่สำเร็จ", err?.response?.data?.message || err?.message);
    } finally {
      setSavingAssign(false);
    }
  };

  const handleUnassign = async (userId) => {
    const ok = await alertConfirm({
      title: "ยืนยันการลบ", text: "ต้องการลบ User ออกจากเรือใช่หรือไม่",
      confirmText: "ลบ", cancelText: "ยกเลิก",
    });
    if (!ok) return;
    setSavingAssign(true);
    try {
      await vesselApi.unassignUser(assignVessel.id, userId);
      await alertSuccess("สำเร็จ", "ลบ User ออกจากเรือเรียบร้อย");
      const res = await vesselApi.getAssignments(assignVessel.id);
      setAssignedUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      await alertError("ไม่สำเร็จ", err?.response?.data?.message || err?.message);
    } finally {
      setSavingAssign(false);
    }
  };

  const toggleExpand = (id) => setExpandedId((prev) => (prev === id ? null : id));

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="text-2xl font-semibold flex items-center gap-2">
            <Ship size={22} /> Vessels
          </div>
        </div>
        <Button onClick={openCreate} className="gap-2 cursor-pointer">
          <Plus size={16} /> เพิ่มเรือ
        </Button>
      </div>

      {/* List */}
      <Card>
        <CardHeader>
          <div className="font-medium">รายการเรือทั้งหมด ({vessels.length})</div>
        </CardHeader>
        <CardBody className="p-0">
          {loading ? (
            <div className="p-4 text-sm text-slate-500">กำลังโหลด...</div>
          ) : vessels.length === 0 ? (
            <div className="p-4 text-sm text-slate-500">ยังไม่มีเรือในระบบ</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {vessels.map((v) => (
                <div key={v.id}>
                  {/* Row */}
                  <div className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50">

                    {/* expand toggle */}
                    <button
                      onClick={() => toggleExpand(v.id)}
                      className="text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      {expandedId === v.id
                        ? <ChevronUp size={16} />
                        : <ChevronDown size={16} />}
                    </button>

                    {/* info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-slate-900">{v.name}</span>
                        {v.shortName && (
                          <span className="text-xs bg-slate-100 text-slate-600 rounded px-1.5 py-0.5">
                            {v.shortName}
                          </span>
                        )}
                        {v.type && (
                          <span className="text-xs bg-blue-50 text-blue-700 rounded px-1.5 py-0.5">
                            {v.type}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 flex gap-3 flex-wrap">
                        <span>Code: {v.code}</span>
                        {v.imoNumber && <span>IMO: {v.imoNumber}</span>}
                        {v.flag && <span>Flag: {v.flag}</span>}
                        {v.charterer && <span>ผู้เช่า: {v.charterer}</span>}
                      </div>
                    </div>

                    {/* actions */}
                    <div className="inline-flex gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        className="gap-2 cursor-pointer"
                        onClick={() => openEdit(v)}
                      >
                        <Pencil size={16} /> แก้ไข
                      </Button>
                      <Button
                        variant="ghost"
                        className="gap-2 cursor-pointer"
                        onClick={() => openAssign(v)}
                      >
                        <Users size={16} /> Assign
                      </Button>
                      <Button
                        variant="ghost"
                        className="gap-2 text-rose-700 cursor-pointer"
                        onClick={() => handleDelete(v)}
                      >
                        <Trash2 size={16} /> ลบ
                      </Button>
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {expandedId === v.id && <VesselDetail v={v} />}
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Modal */}
      {openModal && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={closeModal} />
          <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 max-h-[90vh] overflow-y-auto">
            <Card className="shadow-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="font-semibold">
                    {editVessel ? `แก้ไข — ${editVessel.name}` : "เพิ่มเรือใหม่"}
                  </div>
                  <Button variant="ghost" onClick={closeModal} disabled={saving} className="cursor-pointer">
                    <X size={18} />
                  </Button>
                </div>
              </CardHeader>
              <CardBody>
                <VesselForm
                  initial={editVessel ?? {}}
                  onSubmit={handleSubmit}
                  onCancel={closeModal}
                  saving={saving}
                />
              </CardBody>
            </Card>
          </div>
        </div>
      )}
      {/* Assign Modal */}
      {assignVessel && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={closeAssign} />
          <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2">
            <Card className="shadow-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="font-semibold">
                    Assign User — {assignVessel.name}
                  </div>
                  <Button variant="ghost" onClick={closeAssign} disabled={savingAssign} className="cursor-pointer">
                    <X size={18} />
                  </Button>
                </div>
              </CardHeader>
              <CardBody>
                {loadingAssign ? (
                  <div className="text-sm text-slate-500">กำลังโหลด...</div>
                ) : (
                  <div className="space-y-4">

                    {/* รายชื่อ user ที่ assign แล้ว */}
                    <div>
                      <div className="text-sm font-medium text-slate-700 mb-2">
                        Users ที่ assign แล้ว ({assignedUsers.length})
                      </div>
                      {assignedUsers.length === 0 ? (
                        <div className="text-sm text-slate-400">ยังไม่มี User</div>
                      ) : (
                        <div className="space-y-2">
                          {assignedUsers.map((a) => (
                            <div
                              key={a.user.id}
                              className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
                            >
                              <div>
                                <div className="text-sm font-medium text-slate-900">
                                  {a.user.name || a.user.email}
                                </div>
                                <div className="text-xs text-slate-500">
                                  {a.user.email} · {a.user.role}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                className="gap-1 text-rose-700 cursor-pointer"
                                onClick={() => handleUnassign(a.user.id)}
                                disabled={savingAssign}
                              >
                                <Trash2 size={14} /> ลบ
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* เพิ่ม user */}
                    <div className="border-t border-slate-100 pt-4">
                      <div className="text-sm font-medium text-slate-700 mb-2">
                        เพิ่ม User
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Select
                            value={selectedUserId}
                            onChange={(e) => setSelectedUserId(e.target.value)}
                          >
                            <option value="">-- เลือก User --</option>
                            {availableUsers
                              .filter((u) => !assignedUsers.some((a) => a.user.id === u.id))
                              .map((u) => (
                                <option key={u.id} value={u.id}>
                                  {u.name || u.email} ({u.role})
                                </option>
                              ))}
                          </Select>
                        </div>
                        <Button
                          onClick={handleAssign}
                          disabled={savingAssign || !selectedUserId}
                          className="gap-2 cursor-pointer shrink-0"
                        >
                          <Plus size={16} />
                          Assign
                        </Button>
                      </div>
                    </div>

                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}