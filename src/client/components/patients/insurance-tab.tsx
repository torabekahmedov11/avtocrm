import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Shield } from "lucide-react";
import { api } from "@/api";
import { useApp } from "@/context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn, formatDate, formatCurrency } from "@/lib/utils";
import type { InsurancePlan, InsuranceRank } from "@/types";

const RANK_STYLE: Record<InsuranceRank, string> = {
  primary:   "bg-emerald-100 text-emerald-800 border-emerald-200 font-medium",
  secondary: "bg-sky-100 text-sky-800 border-sky-200 font-medium",
  tertiary:  "bg-violet-100 text-violet-800 border-violet-200 font-medium",
};

export function InsuranceTab({ patientId }: { patientId: number }) {
  const app = useApp();
  const { t, language } = app;

  const [plans, setPlans] = useState<InsurancePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<InsurancePlan | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await api<{ plans: InsurancePlan[] }>("GET", `/api/patients/${patientId}/insurance`);
        setPlans(data.plans);
      } catch (err) {
        app.setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [patientId, app]);

  async function remove(id: number) {
    const msg = language === "ru" ? "Удалить эту страховку?" : "Ushbu kafolat/sug'urta polisini o'chirasizmi?";
    if (!confirm(msg)) return;
    try {
      await api("DELETE", `/api/insurance-plans/${id}`);
      setPlans((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      app.setError((err as Error).message);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
          <Shield className="h-4 w-4 text-primary" />
          {plans.length} {language === "ru" ? "полис(ов) на учете" : "ta sug'urta/kafolat polisi"}
        </div>
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" /> {t("add")}
        </Button>
      </div>

      {loading ? (
        <p className="py-12 text-center text-sm text-muted-foreground">{t("loading")}</p>
      ) : plans.length === 0 ? (
        <Card className="shadow-2xs">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            {language === "ru" ? "Страховых полисов нет." : "Kafolat yoki sug'urta polislari mavjud emas."}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {plans.map((p) => (
            <PlanCard
              key={p.id}
              plan={p}
              onEdit={() => setEditing(p)}
              onRemove={() => remove(p.id)}
              lang={language}
            />
          ))}
        </div>
      )}

      <PlanDialog
        open={creating || !!editing}
        onOpenChange={(o) => { if (!o) { setCreating(false); setEditing(null); } }}
        plan={editing}
        patientId={patientId}
        onSaved={(plan) => {
          if (editing) setPlans((prev) => prev.map((x) => (x.id === plan.id ? plan : x)));
          else setPlans((prev) => [...prev, plan].sort((a, b) => rankOrder(a.rank) - rankOrder(b.rank)));
          setCreating(false);
          setEditing(null);
        }}
      />
    </div>
  );
}

function rankOrder(r: InsuranceRank): number {
  return r === "primary" ? 0 : r === "secondary" ? 1 : 2;
}

function PlanCard({ plan, onEdit, onRemove, lang }: { plan: InsurancePlan; onEdit: () => void; onRemove: () => void; lang: "uz" | "ru" }) {
  const { t } = useApp();
  const dedRemaining = Math.max(0, plan.deductible_total - plan.deductible_used);
  const maxRemaining = Math.max(0, plan.max_annual - plan.max_used);
  const dedPct = plan.deductible_total > 0 ? (plan.deductible_used / plan.deductible_total) * 100 : 0;
  const maxPct = plan.max_annual > 0 ? (plan.max_used / plan.max_annual) * 100 : 0;

  return (
    <Card className="shadow-2xs">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={cn("uppercase text-[10px]", RANK_STYLE[plan.rank])}>{plan.rank}</Badge>
              <CardTitle className="text-base font-bold">{plan.carrier}</CardTitle>
            </div>
            {plan.member_id && (
              <div className="mt-1 text-xs text-muted-foreground">Polis №: <span className="font-mono font-semibold text-foreground">{plan.member_id}</span></div>
            )}
          </div>
          <div className="flex gap-1">
            <Button size="icon" variant="ghost" onClick={onEdit} aria-label={t("edit")}><Pencil className="h-4 w-4" /></Button>
            <Button size="icon" variant="ghost" onClick={onRemove} aria-label={t("delete")}><Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" /></Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <Detail label={lang === "ru" ? "Застрахованный" : "Polis egasi"}>{plan.subscriber_name || "—"}{plan.subscriber_dob && <span className="text-muted-foreground"> · {formatDate(plan.subscriber_dob)}</span>}</Detail>
          <Detail label={lang === "ru" ? "Франшиза / Copay" : "Franshiza (Copay)"}>{formatCurrency(plan.copay, lang)}</Detail>
          <Detail label={lang === "ru" ? "Дата начала" : "Boshlanish sanasi"}>{plan.effective_date ? formatDate(plan.effective_date) : "—"}</Detail>
          <Detail label={lang === "ru" ? "Дата окончания" : "Tugash sanasi"}>{plan.term_date ? formatDate(plan.term_date) : "—"}</Detail>
        </div>

        {plan.deductible_total > 0 && (
          <Progress
            label={lang === "ru" ? "Лимит франшизы" : "Franshiza limiti"}
            used={plan.deductible_used}
            total={plan.deductible_total}
            remaining={dedRemaining}
            pct={dedPct}
            lang={lang}
          />
        )}
        {plan.max_annual > 0 && (
          <Progress
            label={lang === "ru" ? "Годовой лимит" : "Yillik maksimal limit"}
            used={plan.max_used}
            total={plan.max_annual}
            remaining={maxRemaining}
            pct={maxPct}
            lang={lang}
          />
        )}
        {plan.notes && <p className="text-xs text-muted-foreground">{plan.notes}</p>}
      </CardContent>
    </Card>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-medium">{children}</div>
    </div>
  );
}

function Progress({ label, used, total, remaining, pct, lang }: { label: string; used: number; total: number; remaining: number; pct: number; lang: "uz" | "ru" }) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-xs">
        <span className="font-semibold">{label}</span>
        <span className="tabular-nums text-muted-foreground">{formatCurrency(used, lang)} / {formatCurrency(total, lang)} · {formatCurrency(remaining, lang)} {lang === "ru" ? "осталось" : "qoldi"}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            pct >= 90 ? "bg-rose-500" : pct >= 60 ? "bg-amber-500" : "bg-emerald-500",
          )}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
    </div>
  );
}

