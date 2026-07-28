import { useEffect, useState } from "react";
import { Plus, Trash2, ChevronRight, ChevronLeft, ListChecks, CalendarPlus } from "lucide-react";
import { useApp } from "@/context";
import { api } from "@/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, colorClasses, formatDate } from "@/lib/utils";
import type { AppointmentToMake, Patient, ToMakeSource, WaitingListEntry } from "@/types";

const TO_MAKE_SOURCES: ToMakeSource[] = ["reception", "patient", "system"];

export function AgendaSidePanel() {
  const [collapsed, setCollapsed] = useState(false);
  const { t } = useApp();

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        className="flex h-full w-8 items-center justify-center border-l bg-card text-muted-foreground transition-colors hover:bg-accent"
        aria-label={t("actions")}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
    );
  }

  return (
    <aside className="flex h-full w-80 shrink-0 flex-col border-l bg-card">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("actions")}</span>
        <Button variant="ghost" size="icon" onClick={() => setCollapsed(true)} aria-label={t("close")}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <Tabs defaultValue="waiting" className="flex flex-1 flex-col">
        <TabsList className="mx-3 mt-3">
          <TabsTrigger value="waiting" className="flex-1 text-xs font-semibold">
            <ListChecks className="h-3.5 w-3.5" /> {t("waitingListTitle")}
          </TabsTrigger>
          <TabsTrigger value="to-make" className="flex-1 text-xs font-semibold">
            <CalendarPlus className="h-3.5 w-3.5" /> {t("appointmentsToMakeTitle")}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="waiting" className="flex-1 overflow-auto px-3 pb-3">
          <WaitingListPanel />
        </TabsContent>
        <TabsContent value="to-make" className="flex-1 overflow-auto px-3 pb-3">
          <ToMakePanel />
        </TabsContent>
      </Tabs>
    </aside>
  );
}

// ── Waiting list ──────────────────────────────────────────────────

function WaitingListPanel() {
  const app = useApp();
  const { t, language } = app;
  const [adding, setAdding] = useState(false);

  return (
    <div className="space-y-3">
      <div className="text-xs text-muted-foreground">
        {language === "ru" ? "Пациенты, ожидающие освобождения времени" : "Vaqtroq bo'sh vaqtga yozilishni kutayotgan bemorlar."}
      </div>
      <Button size="sm" variant="outline" onClick={() => setAdding(true)} className="w-full">
        <Plus className="h-4 w-4" /> {t("add")}
      </Button>
      {adding && <AddWaitingListForm onClose={() => setAdding(false)} />}

      {app.waitingList.length === 0 && !adding ? (
        <div className="rounded-md border border-dashed py-6 text-center text-xs text-muted-foreground">
          {language === "ru" ? "Лист ожидания пуст" : "Kutish ro'yxati bo'sh."}
        </div>
      ) : (
        <div className="space-y-2">
          {app.waitingList.map((w) => (
            <WaitingListRow key={w.id} entry={w} />
          ))}
        </div>
      )}
    </div>
  );
}

function WaitingListRow({ entry }: { entry: WaitingListEntry }) {
  const app = useApp();
  const { language, t } = app;
  const palette = colorClasses(entry.treatment_color || "sky");
  async function remove() {
    const msg = language === "ru" ? "Удалить из листа ожидания?" : "Kutish ro'yxatidan o'chirilsinmi?";
    if (!confirm(msg)) return;
    try {
      await api("DELETE", `/api/waiting-list/${entry.id}`);
      await app.refreshSidePanels();
    } catch (err) {
      app.setError((err as Error).message);
    }
  }
  return (
    <Card className="shadow-2xs">
      <CardContent className="space-y-1 p-3 text-sm">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="font-semibold text-foreground">{entry.last_name} {entry.first_name}</div>
            {entry.date_of_birth && (
              <div className="text-xs text-muted-foreground">{formatDate(entry.date_of_birth)}</div>
            )}
          </div>
          <Button size="icon" variant="ghost" onClick={remove} aria-label={t("delete")}>
            <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {entry.treatment_name && (
            <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-medium", palette.bg, palette.text)}>
              <span className={cn("inline-block h-1.5 w-1.5 rounded-full", palette.dot)} />
              {entry.treatment_name}
            </span>
          )}
          <span className="text-muted-foreground font-medium">{entry.duration_minutes} {language === "ru" ? "мин" : "daq"}</span>
          {entry.practitioner_name && (
            <span className="text-muted-foreground">· {entry.practitioner_name}</span>
          )}
        </div>
        {entry.notes && <p className="text-xs text-muted-foreground">{entry.notes}</p>}
      </CardContent>
    </Card>
  );
}

