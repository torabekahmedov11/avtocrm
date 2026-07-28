import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, FlaskConical, AlertTriangle } from "lucide-react";
import { api } from "@/api";
import { useApp } from "@/context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn, formatDate, formatCurrency } from "@/lib/utils";
import type { LabCase, LabStatus, Patient } from "@/types";

const STATUSES: LabStatus[] = ["sent", "in_lab", "received", "seated", "cancelled"];
const CASE_TYPES_UZ = ["Zirkon Koronka", "Metallokeramika", "Protez", "Inlay/Onlay", "Vinir", "Aligner", "Boshqa"];
const CASE_TYPES_RU = ["Циркон Коронка", "Металлокерамика", "Протез", "Вкладка Inlay/Onlay", "Винир", "Элайнер", "Другое"];

const STATUS_STYLE: Record<LabStatus, string> = {
  sent:      "bg-amber-100 text-amber-800 border-amber-200 font-medium",
  in_lab:    "bg-sky-100 text-sky-800 border-sky-200 font-medium",
  received:  "bg-emerald-100 text-emerald-800 border-emerald-200 font-medium",
  seated:    "bg-violet-100 text-violet-800 border-violet-200 font-medium",
  cancelled: "bg-slate-100 text-slate-700 border-slate-200 font-medium",
};

