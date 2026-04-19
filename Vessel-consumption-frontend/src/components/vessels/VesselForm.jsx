import { useState } from "react";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Button from "../ui/Button";
import { alertError } from "../../lib/alert";

const VESSEL_TYPES = [
  "CONTAINER VESSEL", "BULK CARRIER", "TANKER",
  "GENERAL CARGO", "RO-RO", "PASSENGER", "OTHER",
];

const EMPTY_FORM = {
  // ทั่วไป
  code: "", name: "", shortName: "", exName: "",
  type: "", owner: "", ownerAddress: "", charterer: "",
  // ทะเบียน
  imoNumber: "", mmsi: "", callSign: "", registrationNo: "",
  flag: "", portOfRegistry: "", classification: "",
  yearBuilt: "", lastDrydock: "",
  // ขนาด
  loaMeters: "", breadthMeters: "", depthMeters: "",
  draftSummer: "", draftTropical: "", draftTropicalFw: "",
  draftAftFullLoad: "", fwa: "", lightShip: "",
  dwtSummer: "", dwtTropical: "", tpc: "",
  // Tonnage
  grt: "", nrt: "",
  // Speed
  normalSpeed: "", normalFullRpm: "",
  maximumSpeed: "", maximumRpm: "",
  // Main Engine
  mainEngineP: "", mainEnginePKw: "", mainEnginePCons: "",
  mainEngineS: "", mainEngineSKw: "", mainEngineSCons: "",
  mainEngineMaxCons: "",
  // Generator
  generator1: "", generator1Kw: "", generator1Cons: "",
  generator2: "", generator2Kw: "", generator2Cons: "",
  auxEngine: "",
  // Tank
  fuelBunkerTankCbm: "", freshWaterTankCbm: "",
  // Cargo
  containerStowageTeu: "", maxCargoCapacityMt: "",
  noOfCargoHold: "", noOfRow: "", reeferPoints: "",
  dgApproved: false,
  // Contact
  contactEmail: "", contactLine: "", contactPhone: "",
};

function Section({ title, children }) {
  return (
    <div className="space-y-3">
      <div className="text-sm font-medium text-slate-500 border-b border-slate-100 pb-1">
        {title}
      </div>
      {children}
    </div>
  );
}

function Row({ children }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>;
}

function Field({ label, children }) {
  return (
    <div>
      <label className="text-sm text-slate-600">{label}</label>
      {children}
    </div>
  );
}