function AddWaitingListForm({ onClose }: { onClose: () => void }) {
  const app = useApp();
  const { t, language } = app;

  const [patientLabel, setPatientLabel] = useState("");
  const [patientId, setPatientId] = useState<number | null>(null);
  const [results, setResults] = useState<Patient[]>([]);
  const [treatmentTypeId, setTreatmentTypeId] = useState<string>("none");
  const [practitionerId, setPractitionerId] = useState<string>("none");
  const [duration, setDuration] = useState("30");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const q = patientLabel.trim();
    if (!q || patientId) { setResults([]); return; }
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const r = await api<{ patients: Patient[] }>("GET", `/api/patients?q=${encodeURIComponent(q)}`);
        if (!cancelled) setResults(r.patients.slice(0, 5));
      } catch { /* ignore */ }
    }, 200);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [patientLabel, patientId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!patientId && !patientLabel.trim()) {
      app.setError(language === "ru" ? "Введите имя пациента" : "Bemor ismini kiriting");
      return;
    }
    setBusy(true);
    try {
      let pid = patientId;
      if (!pid) {
        const [first, ...rest] = patientLabel.trim().split(/\s+/);
        const created = await app.createPatient({
          first_name: first,
          last_name: rest.join(" ") || "(noma'lum)",
        });
        pid = created.id;
      }
      await api("POST", "/api/waiting-list", {
        patient_id: pid,
        treatment_type_id: treatmentTypeId === "none" ? null : parseInt(treatmentTypeId, 10),
        preferred_practitioner_id: practitionerId === "none" ? null : parseInt(practitionerId, 10),
        duration_minutes: parseInt(duration, 10) || 30,
        notes: notes.trim() || null,
      });
      await app.refreshSidePanels();
      onClose();
    } catch (err) {
      app.setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-2 rounded-md border bg-muted/30 p-3">
      <FieldSm label={t("patientName")}>
        <div className="relative">
          <Input
            value={patientLabel}
            onChange={(e) => { setPatientLabel(e.target.value); setPatientId(null); }}
            placeholder={t("search")}
            className="h-8 text-xs"
          />
          {results.length > 0 && !patientId && (
            <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border bg-popover shadow-md">
              {results.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => { setPatientId(p.id); setPatientLabel(`${p.last_name} ${p.first_name}`); setResults([]); }}
                  className="block w-full px-3 py-1.5 text-left text-xs hover:bg-accent"
                >
                  <div className="font-semibold">{p.last_name} {p.first_name}</div>
                  <div className="text-muted-foreground">{p.phone ?? p.date_of_birth ?? "—"}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </FieldSm>
      <FieldSm label={t("treatmentType")}>
        <Select value={treatmentTypeId} onValueChange={setTreatmentTypeId}>
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">— {t("none")} —</SelectItem>
            {app.treatmentTypes.map((tr) => <SelectItem key={tr.id} value={tr.id.toString()}>{tr.code} · {tr.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </FieldSm>
      <FieldSm label={t("practitioner")}>
        <Select value={practitionerId} onValueChange={setPractitionerId}>
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">— {t("all")} —</SelectItem>
            {app.practitioners.map((p) => <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </FieldSm>
      <FieldSm label={t("duration")}>
        <Input type="number" min="5" value={duration} onChange={(e) => setDuration(e.target.value)} className="h-8 text-xs" />
      </FieldSm>
      <FieldSm label={t("notes")}>
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} className="h-8 text-xs" />
      </FieldSm>
      <div className="flex gap-2 pt-1">
        <Button size="sm" type="submit" disabled={busy} className="flex-1">{t("save")}</Button>
        <Button size="sm" type="button" variant="outline" onClick={onClose}>{t("cancel")}</Button>
      </div>
    </form>
  );
}

// ── Appointments to make ──────────────────────────────────────────

function ToMakePanel() {
  const app = useApp();
  const { t } = app;
  const [adding, setAdding] = useState(false);
  const [filter, setFilter] = useState<ToMakeSource | "all">("all");

  const visible = filter === "all"
    ? app.appointmentsToMake
    : app.appointmentsToMake.filter((a) => a.source === filter);

  return (
    <div className="space-y-3">
      <div className="text-xs text-muted-foreground">
        {t("appointmentsToMakeTitle")}
      </div>
      <Button size="sm" variant="outline" onClick={() => setAdding(true)} className="w-full">
        <Plus className="h-4 w-4" /> {t("add")}
      </Button>
      {adding && <AddToMakeForm onClose={() => setAdding(false)} />}

      {visible.length === 0 && !adding ? (
        <div className="rounded-md border border-dashed py-6 text-center text-xs text-muted-foreground">
          {t("none")}
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((a) => <ToMakeRow key={a.id} entry={a} />)}
        </div>
      )}
    </div>
  );
}

function ToMakeRow({ entry }: { entry: AppointmentToMake }) {
  const app = useApp();
  const { language, t } = app;
  const palette = colorClasses(entry.treatment_color || "sky");
  async function remove() {
    const msg = language === "ru" ? "Удалить запись?" : "O'chirilsinmi?";
    if (!confirm(msg)) return;
    try {
      await api("DELETE", `/api/appointments-to-make/${entry.id}`);
      await app.refreshSidePanels();
    } catch (err) {
      app.setError((err as Error).message);
    }
  }
  return (
    <Card className="shadow-2xs">
      <CardContent className="space-y-1 p-3 text-sm">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="font-semibold text-foreground">{entry.last_name} {entry.first_name}</div>
            {entry.date_of_birth && (
              <div className="text-xs text-muted-foreground">{formatDate(entry.date_of_birth)}</div>
            )}
          </div>
          <Button size="icon" variant="ghost" onClick={remove} aria-label={t("delete")}>
            <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {entry.treatment_name && (
            <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-medium", palette.bg, palette.text)}>
              <span className={cn("inline-block h-1.5 w-1.5 rounded-full", palette.dot)} />
              {entry.treatment_name}
            </span>
          )}
          {entry.due_after && (
            <span className="text-muted-foreground">· {formatDate(entry.due_after)}</span>
          )}
        </div>
        {entry.notes && <p className="text-xs text-muted-foreground">{entry.notes}</p>}
      </CardContent>
    </Card>
  );
}

function AddToMakeForm({ onClose }: { onClose: () => void }) {
  const app = useApp();
  const { t, language } = app;

  const [patientLabel, setPatientLabel] = useState("");
  const [patientId, setPatientId] = useState<number | null>(null);
  const [results, setResults] = useState<Patient[]>([]);
  const [treatmentTypeId, setTreatmentTypeId] = useState("none");
  const [source, setSource] = useState<ToMakeSource>("reception");
  const [dueAfter, setDueAfter] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const q = patientLabel.trim();
    if (!q || patientId) { setResults([]); return; }
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const r = await api<{ patients: Patient[] }>("GET", `/api/patients?q=${encodeURIComponent(q)}`);
        if (!cancelled) setResults(r.patients.slice(0, 5));
      } catch { /* ignore */ }
    }, 200);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [patientLabel, patientId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!patientId && !patientLabel.trim()) {
      app.setError(language === "ru" ? "Введите имя пациента" : "Bemor ismini kiriting");
      return;
    }
    setBusy(true);
    try {
      let pid = patientId;
      if (!pid) {
        const [first, ...rest] = patientLabel.trim().split(/\s+/);
        const created = await app.createPatient({
          first_name: first,
          last_name: rest.join(" ") || "(noma'lum)",
        });
        pid = created.id;
      }
      await api("POST", "/api/appointments-to-make", {
        patient_id: pid,
        treatment_type_id: treatmentTypeId === "none" ? null : parseInt(treatmentTypeId, 10),
        source,
        due_after: dueAfter || null,
        notes: notes.trim() || null,
      });
      await app.refreshSidePanels();
      onClose();
    } catch (err) {
      app.setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-2 rounded-md border bg-muted/30 p-3">
      <FieldSm label={t("patientName")}>
        <div className="relative">
          <Input value={patientLabel} onChange={(e) => { setPatientLabel(e.target.value); setPatientId(null); }} placeholder={t("search")} className="h-8 text-xs" />
          {results.length > 0 && !patientId && (
            <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border bg-popover shadow-md">
              {results.map((p) => (
                <button key={p.id} type="button" onClick={() => { setPatientId(p.id); setPatientLabel(`${p.last_name} ${p.first_name}`); setResults([]); }} className="block w-full px-3 py-1.5 text-left text-xs hover:bg-accent">
                  <div className="font-semibold">{p.last_name} {p.first_name}</div>
                  <div className="text-muted-foreground">{p.phone ?? p.date_of_birth ?? "—"}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </FieldSm>
      <FieldSm label={t("treatmentType")}>
        <Select value={treatmentTypeId} onValueChange={setTreatmentTypeId}>
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">— {t("none")} —</SelectItem>
            {app.treatmentTypes.map((tr) => <SelectItem key={tr.id} value={tr.id.toString()}>{tr.code} · {tr.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </FieldSm>
      <FieldSm label={t("date")}>
        <Input type="date" value={dueAfter} onChange={(e) => setDueAfter(e.target.value)} className="h-8 text-xs" />
      </FieldSm>
      <FieldSm label={t("notes")}>
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} className="h-8 text-xs" />
      </FieldSm>
      <div className="flex gap-2 pt-1">
        <Button size="sm" type="submit" disabled={busy} className="flex-1">{t("save")}</Button>
        <Button size="sm" type="button" variant="outline" onClick={onClose}>{t("cancel")}</Button>
      </div>
    </form>
  );
}

function FieldSm({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