export function LabPage({ navigate }: { navigate: (to: string) => void }) {
  const app = useApp();
  const { t, language } = app;

  const [cases, setCases] = useState<LabCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<LabStatus | "all">("all");
  const [editing, setEditing] = useState<LabCase | null>(null);
  const [creating, setCreating] = useState(false);

  async function load() {
    try {
      setLoading(true);
      const url = statusFilter === "all" ? "/api/lab-cases" : `/api/lab-cases?status=${statusFilter}`;
      const data = await api<{ cases: LabCase[] }>("GET", url);
      setCases(data.cases);
    } catch (err) {
      app.setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const overdueCount = useMemo(() => {
    const now = new Date().toISOString();
    return cases.filter((c) => c.due_at && c.due_at < now && !c.received_at && c.status !== "cancelled").length;
  }, [cases]);

  const getStatusLabel = (s: LabStatus) => {
    switch (s) {
      case "sent": return language === "ru" ? "Отправлено" : "Yuborildi";
      case "in_lab": return language === "ru" ? "В лаборатории" : "Laboratoriyada";
      case "received": return language === "ru" ? "Получено" : "Keltirildi";
      case "seated": return language === "ru" ? "Установлено" : "O'rnatildi";
      case "cancelled": return language === "ru" ? "Отменено" : "Bekor qilindi";
      default: return s;
    }
  };

  async function setStatus(id: number, status: LabStatus) {
    try {
      const patch: Partial<LabCase> = { status };
      if (status === "received" && !cases.find((c) => c.id === id)?.received_at) {
        patch.received_at = new Date().toISOString();
      }
      if (status === "seated") {
        patch.seated_at = new Date().toISOString();
      }
      const res = await api<{ case: LabCase }>("PUT", `/api/lab-cases/${id}`, patch);
      setCases((prev) => prev.map((c) => (c.id === id ? res.case : c)));
    } catch (err) {
      app.setError((err as Error).message);
    }
  }

  async function remove(id: number) {
    const msg = language === "ru" ? "Удалить этот заказ?" : "Ushbu laboratoriya buyurtmasini o'chirasizmi?";
    if (!confirm(msg)) return;
    try {
      await api("DELETE", `/api/lab-cases/${id}`);
      setCases((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      app.setError((err as Error).message);
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-5 py-3.5 shadow-2xs">
        <h1 className="flex items-center gap-2 text-lg font-bold tracking-tight text-foreground">
          <FlaskConical className="h-5 w-5 text-primary" /> {t("labTitle")}
        </h1>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {overdueCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-800 border border-rose-200">
              <AlertTriangle className="h-3 w-3" />
              {overdueCount} {language === "ru" ? "просрочено" : "muddati o'tdi"}
            </span>
          )}
          <div className="w-48">
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as LabStatus | "all")}>
              <SelectTrigger className="h-9 text-xs font-medium"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("all")}</SelectItem>
                {STATUSES.map((s) => <SelectItem key={s} value={s}>{getStatusLabel(s)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => setCreating(true)} size="sm">
            <Plus className="h-4 w-4" /> {t("addLabCase")}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <Card className="overflow-hidden shadow-2xs">
          <CardContent className="p-0">
            {loading ? (
              <p className="py-12 text-center text-sm text-muted-foreground">{t("loading")}</p>
            ) : cases.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                {language === "ru" ? "Заказов пока нет" : "Laboratoriya buyurtmalari yo'q."}
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-3 py-2 font-semibold">{t("patientName")}</th>
                    <th className="px-3 py-2 font-semibold">{t("labName")}</th>
                    <th className="px-3 py-2 font-semibold">{t("caseType")}</th>
                    <th className="px-3 py-2 font-semibold">{t("toothNumber")}</th>
                    <th className="px-3 py-2 font-semibold">{t("sentAt")}</th>
                    <th className="px-3 py-2 font-semibold">{t("dueAt")}</th>
                    <th className="px-3 py-2 text-right font-semibold">{t("feeInUzs")}</th>
                    <th className="px-3 py-2 font-semibold">{t("status")}</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {cases.map((c) => {
                    const overdue = c.due_at && c.due_at < new Date().toISOString() && !c.received_at && c.status !== "cancelled";
                    return (
                      <tr key={c.id} className="border-b last:border-0 hover:bg-muted/20">
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            onClick={() => navigate(`/patients/${c.patient_id}`)}
                            className="font-semibold text-foreground hover:underline"
                          >
                            {c.last_name} {c.first_name}
                          </button>
                        </td>
                        <td className="px-3 py-2 font-medium">{c.lab_name}</td>
                        <td className="px-3 py-2">
                          <button type="button" onClick={() => setEditing(c)} className="text-foreground hover:underline font-medium">
                            {c.case_type}
                          </button>
                          {c.shade && <span className="ml-1 text-xs text-muted-foreground">· {c.shade}</span>}
                        </td>
                        <td className="px-3 py-2 tabular-nums font-semibold">{c.tooth ?? "—"}</td>
                        <td className="px-3 py-2 text-muted-foreground">{c.sent_at ? formatDate(c.sent_at) : "—"}</td>
                        <td className={cn("px-3 py-2 font-medium", overdue ? "font-bold text-rose-700" : "text-muted-foreground")}>
                          {c.due_at ? formatDate(c.due_at) : "—"}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums font-bold">{formatCurrency(c.fee, language)}</td>
                        <td className="px-3 py-2">
                          <Select value={c.status} onValueChange={(v) => setStatus(c.id, v as LabStatus)}>
                            <SelectTrigger className={cn("h-7 w-[140px] text-xs", STATUS_STYLE[c.status])}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUSES.map((s) => <SelectItem key={s} value={s}>{getStatusLabel(s)}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <Button size="icon" variant="ghost" onClick={() => remove(c.id)} aria-label={t("delete")}>
                            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>

      <LabCaseDialog
        open={creating || !!editing}
        onOpenChange={(o) => { if (!o) { setCreating(false); setEditing(null); } }}
        caseRow={editing}
        onSaved={(c) => {
          if (editing) {
            setCases((prev) => prev.map((x) => (x.id === c.id ? c : x)));
          } else {
            setCases((prev) => [c, ...prev]);
          }
          setCreating(false);
          setEditing(null);
        }}
      />
    </div>
  );
}

// ── Lab case dialog ────────────────────────────────────────────────

function LabCaseDialog({
  open, onOpenChange, caseRow, onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  caseRow: LabCase | null;
  onSaved: (c: LabCase) => void;
}) {
  const app = useApp();
  const { t, language } = app;

  const [patientId, setPatientId] = useState<number | null>(null);
  const [patientLabel, setPatientLabel] = useState("");
  const [results, setResults] = useState<Patient[]>([]);
  const [labName, setLabName] = useState("");
  const [caseType, setCaseType] = useState("Zirkon Koronka");
  const [tooth, setTooth] = useState("");
  const [shade, setShade] = useState("");
  const [fee, setFee] = useState("");
  const [sentAt, setSentAt] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [practitionerId, setPractitionerId] = useState<string>("none");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const caseTypesList = language === "ru" ? CASE_TYPES_RU : CASE_TYPES_UZ;

  useEffect(() => {
    if (!open) return;
    if (caseRow) {
      setPatientId(caseRow.patient_id);
      setPatientLabel(`${caseRow.last_name ?? ""} ${caseRow.first_name ?? ""}`.trim());
      setLabName(caseRow.lab_name);
      setCaseType(caseRow.case_type);
      setTooth(caseRow.tooth ?? "");
      setShade(caseRow.shade ?? "");
      setFee(caseRow.fee.toString());
      setSentAt(caseRow.sent_at ? caseRow.sent_at.slice(0, 10) : "");
      setDueAt(caseRow.due_at ? caseRow.due_at.slice(0, 10) : "");
      setPractitionerId(caseRow.practitioner_id?.toString() ?? "none");
      setNotes(caseRow.notes ?? "");
    } else {
      setPatientId(null);
      setPatientLabel("");
      setLabName("");
      setCaseType(caseTypesList[0]);
      setTooth("");
      setShade("");
      setFee("");
      setSentAt(new Date().toISOString().slice(0, 10));
      setDueAt("");
      setPractitionerId("none");
      setNotes("");
    }
  }, [open, caseRow]);

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
    if (!patientId) {
      app.setError(language === "ru" ? "Выберите пациента" : "Bemor tanlang");
      return;
    }
    setBusy(true);
    try {
      const body = {
        patient_id: patientId,
        practitioner_id: practitionerId === "none" ? null : parseInt(practitionerId, 10),
        lab_name: labName.trim(),
        case_type: caseType,
        tooth: tooth.trim() || null,
        shade: shade.trim() || null,
        fee: parseFloat(fee) || 0,
        sent_at: sentAt ? `${sentAt}T00:00:00` : null,
        due_at: dueAt ? `${dueAt}T00:00:00` : null,
        notes: notes.trim() || null,
      };
      const res = caseRow
        ? await api<{ case: LabCase }>("PUT", `/api/lab-cases/${caseRow.id}`, body)
        : await api<{ case: LabCase }>("POST", "/api/lab-cases", body);
      onSaved(res.case);
    } catch (err) {
      app.setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">{caseRow ? t("edit") : t("addLabCase")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">{t("patientName")} *</Label>
            <div className="relative">
              <Input
                value={patientLabel}
                onChange={(e) => { setPatientLabel(e.target.value); setPatientId(null); }}
                placeholder={t("search")}
              />
              {results.length > 0 && !patientId && (
                <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border bg-popover shadow-md">
                  {results.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => { setPatientId(p.id); setPatientLabel(`${p.last_name} ${p.first_name}`); setResults([]); }}
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-accent"
                    >
                      <div className="font-semibold">{p.last_name} {p.first_name}</div>
                      <div className="text-xs text-muted-foreground">{p.phone ?? p.date_of_birth ?? "—"}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label={`${t("labName")} *`}>
              <Input value={labName} onChange={(e) => setLabName(e.target.value)} placeholder="Dental Art Lab" required />
            </Field>
            <Field label={t("caseType")}>
              <Select value={caseType} onValueChange={setCaseType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {caseTypesList.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label={t("toothNumber")}><Input value={tooth} onChange={(e) => setTooth(e.target.value)} placeholder="14" /></Field>
            <Field label={t("shade")}><Input value={shade} onChange={(e) => setShade(e.target.value)} placeholder="A2" /></Field>
            <Field label={t("estimatedFee")}><Input type="number" min="0" step="1000" value={fee} onChange={(e) => setFee(e.target.value)} placeholder="600000" /></Field>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label={t("sentAt")}><Input type="date" value={sentAt} onChange={(e) => setSentAt(e.target.value)} /></Field>
            <Field label={t("dueAt")}><Input type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} /></Field>
            <Field label={t("practitioner")}>
              <Select value={practitionerId} onValueChange={setPractitionerId}>
                <SelectTrigger><SelectValue placeholder={t("selectPractitioner")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— {t("none")} —</SelectItem>
                  {app.practitioners.map((p) => <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label={t("notes")}>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder={t("notePlaceholder")} />
          </Field>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>{t("cancel")}</Button>
            <Button type="submit" disabled={busy}>{busy ? t("loading") : caseRow ? t("save") : t("add")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold">{label}</Label>
      {children}
    </div>
  );
}