// ── Dialog ─────────────────────────────────────────────────────────

function PlanDialog({
  open, onOpenChange, plan, patientId, onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  plan: InsurancePlan | null;
  patientId: number;
  onSaved: (p: InsurancePlan) => void;
}) {
  const app = useApp();
  const { t, language } = app;

  const [rank, setRank] = useState<InsuranceRank>("primary");
  const [carrier, setCarrier] = useState("");
  const [memberId, setMemberId] = useState("");
  const [groupId, setGroupId] = useState("");
  const [subscriberName, setSubscriberName] = useState("");
  const [subscriberDob, setSubscriberDob] = useState("");
  const [effective, setEffective] = useState("");
  const [term, setTerm] = useState("");
  const [copay, setCopay] = useState("0");
  const [dedTotal, setDedTotal] = useState("0");
  const [dedUsed, setDedUsed] = useState("0");
  const [maxAnnual, setMaxAnnual] = useState("0");
  const [maxUsed, setMaxUsed] = useState("0");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setRank(plan?.rank ?? "primary");
    setCarrier(plan?.carrier ?? "");
    setMemberId(plan?.member_id ?? "");
    setGroupId(plan?.group_id ?? "");
    setSubscriberName(plan?.subscriber_name ?? "");
    setSubscriberDob(plan?.subscriber_dob ?? "");
    setEffective(plan?.effective_date ?? "");
    setTerm(plan?.term_date ?? "");
    setCopay(plan?.copay.toString() ?? "0");
    setDedTotal(plan?.deductible_total.toString() ?? "0");
    setDedUsed(plan?.deductible_used.toString() ?? "0");
    setMaxAnnual(plan?.max_annual.toString() ?? "0");
    setMaxUsed(plan?.max_used.toString() ?? "0");
    setNotes(plan?.notes ?? "");
  }, [open, plan]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!carrier.trim()) {
      app.setError(language === "ru" ? "Укажите название компании" : "Sug'urta tashkiloti nomini kiriting");
      return;
    }
    setBusy(true);
    try {
      const body = {
        patient_id: patientId,
        rank,
        carrier: carrier.trim(),
        member_id: memberId.trim() || null,
        group_id: groupId.trim() || null,
        subscriber_name: subscriberName.trim() || null,
        subscriber_dob: subscriberDob || null,
        effective_date: effective || null,
        term_date: term || null,
        copay: parseFloat(copay) || 0,
        deductible_total: parseFloat(dedTotal) || 0,
        deductible_used: parseFloat(dedUsed) || 0,
        max_annual: parseFloat(maxAnnual) || 0,
        max_used: parseFloat(maxUsed) || 0,
        notes: notes.trim() || null,
      };
      const res = plan
        ? await api<{ plan: InsurancePlan }>("PUT", `/api/insurance-plans/${plan.id}`, body)
        : await api<{ plan: InsurancePlan }>("POST", "/api/insurance-plans", body);
      onSaved(res.plan);
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
          <DialogTitle className="text-lg font-bold">
            {plan ? (language === "ru" ? "Редактировать полис" : "Polisni tahrirlash") : (language === "ru" ? "Новый страховой полис" : "Yangi sug'urta/kafolat polisi")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Field label={language === "ru" ? "Ранг" : "Darajasi"}>
              <Select value={rank} onValueChange={(v) => setRank(v as InsuranceRank)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="primary">{language === "ru" ? "Основной" : "Asosiy"}</SelectItem>
                  <SelectItem value="secondary">{language === "ru" ? "Вторичный" : "Qo'shimcha"}</SelectItem>
                  <SelectItem value="tertiary">{language === "ru" ? "Третичный" : "Uchinchi"}</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label={language === "ru" ? "Компания *" : "Sug'urta kompaniyasi *"} className="col-span-2">
              <Input value={carrier} onChange={(e) => setCarrier(e.target.value)} placeholder="Uzbekinvest / Gross / Kafolat" required />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label={language === "ru" ? "Полис №" : "Polis №"}><Input value={memberId} onChange={(e) => setMemberId(e.target.value)} placeholder="UZ-998231" /></Field>
            <Field label={language === "ru" ? "Группа №" : "Guruh №"}><Input value={groupId} onChange={(e) => setGroupId(e.target.value)} placeholder="GRP-1002" /></Field>
            <Field label={language === "ru" ? "ФИО Застрахованного" : "Polis egasi F.I.Sh."}><Input value={subscriberName} onChange={(e) => setSubscriberName(e.target.value)} /></Field>
            <Field label={language === "ru" ? "Дата рождения" : "Tug'ilgan sanasi"}><Input type="date" value={subscriberDob} onChange={(e) => setSubscriberDob(e.target.value)} /></Field>
            <Field label={language === "ru" ? "Дата начала" : "Boshlanish sanasi"}><Input type="date" value={effective} onChange={(e) => setEffective(e.target.value)} /></Field>
            <Field label={language === "ru" ? "Дата окончания" : "Tugash sanasi"}><Input type="date" value={term} onChange={(e) => setTerm(e.target.value)} /></Field>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label={language === "ru" ? "Сооплата (сум)" : "Copay (so'm)"}><Input type="number" min="0" step="1000" value={copay} onChange={(e) => setCopay(e.target.value)} /></Field>
            <Field label="Franshiza (Jami)"><Input type="number" min="0" step="1000" value={dedTotal} onChange={(e) => setDedTotal(e.target.value)} /></Field>
            <Field label="Franshiza (Ishlatildi)"><Input type="number" min="0" step="1000" value={dedUsed} onChange={(e) => setDedUsed(e.target.value)} /></Field>
          </div>

          <Field label={t("notes")}>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder={t("notePlaceholder")} />
          </Field>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>{t("cancel")}</Button>
            <Button type="submit" disabled={busy}>{busy ? t("loading") : plan ? t("save") : t("add")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-xs font-semibold">{label}</Label>
      {children}
    </div>
  );
}
