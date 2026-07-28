import { useEffect, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { useApp } from "@/context";
import { api } from "@/api";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { localDateTime, minutesOfDay } from "@/lib/utils";
import type { Appointment, AppointmentKind, AppointmentStatus, NewAppointment, Patient } from "@/types";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  appointment: Appointment | null;
  date: string;
  defaults?: { operatoryId: number; minutesFromMidnight: number };
}

const STATUSES: AppointmentStatus[] = ["scheduled", "arrived", "in_chair", "completed", "no_show", "cancelled"];
const KINDS: AppointmentKind[] = ["patient", "break", "lunch", "block"];

export function AppointmentDialog({ open, onOpenChange, appointment, date, defaults }: Props) {
  const app = useApp();
  const { t, language } = app;

  const [kind, setKind] = useState<AppointmentKind>("patient");
  const [status, setStatus] = useState<AppointmentStatus>("scheduled");
  const [operatoryId, setOperatoryId] = useState<number | null>(null);
  const [practitionerId, setPractitionerId] = useState<number | null>(null);
  const [treatmentTypeId, setTreatmentTypeId] = useState<number | null>(null);
  const [patientId, setPatientId] = useState<number | null>(null);
  const [patientLabel, setPatientLabel] = useState("");
  const [patientResults, setPatientResults] = useState<Patient[]>([]);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (appointment) {
      setKind(appointment.kind);
      setStatus(appointment.status);
      setOperatoryId(appointment.operatory_id);
      setPractitionerId(appointment.practitioner_id);
      setTreatmentTypeId(appointment.treatment_type_id);
      setPatientId(appointment.patient_id);
      setPatientLabel(
        [appointment.patient_last_name, appointment.patient_first_name].filter(Boolean).join(" "),
      );
      setStartTime(appointment.start_time.slice(11, 16));
      setEndTime(appointment.end_time.slice(11, 16));
      setTitle(appointment.title ?? "");
      setNotes(appointment.notes ?? "");
    } else {
      setKind("patient");
      setStatus("scheduled");
      setOperatoryId(defaults?.operatoryId ?? app.operatories[0]?.id ?? null);
      setPractitionerId(null);
      setTreatmentTypeId(null);
      setPatientId(null);
      setPatientLabel("");
      const startMin = defaults?.minutesFromMidnight ?? 9 * 60;
      const endMin = startMin + (app.treatmentTypes[0]?.duration_minutes ?? 30);
      setStartTime(toHHMM(startMin));
      setEndTime(toHHMM(endMin));
      setTitle("");
      setNotes("");
    }
  }, [open, appointment, defaults, app.operatories, app.treatmentTypes]);

  useEffect(() => {
    if (kind !== "patient") return;
    const q = patientLabel.trim();
    if (!q || patientId) { setPatientResults([]); return; }
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const data = await api<{ patients: Patient[] }>("GET", `/api/patients?q=${encodeURIComponent(q)}`);
        if (!cancelled) setPatientResults(data.patients.slice(0, 6));
      } catch { /* ignore */ }
    }, 200);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [patientLabel, patientId, kind]);

  useEffect(() => {
    if (!treatmentTypeId || !startTime) return;
    const tt = app.treatmentTypes.find((tr) => tr.id === treatmentTypeId);
    if (!tt) return;
    const startMin = parseHHMM(startTime);
    setEndTime(toHHMM(startMin + tt.duration_minutes));
  }, [treatmentTypeId, startTime, app.treatmentTypes]);

  const isCreate = !appointment;

  const dialogTitleText = isCreate ? t("newAppointment") : t("editAppointment");

  const getKindLabel = (k: AppointmentKind) => {
    switch (k) {
      case "patient": return t("kindPatient");
      case "break": return t("kindBreak");
      case "lunch": return t("kindLunch");
      case "block": return t("kindBlock");
      default: return k;
    }
  };

  const getStatusLabel = (s: AppointmentStatus) => {
    switch (s) {
      case "scheduled": return t("scheduled");
      case "arrived": return t("arrived");
      case "in_chair": return t("inChair");
      case "completed": return t("completed");
      case "no_show": return t("noShow");
      case "cancelled": return t("cancelled");
      default: return s;
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!operatoryId) {
      app.setError(language === "ru" ? "Выберите кабинет" : "Kabinetni tanlang");
      return;
    }
    const startMin = parseHHMM(startTime);
    const endMin = parseHHMM(endTime);
    if (Number.isNaN(startMin) || Number.isNaN(endMin) || endMin <= startMin) {
      app.setError(language === "ru" ? "Время окончания должно быть позже начала" : "Tugash vaqti boshlanishidan keyin bo'lishi shart");
      return;
    }
    setSaving(true);
    try {
      let patient_id = patientId;
      if (kind === "patient" && !patient_id && patientLabel.trim()) {
        const [first, ...rest] = patientLabel.trim().split(/\s+/);
        const created = await app.createPatient({
          first_name: first,
          last_name: rest.join(" ") || "(noma'lum)",
        });
        patient_id = created.id;
      }

      const payload: NewAppointment = {
        operatory_id: operatoryId,
        practitioner_id: practitionerId ?? undefined,
        treatment_type_id: treatmentTypeId ?? undefined,
        patient_id: kind === "patient" ? patient_id : null,
        start_time: localDateTime(date, startMin),
        end_time: localDateTime(date, endMin),
        status,
        kind,
        title: title.trim() || null,
        notes: notes.trim() || null,
      };

      if (isCreate) {
        await app.createAppointment(payload);
      } else {
        await app.updateAppointment(appointment!.id, payload);
      }
      onOpenChange(false);
    } catch (err) {
      app.setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!appointment) return;
    const confirmMsg = language === "ru" ? "Удалить эту запись?" : "Qabul yozuvini o'chirasizmi?";
    if (!confirm(confirmMsg)) return;
    setSaving(true);
    try {
      await app.deleteAppointment(appointment.id);
      onOpenChange(false);
    } catch (err) {
      app.setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">{dialogTitleText}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("appointmentKind")}>
              <Select value={kind} onValueChange={(v) => setKind(v as AppointmentKind)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {KINDS.map((k) => (
                    <SelectItem key={k} value={k}>{getKindLabel(k)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t("operatory")}>
              <Select value={operatoryId?.toString() ?? ""} onValueChange={(v) => setOperatoryId(parseInt(v, 10))}>
                <SelectTrigger><SelectValue placeholder={t("selectOperatory")} /></SelectTrigger>
                <SelectContent>
                  {app.operatories.map((o) => (
                    <SelectItem key={o.id} value={o.id.toString()}>{o.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          {kind === "patient" ? (
            <div className="space-y-3">
              <Field label={t("patientName")}>
                <div className="relative">
                  <Input
                    value={patientLabel}
                    onChange={(e) => { setPatientLabel(e.target.value); setPatientId(null); }}
                    placeholder={t("search")}
                  />
                  {patientResults.length > 0 && !patientId && (
                    <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border bg-popover shadow-md">
                      {patientResults.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setPatientId(p.id);
                            setPatientLabel(`${p.last_name} ${p.first_name}`);
                            setPatientResults([]);
                          }}
                          className="block w-full px-3 py-2 text-left text-sm hover:bg-accent"
                        >
                          <div className="font-semibold">{p.last_name} {p.first_name}</div>
                          <div className="text-xs text-muted-foreground">{p.phone ?? p.date_of_birth ?? "—"}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label={t("practitioner")}>
                  <Select value={practitionerId?.toString() ?? "none"} onValueChange={(v) => setPractitionerId(v === "none" ? null : parseInt(v, 10))}>
                    <SelectTrigger><SelectValue placeholder={t("selectPractitioner")} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— {t("none")} —</SelectItem>
                      {app.practitioners.map((p) => (
                        <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label={t("treatmentType")}>
                  <Select value={treatmentTypeId?.toString() ?? "none"} onValueChange={(v) => setTreatmentTypeId(v === "none" ? null : parseInt(v, 10))}>
                    <SelectTrigger><SelectValue placeholder={t("selectTreatment")} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— {t("none")} —</SelectItem>
                      {app.treatmentTypes.map((tr) => (
                        <SelectItem key={tr.id} value={tr.id.toString()}>{tr.code} · {tr.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </div>
          ) : (
            <Field label={t("name")}>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={getKindLabel(kind)} />
            </Field>
          )}

          <div className="grid grid-cols-3 gap-3">
            <Field label={t("time") + " (Boshlanishi)"}>
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
            </Field>
            <Field label={t("time") + " (Tugashi)"}>
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
            </Field>
            <Field label={t("status")}>
              <Select value={status} onValueChange={(v) => setStatus(v as AppointmentStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{getStatusLabel(s)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label={t("notes")}>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder={t("notePlaceholder")} />
          </Field>

          <DialogFooter className="items-center">
            {!isCreate && (
              <Button type="button" variant="ghost" onClick={handleDelete} disabled={saving} className="mr-auto text-destructive hover:bg-destructive/10 hover:text-destructive">
                <Trash2 className="h-4 w-4" />
                {t("delete")}
              </Button>
            )}
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? t("loading") : isCreate ? t("add") : t("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-foreground/90">{label}</Label>
      {children}
    </div>
  );
}

function toHHMM(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function parseHHMM(s: string): number {
  const [h, m] = s.split(":").map((n) => parseInt(n, 10));
  return h * 60 + m;
}

void minutesOfDay;