export default function VesselForm({ initial = {}, onSubmit, onCancel, saving }) {
  const [form, setForm] = useState({ ...EMPTY_FORM, ...initial });

  const set  = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));
  const setB = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.checked }));
  const f    = (key) => form[key] ?? "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.code.trim()) return alertError("ข้อมูลไม่ครบ", "กรุณากรอกรหัสเรือ");
    if (!form.name.trim()) return alertError("ข้อมูลไม่ครบ", "กรุณากรอกชื่อเรือ");

    const toNum = (v) => (v === "" || v === null || v === undefined) ? undefined : Number(v);
    const toStr  = (v) => v?.trim() || undefined;
    const toDate = (v) => v ? new Date(v).toISOString() : undefined;
    const toInt = (v) => (v === "" || v === null || v === undefined) ? undefined : parseInt(v);

    const payload = {
      // ทั่วไป
      code:         form.code.trim(),
      name:         form.name.trim(),
      shortName:    toStr(form.shortName),
      exName:       toStr(form.exName),
      type:         toStr(form.type),
      owner:        toStr(form.owner),
      ownerAddress: toStr(form.ownerAddress),
      charterer:    toStr(form.charterer),
      // ทะเบียน
      imoNumber:      toStr(form.imoNumber),
      mmsi:           toStr(form.mmsi),
      callSign:       toStr(form.callSign),
      registrationNo: toStr(form.registrationNo),
      flag:           toStr(form.flag),
      portOfRegistry: toStr(form.portOfRegistry),
      classification: toStr(form.classification),
      yearBuilt:      toInt(form.yearBuilt),
      lastDrydock:    toDate(form.lastDrydock),
      // ขนาด
      loaMeters:        toNum(form.loaMeters),
      breadthMeters:    toNum(form.breadthMeters),
      depthMeters:      toNum(form.depthMeters),
      draftSummer:      toNum(form.draftSummer),
      draftTropical:    toNum(form.draftTropical),
      draftTropicalFw:  toNum(form.draftTropicalFw),
      draftAftFullLoad: toNum(form.draftAftFullLoad),
      fwa:              toNum(form.fwa),
      lightShip:        toNum(form.lightShip),
      dwtSummer:        toNum(form.dwtSummer),
      dwtTropical:      toNum(form.dwtTropical),
      tpc:              toNum(form.tpc),
      // Tonnage
      grt: toNum(form.grt),
      nrt: toNum(form.nrt),
      // Speed
      normalSpeed:   toNum(form.normalSpeed),
      normalFullRpm: toNum(form.normalFullRpm),
      maximumSpeed:  toNum(form.maximumSpeed),
      maximumRpm:    toNum(form.maximumRpm),
      // Main Engine
      mainEngineP:       toStr(form.mainEngineP),
      mainEnginePKw:     toNum(form.mainEnginePKw),
      mainEnginePCons:   toNum(form.mainEnginePCons),
      mainEngineS:       toStr(form.mainEngineS),
      mainEngineSKw:     toNum(form.mainEngineSKw),
      mainEngineSCons:   toNum(form.mainEngineSCons),
      mainEngineMaxCons: toNum(form.mainEngineMaxCons),
      // Generator
      generator1:     toStr(form.generator1),
      generator1Kw:   toNum(form.generator1Kw),
      generator1Cons: toNum(form.generator1Cons),
      generator2:     toStr(form.generator2),
      generator2Kw:   toNum(form.generator2Kw),
      generator2Cons: toNum(form.generator2Cons),
      auxEngine:      toStr(form.auxEngine),
      // Tank
      fuelBunkerTankCbm: toNum(form.fuelBunkerTankCbm),
      freshWaterTankCbm: toNum(form.freshWaterTankCbm),
      // Cargo
      containerStowageTeu: toInt(form.containerStowageTeu),
      maxCargoCapacityMt:  toNum(form.maxCargoCapacityMt),
      noOfCargoHold:       toInt(form.noOfCargoHold),
      noOfRow:             toInt(form.noOfRow),
      reeferPoints:        toInt(form.reeferPoints),
      dgApproved:          form.dgApproved,
      // Contact
      contactEmail: toStr(form.contactEmail),
      contactLine:  toStr(form.contactLine),
      contactPhone: toStr(form.contactPhone),
    };

    await onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      <Section title="ข้อมูลทั่วไป">
        <Row>
          <Field label="รหัสเรือ *"><Input value={f("code")} onChange={set("code")} placeholder="เช่น VSL-001" /></Field>
          <Field label="ชื่อเรือ *"><Input value={f("name")} onChange={set("name")} placeholder="เช่น SRI AMPHAN" /></Field>
        </Row>
        <Row>
          <Field label="ชื่อย่อเรือ"><Input value={f("shortName")} onChange={set("shortName")} placeholder="เช่น S.AMPHAN" /></Field>
          <Field label="ชื่อเก่า (Ex.)"><Input value={f("exName")} onChange={set("exName")} placeholder="เช่น EX. HBD 78" /></Field>
        </Row>
        <Row>
          <Field label="ประเภทเรือ">
            <Select value={f("type")} onChange={set("type")}>
              <option value="">-- เลือกประเภท --</option>
              {VESSEL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </Field>
          <Field label="ผู้เช่าเรือ"><Input value={f("charterer")} onChange={set("charterer")} placeholder="ชื่อบริษัทผู้เช่า" /></Field>
        </Row>
        <Field label="เจ้าของเรือ"><Input value={f("owner")} onChange={set("owner")} placeholder="เช่น RIVER NETWORK CONNECTION CO.,LTD." /></Field>
        <Field label="ที่อยู่เจ้าของเรือ"><Input value={f("ownerAddress")} onChange={set("ownerAddress")} placeholder="ที่อยู่" /></Field>
      </Section>

      <Section title="ข้อมูลทะเบียน">
        <Row>
          <Field label="IMO Number"><Input value={f("imoNumber")} onChange={set("imoNumber")} placeholder="เช่น 1068437" /></Field>
          <Field label="MMSI"><Input value={f("mmsi")} onChange={set("mmsi")} placeholder="เช่น 567003180" /></Field>
        </Row>
        <Row>
          <Field label="Call Sign"><Input value={f("callSign")} onChange={set("callSign")} placeholder="เช่น HSB 8727" /></Field>
          <Field label="Registration No."><Input value={f("registrationNo")} onChange={set("registrationNo")} placeholder="เช่น 6600 00252" /></Field>
        </Row>
        <Row>
          <Field label="Flag"><Input value={f("flag")} onChange={set("flag")} placeholder="เช่น TG" /></Field>
          <Field label="Port of Registry"><Input value={f("portOfRegistry")} onChange={set("portOfRegistry")} placeholder="เช่น BANGKOK" /></Field>
        </Row>
        <Row>
          <Field label="Classification"><Input value={f("classification")} onChange={set("classification")} placeholder="เช่น TG, BV, LR" /></Field>
          <Field label="Year Built"><Input type="number" value={f("yearBuilt")} onChange={set("yearBuilt")} placeholder="เช่น 2004" /></Field>
        </Row>
        <Row>
          <Field label="Last Drydock"><Input type="date" value={f("lastDrydock")} onChange={set("lastDrydock")} /></Field>
        </Row>
      </Section>

      <Section title="ขนาดเรือ (Dimensions)">
        <Row>
          <Field label="LOA (m)"><Input type="number" value={f("loaMeters")} onChange={set("loaMeters")} placeholder="เช่น 49.98" /></Field>
          <Field label="Breadth (m)"><Input type="number" value={f("breadthMeters")} onChange={set("breadthMeters")} placeholder="เช่น 15.80" /></Field>
        </Row>
        <Row>
          <Field label="Depth (m)"><Input type="number" value={f("depthMeters")} onChange={set("depthMeters")} placeholder="เช่น 6.00" /></Field>
          <Field label="Draft Summer (m)"><Input type="number" value={f("draftSummer")} onChange={set("draftSummer")} placeholder="เช่น 3.60" /></Field>
        </Row>
        <Row>
          <Field label="Draft Tropical (m)"><Input type="number" value={f("draftTropical")} onChange={set("draftTropical")} placeholder="เช่น 3.64" /></Field>
          <Field label="Draft Tropical FW (m)"><Input type="number" value={f("draftTropicalFw")} onChange={set("draftTropicalFw")} placeholder="เช่น 3.72" /></Field>
        </Row>
        <Row>
          <Field label="Draft AFT at full load (m)"><Input type="number" value={f("draftAftFullLoad")} onChange={set("draftAftFullLoad")} placeholder="เช่น 4.20" /></Field>
          <Field label="FWA (mm)"><Input type="number" value={f("fwa")} onChange={set("fwa")} /></Field>
        </Row>
        <Row>
          <Field label="Light Ship (MT)"><Input type="number" value={f("lightShip")} onChange={set("lightShip")} placeholder="เช่น 582.65" /></Field>
          <Field label="DWT Summer (MT)"><Input type="number" value={f("dwtSummer")} onChange={set("dwtSummer")} placeholder="เช่น 1898" /></Field>
        </Row>
        <Row>
          <Field label="DWT Tropical (MT)"><Input type="number" value={f("dwtTropical")} onChange={set("dwtTropical")} /></Field>
          <Field label="TPC (MT)"><Input type="number" value={f("tpc")} onChange={set("tpc")} /></Field>
        </Row>
      </Section>

      <Section title="Tonnage">
        <Row>
          <Field label="GRT (T)"><Input type="number" value={f("grt")} onChange={set("grt")} placeholder="เช่น 1438" /></Field>
          <Field label="NRT (T)"><Input type="number" value={f("nrt")} onChange={set("nrt")} placeholder="เช่น 739" /></Field>
        </Row>
      </Section>

      <Section title="Speed & Consumption">
        <Row>
          <Field label="Normal Speed (kts)"><Input type="number" value={f("normalSpeed")} onChange={set("normalSpeed")} placeholder="เช่น 7.0" /></Field>
          <Field label="Normal Full RPM"><Input type="number" value={f("normalFullRpm")} onChange={set("normalFullRpm")} placeholder="เช่น 1200" /></Field>
        </Row>
        <Row>
          <Field label="Maximum Speed (kts)"><Input type="number" value={f("maximumSpeed")} onChange={set("maximumSpeed")} /></Field>
          <Field label="Maximum RPM"><Input type="number" value={f("maximumRpm")} onChange={set("maximumRpm")} /></Field>
        </Row>
      </Section>

      <Section title="Main Engine">
        <Row>
          <Field label="M/E (P) Maker/Model"><Input value={f("mainEngineP")} onChange={set("mainEngineP")} placeholder="เช่น Shandong Welfang" /></Field>
          <Field label="M/E (P) kW"><Input type="number" value={f("mainEnginePKw")} onChange={set("mainEnginePKw")} placeholder="เช่น 350" /></Field>
        </Row>
        <Row>
          <Field label="M/E (P) Consumption (L/HR)"><Input type="number" value={f("mainEnginePCons")} onChange={set("mainEnginePCons")} placeholder="เช่น 32" /></Field>
        </Row>
        <Row>
          <Field label="M/E (S) Maker/Model"><Input value={f("mainEngineS")} onChange={set("mainEngineS")} placeholder="เช่น Zibo Z6170 ZLCZ" /></Field>
          <Field label="M/E (S) kW"><Input type="number" value={f("mainEngineSKw")} onChange={set("mainEngineSKw")} placeholder="เช่น 350" /></Field>
        </Row>
        <Row>
          <Field label="M/E (S) Consumption (L/HR)"><Input type="number" value={f("mainEngineSCons")} onChange={set("mainEngineSCons")} placeholder="เช่น 32" /></Field>
          <Field label="M/Es Consumption at Max RPM (L/HR)"><Input type="number" value={f("mainEngineMaxCons")} onChange={set("mainEngineMaxCons")} /></Field>
        </Row>
      </Section>

      <Section title="Generator">
        <Row>
          <Field label="G/E No.1 Maker/Model"><Input value={f("generator1")} onChange={set("generator1")} placeholder="เช่น DEUTZ 226B TD226B-4C" /></Field>
          <Field label="G/E No.1 kW"><Input type="number" value={f("generator1Kw")} onChange={set("generator1Kw")} placeholder="เช่น 50" /></Field>
        </Row>
        <Row>
          <Field label="G/E No.1 Consumption (L/HR)"><Input type="number" value={f("generator1Cons")} onChange={set("generator1Cons")} placeholder="เช่น 7.5" /></Field>
        </Row>
        <Row>
          <Field label="G/E No.2 Maker/Model"><Input value={f("generator2")} onChange={set("generator2")} placeholder="เช่น DEUTZ 226B TD226B-4C" /></Field>
          <Field label="G/E No.2 kW"><Input type="number" value={f("generator2Kw")} onChange={set("generator2Kw")} placeholder="เช่น 50" /></Field>
        </Row>
        <Row>
          <Field label="G/E No.2 Consumption (L/HR)"><Input type="number" value={f("generator2Cons")} onChange={set("generator2Cons")} placeholder="เช่น 7.5" /></Field>
          <Field label="Aux Engine"><Input value={f("auxEngine")} onChange={set("auxEngine")} /></Field>
        </Row>
      </Section>

      <Section title="Tank Capacity">
        <Row>
          <Field label="Fuel Bunker Tank (CBM)"><Input type="number" value={f("fuelBunkerTankCbm")} onChange={set("fuelBunkerTankCbm")} placeholder="เช่น 47.825" /></Field>
          <Field label="Fresh Water (CBM)"><Input type="number" value={f("freshWaterTankCbm")} onChange={set("freshWaterTankCbm")} placeholder="เช่น 56.544" /></Field>
        </Row>
      </Section>

      <Section title="Cargo Capacity">
        <Row>
          <Field label="Container Stowage (TEU)"><Input type="number" value={f("containerStowageTeu")} onChange={set("containerStowageTeu")} placeholder="เช่น 120" /></Field>
          <Field label="Max Cargo Capacity (MT)"><Input type="number" value={f("maxCargoCapacityMt")} onChange={set("maxCargoCapacityMt")} placeholder="เช่น 1898" /></Field>
        </Row>
        <Row>
          <Field label="No. of Cargo Hold"><Input type="number" value={f("noOfCargoHold")} onChange={set("noOfCargoHold")} placeholder="เช่น 1" /></Field>
          <Field label="No. of Row"><Input type="number" value={f("noOfRow")} onChange={set("noOfRow")} placeholder="เช่น 5" /></Field>
        </Row>
        <Row>
          <Field label="Reefer Points (Unit)"><Input type="number" value={f("reeferPoints")} onChange={set("reeferPoints")} placeholder="เช่น 6" /></Field>
          <Field label="DG Approved">
            <div className="flex items-center gap-2 mt-1">
              <input type="checkbox" checked={form.dgApproved} onChange={setB("dgApproved")} className="w-4 h-4 cursor-pointer" />
              <span className="text-sm text-slate-700">Yes</span>
            </div>
          </Field>
        </Row>
      </Section>

      <Section title="Ship's Contact">
        <Row>
          <Field label="Email"><Input value={f("contactEmail")} onChange={set("contactEmail")} placeholder="เช่น vessel@company.com" /></Field>
          <Field label="Phone"><Input value={f("contactPhone")} onChange={set("contactPhone")} placeholder="เช่น +66 61 396 6722" /></Field>
        </Row>
        <Row>
          <Field label="Line ID"><Input value={f("contactLine")} onChange={set("contactLine")} placeholder="เช่น M.V. Sri Amphan" /></Field>
        </Row>
      </Section>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={saving} className="cursor-pointer">ยกเลิก</Button>
        <Button type="submit" disabled={saving} className="cursor-pointer">
          {saving ? "กำลังบันทึก..." : "บันทึก"}
        </Button>
      </div>

    </form>
  );
}