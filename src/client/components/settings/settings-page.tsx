import { useEffect, useState } from "react";
import { Plus, Trash2, Pencil, Check, X, Clock } from "lucide-react";
import { useApp } from "@/context";
import { api } from "@/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn, colorClasses, formatCurrency } from "@/lib/utils";
import type { Operatory, Practitioner, PractitionerRole, TreatmentType } from "@/types";

const COLOR_TOKENS = ["sky", "emerald", "amber", "rose", "violet", "fuchsia", "teal", "orange", "slate"] as const;
const ROLES: PractitionerRole[] = ["dentist", "hygienist", "assistant"];

export function SettingsPage() {
  const { t } = useApp();

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-5 py-3.5 shadow-2xs">
        <h1 className="text-lg font-bold tracking-tight text-foreground">{t("settings")}</h1>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <Tabs defaultValue="operatories">
          <TabsList className="bg-muted p-1">
            <TabsTrigger value="operatories">{t("operatoriesList")}</TabsTrigger>
            <TabsTrigger value="practitioners">{t("practitionersList")}</TabsTrigger>
            <TabsTrigger value="treatments">{t("treatmentTypesList")}</TabsTrigger>
            <TabsTrigger value="hours">{t("date")}</TabsTrigger>
          </TabsList>
          <TabsContent value="operatories" className="mt-4">
            <OperatoriesTab />
          </TabsContent>
          <TabsContent value="practitioners" className="mt-4">
            <PractitionersTab />
          </TabsContent>
          <TabsContent value="treatments" className="mt-4">
            <TreatmentTypesTab />
          </TabsContent>
          <TabsContent value="hours" className="mt-4">
            <HoursTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ── Hours ──────────────────────────────────────────────────────────

function HoursTab() {
  const app = useApp();
  const { t, language } = app;

  const [start, setStart] = useState(toHHMM(app.settings.day_start_minute));
  const [end, setEnd] = useState(toHHMM(app.settings.day_end_minute));
  const [slot, setSlot] = useState(app.settings.slot_minutes);
  const [busy, setBusy] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    setStart(toHHMM(app.settings.day_start_minute));
    setEnd(toHHMM(app.settings.day_end_minute));
    setSlot(app.settings.slot_minutes);
  }, [app.settings]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const startMin = parseHHMM(start);
    const endMin = parseHHMM(end);
    if (Number.isNaN(startMin) || Number.isNaN(endMin)) {
      app.setError(language === "ru" ? "Введите корректное время" : "To'g'ri vaqtni kiriting");
      return;
    }
    if (endMin <= startMin) {
      app.setError(language === "ru" ? "Конец должен быть позже начала" : "Tugash vaqti boshlanishidan keyin bo'lishi kerak");
      return;
    }
    setBusy(true);
    try {
      await app.updateSettings({
        day_start_minute: startMin,
        day_end_minute: endMin,
        slot_minutes: slot,
      });
      setSavedAt(Date.now());
    } catch (err) {
      app.setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="shadow-2xs">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Clock className="h-4 w-4 text-primary" />
          {language === "ru" ? "Рабочие часы клиники" : "Klinika ish soatlari"}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {language === "ru" ? "Управление временем работы agenda и интервалом ячеек." : "Kunlik agenda vaqt oralig'i hamda slotlar davomiyligini sozlash."}
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={save} className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
          <FieldGroup label={language === "ru" ? "Начало дня" : "Ish kuni boshlanishi"}>
            <Input type="time" value={start} onChange={(e) => setStart(e.target.value)} required />
          </FieldGroup>
          <FieldGroup label={language === "ru" ? "Конец дня" : "Ish kuni tugashi"}>
            <Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} required />
          </FieldGroup>
          <FieldGroup label={t("duration")}>
            <Select value={slot.toString()} onValueChange={(v) => setSlot(parseInt(v, 10))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {[5, 10, 15, 20, 30, 60].map((m) => (
                  <SelectItem key={m} value={m.toString()}>{m} {language === "ru" ? "мин" : "daq"}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldGroup>
          <Button type="submit" disabled={busy}>
            {busy ? t("loading") : t("save")}
          </Button>
        </form>
        {savedAt && (
          <p className="mt-3 text-xs font-semibold text-emerald-700">
            {language === "ru" ? "Сохранено. Изменения применены." : "Saqlandi. Sozlamalar darhol kuchga kirdi."}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function toHHMM(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function parseHHMM(s: string): number {
  const [h, m] = s.split(":").map((n) => parseInt(n, 10));
  if (!Number.isFinite(h) || !Number.isFinite(m)) return NaN;
  return h * 60 + m;
}

// ── Operatories ────────────────────────────────────────────────────

function OperatoriesTab() {
  const app = useApp();
  const { t, language } = app;

  const [name, setName] = useState("");
  const [color, setColor] = useState<string>("sky");
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("sky");

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      await api<{ operatory: Operatory }>("POST", "/api/operatories", {
        name: name.trim(),
        color,
      });
      app.refreshLookups();
      setName("");
      setColor("sky");
    } catch (err) {
      app.setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function save(id: number) {
    try {
      await api("PUT", `/api/operatories/${id}`, { name: editName.trim(), color: editColor });
      app.refreshLookups();
      setEditingId(null);
    } catch (err) {
      app.setError((err as Error).message);
    }
  }

  async function remove(id: number) {
    const msg = language === "ru" ? "Удалить этот кабинет?" : "Ushbu kabinetni o'chirasizmi?";
    if (!confirm(msg)) return;
    try {
      await api("DELETE", `/api/operatories/${id}`);
      app.refreshLookups();
    } catch (err) {
      app.setError((err as Error).message);
    }
  }

  return (
    <Card className="shadow-2xs">
      <CardHeader>
        <CardTitle className="text-base font-semibold">{t("operatoriesList")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <form onSubmit={add} className="grid items-end gap-2 rounded-md border bg-muted/30 p-3 sm:grid-cols-[2fr_1fr_auto]">
          <FieldGroup label={t("name")}>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="1-Kabinet (Terapevtik)" required />
          </FieldGroup>
          <FieldGroup label={language === "ru" ? "Цвет" : "Rang"}>
            <ColorSelect value={color} onChange={setColor} />
          </FieldGroup>
          <Button type="submit" disabled={busy}>
            <Plus className="h-4 w-4" /> {t("add")}
          </Button>
        </form>

        <div className="overflow-hidden rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-3 py-2 font-semibold">{t("name")}</th>
                <th className="px-3 py-2 font-semibold">{language === "ru" ? "Цвет" : "Rang"}</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {app.operatories.length === 0 ? (
                <tr><td colSpan={3} className="px-3 py-8 text-center text-muted-foreground">{t("none")}</td></tr>
              ) : app.operatories.map((o) => {
                const palette = colorClasses(o.color);
                const editing = editingId === o.id;
                return (
                  <tr key={o.id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-3 py-2">
                      {editing ? (
                        <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-8 text-xs" />
                      ) : (
                        <div className="flex items-center gap-2 font-semibold text-foreground">
                          <span className={cn("inline-block h-2 w-2 rounded-full", palette.dot)} />
                          {o.name}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {editing ? (
                        <ColorSelect value={editColor} onChange={setEditColor} />
                      ) : (
                        <span className="capitalize text-muted-foreground">{o.color}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {editing ? (
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" onClick={() => save(o.id)}><Check className="h-4 w-4 text-emerald-600" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}><X className="h-4 w-4" /></Button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" onClick={() => { setEditingId(o.id); setEditName(o.name); setEditColor(o.color); }}><Pencil className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => remove(o.id)}><Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" /></Button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Practitioners ──────────────────────────────────────────────────

function PractitionersTab() {
  const app = useApp();
  const { t, language } = app;

  const [name, setName] = useState("");
  const [role, setRole] = useState<PractitionerRole>("dentist");
  const [color, setColor] = useState("teal");
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [edit, setEdit] = useState<{ name: string; role: PractitionerRole; color: string }>({ name: "", role: "dentist", color: "teal" });

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      await api<{ practitioner: Practitioner }>("POST", "/api/practitioners", {
        name: name.trim(), role, color,
      });
      app.refreshLookups();
      setName("");
      setRole("dentist");
      setColor("teal");
    } catch (err) {
      app.setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function save(id: number) {
    try {
      await api("PUT", `/api/practitioners/${id}`, edit);
      app.refreshLookups();
      setEditingId(null);
    } catch (err) {
      app.setError((err as Error).message);
    }
  }

  async function remove(id: number) {
    const msg = language === "ru" ? "Удалить этого врача?" : "Ushbu shifokorni o'chirasizmi?";
    if (!confirm(msg)) return;
    try {
      await api("DELETE", `/api/practitioners/${id}`);
      app.refreshLookups();
    } catch (err) {
      app.setError((err as Error).message);
    }
  }

  return (
    <Card className="shadow-2xs">
      <CardHeader>
        <CardTitle className="text-base font-semibold">{t("practitionersList")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <form onSubmit={add} className="grid items-end gap-2 rounded-md border bg-muted/30 p-3 sm:grid-cols-[2fr_1fr_1fr_auto]">
          <FieldGroup label={t("name")}>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Dr. Anvar Rahimov" required />
          </FieldGroup>
          <FieldGroup label={language === "ru" ? "Должность" : "Lavozim"}>
            <Select value={role} onValueChange={(v) => setRole(v as PractitionerRole)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </FieldGroup>
          <FieldGroup label={language === "ru" ? "Цвет" : "Rang"}>
            <ColorSelect value={color} onChange={setColor} />
          </FieldGroup>
          <Button type="submit" disabled={busy}>
            <Plus className="h-4 w-4" /> {t("add")}
          </Button>
        </form>

        <div className="overflow-hidden rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-3 py-2 font-semibold">{t("name")}</th>
                <th className="px-3 py-2 font-semibold">{language === "ru" ? "Должность" : "Lavozim"}</th>
                <th className="px-3 py-2 font-semibold">{language === "ru" ? "Цвет" : "Rang"}</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {app.practitioners.length === 0 ? (
                <tr><td colSpan={4} className="px-3 py-8 text-center text-muted-foreground">{t("none")}</td></tr>
              ) : app.practitioners.map((p) => {
                const palette = colorClasses(p.color);
                const editing = editingId === p.id;
                return (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-3 py-2">
                      {editing ? (
                        <Input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} className="h-8 text-xs" />
                      ) : (
                        <div className="flex items-center gap-2 font-semibold text-foreground">
                          <span className={cn("inline-block h-2 w-2 rounded-full", palette.dot)} />
                          {p.name}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 font-medium capitalize">
                      {editing ? (
                        <Select value={edit.role} onValueChange={(v) => setEdit({ ...edit, role: v as PractitionerRole })}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>{ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                        </Select>
                      ) : p.role}
                    </td>
                    <td className="px-3 py-2">
                      {editing ? <ColorSelect value={edit.color} onChange={(c) => setEdit({ ...edit, color: c })} /> : <span className="capitalize text-muted-foreground">{p.color}</span>}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {editing ? (
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" onClick={() => save(p.id)}><Check className="h-4 w-4 text-emerald-600" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}><X className="h-4 w-4" /></Button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" onClick={() => { setEditingId(p.id); setEdit({ name: p.name, role: p.role, color: p.color }); }}><Pencil className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" /></Button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Treatment types ────────────────────────────────────────────────

function TreatmentTypesTab() {
  const app = useApp();
  const { t, language } = app;

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [duration, setDuration] = useState("30");
  const [fee, setFee] = useState("0");
  const [color, setColor] = useState("sky");
  const [busy, setBusy] = useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;
    setBusy(true);
    try {
      await api<{ treatment_type: TreatmentType }>("POST", "/api/treatment-types", {
        code: code.trim(),
        name: name.trim(),
        duration_minutes: parseInt(duration, 10) || 30,
        default_fee: parseFloat(fee) || 0,
        color,
      });
      app.refreshLookups();
      setCode("");
      setName("");
      setDuration("30");
      setFee("0");
      setColor("sky");
    } catch (err) {
      app.setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: number) {
    const msg = language === "ru" ? "Удалить эту услугу?" : "Ushbu xizmat turini o'chirasizmi?";
    if (!confirm(msg)) return;
    try {
      await api("DELETE", `/api/treatment-types/${id}`);
      app.refreshLookups();
    } catch (err) {
      app.setError((err as Error).message);
    }
  }

  return (
    <Card className="shadow-2xs">
      <CardHeader>
        <CardTitle className="text-base font-semibold">{t("treatmentTypesList")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <form onSubmit={add} className="grid items-end gap-2 rounded-md border bg-muted/30 p-3 sm:grid-cols-[1fr_2fr_1fr_1fr_1fr_auto]">
          <FieldGroup label={t("code")}><Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="FILL" required /></FieldGroup>
          <FieldGroup label={t("name")}><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Plomba quyish" required /></FieldGroup>
          <FieldGroup label={t("duration")}><Input type="number" min="5" value={duration} onChange={(e) => setDuration(e.target.value)} /></FieldGroup>
          <FieldGroup label={t("feeInUzs")}><Input type="number" step="1000" min="0" value={fee} onChange={(e) => setFee(e.target.value)} placeholder="250000" /></FieldGroup>
          <FieldGroup label={language === "ru" ? "Цвет" : "Rang"}><ColorSelect value={color} onChange={setColor} /></FieldGroup>
          <Button type="submit" disabled={busy}><Plus className="h-4 w-4" /> {t("add")}</Button>
        </form>

        <div className="overflow-hidden rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-3 py-2 font-semibold">{t("code")}</th>
                <th className="px-3 py-2 font-semibold">{t("name")}</th>
                <th className="px-3 py-2 text-right font-semibold">{t("duration")}</th>
                <th className="px-3 py-2 text-right font-semibold">{t("feeInUzs")}</th>
                <th className="px-3 py-2 font-semibold">{language === "ru" ? "Цвет" : "Rang"}</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {app.treatmentTypes.length === 0 ? (
                <tr><td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">{t("none")}</td></tr>
              ) : app.treatmentTypes.map((tr) => {
                const palette = colorClasses(tr.color);
                return (
                  <tr key={tr.id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-3 py-2 font-mono text-xs font-bold">{tr.code}</td>
                    <td className="px-3 py-2 font-semibold text-foreground">{tr.name}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-muted-foreground font-medium">{tr.duration_minutes} {language === "ru" ? "мин" : "daq"}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-bold text-foreground">{formatCurrency(tr.default_fee, language)}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className={cn("inline-block h-2 w-2 rounded-full", palette.dot)} />
                        <span className="capitalize text-muted-foreground">{tr.color}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Button size="icon" variant="ghost" onClick={() => remove(tr.id)}><Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" /></Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Helpers ────────────────────────────────────────────────────────

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold">{label}</Label>
      {children}
    </div>
  );
}

function ColorSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {COLOR_TOKENS.map((c) => (
          <SelectItem key={c} value={c}>
            <div className="flex items-center gap-2">
              <span className={cn("inline-block h-2 w-2 rounded-full", colorClasses(c).dot)} />
              <span className="capitalize">{c}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
