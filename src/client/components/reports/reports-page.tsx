import { useEffect, useState } from "react";
import {
  CalendarDays, CalendarRange, TrendingUp, Wallet, AlertTriangle, FlaskConical, Users, ListChecks, Activity,
} from "lucide-react";
import { api } from "@/api";
import { useApp } from "@/context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatCurrency } from "@/lib/utils";
import type { ReportsSummary } from "@/types";

export function ReportsPage() {
  const app = useApp();
  const { t, language } = app;
  const [data, setData] = useState<ReportsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await api<ReportsSummary>("GET", "/api/reports/summary");
        setData(res);
      } catch (err) {
        app.setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [app]);

  if (loading || !data) {
    return (
      <div className="flex flex-1 items-center justify-center text-slate-500 font-medium">
        {loading ? t("loading") : (language === "ru" ? "Нет данных" : "Ma'lumotlar yo'q")}
      </div>
    );
  }

  const completedRate = data.month_appointments
    ? Math.round((data.month_completed / data.month_appointments) * 100)
    : 0;
  const noShowRate = data.month_appointments
    ? Math.round((data.month_no_shows / data.month_appointments) * 100)
    : 0;
  const collectionRate = data.month_production
    ? Math.round((data.month_collections / data.month_production) * 100)
    : 0;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-5 py-3.5 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 border border-teal-200 text-teal-700 shadow-2xs">
            <Activity className="h-5 w-5 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-slate-900 leading-snug">{t("reportsTitle")}</h1>
            <p className="text-xs font-semibold text-slate-500">
              {language === "ru" ? "Показатели клиники · За текущий месяц" : "Klinika moliyaviy va klinik ko'rsatkichlari · Oylik hisobot"}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-5 overflow-auto p-5">
        {/* KPI cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiCard icon={CalendarDays}  label={language === "ru" ? "Приемы сегодня" : "Bugungi qabullar"} value={data.today_appointments.toString()} tone="sky" />
          <KpiCard icon={CalendarRange} label={language === "ru" ? "На этой неделе" : "Haftalik qabullar"} value={data.week_appointments.toString()}  tone="emerald" />
          <KpiCard icon={TrendingUp}    label={t("totalRevenue")} value={formatCurrency(data.month_production, language)} sub={`${data.month_appointments} ${language === "ru" ? "приемов" : "ta qabul"}`} tone="violet" />
          <KpiCard icon={Wallet}        label={t("amountPaid")} value={formatCurrency(data.month_collections, language)} sub={`${collectionRate}% ${language === "ru" ? "оплачено" : "to'landi"}`} tone="amber" />
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {/* Completion vs no-show */}
          <Card className="shadow-xs">
            <CardHeader>
              <CardTitle className="text-base font-bold">
                {language === "ru" ? "Итоги приемов за месяц" : "Oylik qabullar natijalari"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Bar label={t("completed")} count={data.month_completed} total={data.month_appointments || 1} pct={completedRate} tone="emerald" />
              <Bar label={t("noShow")}  count={data.month_no_shows}  total={data.month_appointments || 1} pct={noShowRate}    tone="rose" />
              <Bar label={t("cancelled")} count={data.month_cancelled} total={data.month_appointments || 1} pct={Math.round((data.month_cancelled / (data.month_appointments || 1)) * 100)} tone="slate" />
            </CardContent>
          </Card>

          {/* Operational alerts */}
          <Card className="shadow-xs">
            <CardHeader>
              <CardTitle className="text-base font-bold">
                {language === "ru" ? "Требует внимания" : "E'tibor berish kerak bo'lgan holatlar"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-sm">
              <Alert icon={ListChecks} label={t("waitingListTitle")} value={data.waiting_list_count} tone={data.waiting_list_count > 0 ? "sky" : "slate"} />
              <Alert icon={FlaskConical} label={t("labTitle")} value={data.overdue_lab_cases} tone={data.overdue_lab_cases > 0 ? "rose" : "slate"} />
              <Alert icon={AlertTriangle} label={t("noShow")} value={data.month_no_shows} tone={data.month_no_shows > 0 ? "amber" : "slate"} />
            </CardContent>
          </Card>
        </div>

        {/* Aged receivables */}
        <Card className="shadow-xs">
          <CardHeader>
            <CardTitle className="text-base font-bold">{t("balanceDue")}</CardTitle>
            <p className="text-xs font-semibold text-slate-500">
              {language === "ru" ? "Задолженность по срокам (в днях)" : "Qarzdorlik muddatlari va qoldiqlar bo'yicha (kunlarda)"}
            </p>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <ARBucket label={`0–30 ${language === "ru" ? "дней" : "kun"}`}  amount={data.aged_receivables["0-30"]}  tone="emerald" lang={language} />
            <ARBucket label={`31–60 ${language === "ru" ? "дней" : "kun"}`} amount={data.aged_receivables["31-60"]} tone="amber" lang={language} />
            <ARBucket label={`61–90 ${language === "ru" ? "дней" : "kun"}`} amount={data.aged_receivables["61-90"]} tone="orange" lang={language} />
            <ARBucket label={`90+ ${language === "ru" ? "дней" : "kun"}`}   amount={data.aged_receivables["90+"]}   tone="rose" lang={language} />
          </CardContent>
        </Card>

        <div className="grid gap-5 lg:grid-cols-2">
          {/* By treatment */}
          <Card className="shadow-xs">
            <CardHeader>
              <CardTitle className="text-base font-bold">{t("revenueByTreatment")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {data.by_treatment.length === 0 ? (
                <p className="text-xs font-semibold text-slate-400 py-4 text-center">
                  {language === "ru" ? "В этом месяце приемов еще не было" : "Ushbu oyda bajarilgan muolajalar yo'q."}
                </p>
              ) : (
                data.by_treatment.slice(0, 8).map((row, i) => {
                  const max = data.by_treatment[0].n || 1;
                  return (
                    <Bar
                      key={`${row.name}-${i}`}
                      label={row.name}
                      count={row.n}
                      total={max}
                      pct={Math.round((row.n / max) * 100)}
                      tone="sky"
                    />
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* By marketing source */}
          <Card className="shadow-xs">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-bold">
                <Users className="h-4 w-4 text-teal-600" /> {t("referralSource")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {data.by_source.length === 0 ? (
                <p className="text-xs font-semibold text-slate-400 py-4 text-center">
                  {language === "ru" ? "Пациентов пока нет" : "Hali bemorlar ma'lumotlari yo'q."}
                </p>
              ) : (
                data.by_source.slice(0, 8).map((row, i) => {
                  const max = data.by_source[0].n || 1;
                  return (
                    <Bar
                      key={`${row.source}-${i}`}
                      label={row.source}
                      count={row.n}
                      total={max}
                      pct={Math.round((row.n / max) * 100)}
                      tone="violet"
                    />
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

const TONE: Record<string, { bg: string; border: string; text: string; bar: string; iconBg: string }> = {
  sky:     { bg: "bg-sky-50/80",     border: "border-sky-200",     text: "text-sky-950",     bar: "bg-sky-500",     iconBg: "bg-sky-500 text-white" },
  emerald: { bg: "bg-emerald-50/80", border: "border-emerald-200", text: "text-emerald-950", bar: "bg-emerald-500", iconBg: "bg-emerald-500 text-white" },
  amber:   { bg: "bg-amber-50/80",   border: "border-amber-200",   text: "text-amber-950",   bar: "bg-amber-500",   iconBg: "bg-amber-500 text-white" },
  rose:    { bg: "bg-rose-50/80",    border: "border-rose-200",    text: "text-rose-950",    bar: "bg-rose-500",    iconBg: "bg-rose-500 text-white" },
  violet:  { bg: "bg-violet-50/80",  border: "border-violet-200",  text: "text-violet-950",  bar: "bg-violet-500",  iconBg: "bg-violet-500 text-white" },
  orange:  { bg: "bg-orange-50/80",  border: "border-orange-200",  text: "text-orange-950",  bar: "bg-orange-500",  iconBg: "bg-orange-500 text-white" },
  slate:   { bg: "bg-slate-50/80",   border: "border-slate-200",   text: "text-slate-800",   bar: "bg-slate-400",   iconBg: "bg-slate-400 text-white" },
};

function KpiCard({ icon: Icon, label, value, sub, tone }: {
  icon: typeof CalendarDays; label: string; value: string; sub?: string; tone: keyof typeof TONE;
}) {
  const t = TONE[tone];
  return (
    <div className={cn("rounded-xl border p-4 shadow-2xs transition-all hover:shadow-md", t.bg, t.border)}>
      <div className="flex items-center justify-between">
        <div className={cn("text-xs font-extrabold uppercase tracking-wider opacity-90", t.text)}>
          {label}
        </div>
        <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg shadow-2xs", t.iconBg)}>
          <Icon className="h-4 w-4 stroke-[2.2]" />
        </div>
      </div>
      <div className={cn("mt-2 text-2xl font-black tabular-nums tracking-tight", t.text)}>{value}</div>
      {sub && <div className={cn("mt-1 text-xs font-bold opacity-80", t.text)}>{sub}</div>}
    </div>
  );
}

function Bar({ label, count, total, pct, tone }: { label: string; count: number; total: number; pct: number; tone: keyof typeof TONE }) {
  const t = TONE[tone];
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2 text-xs">
        <span className="truncate font-bold text-slate-800">{label}</span>
        <span className="tabular-nums font-bold text-slate-500">{count} · {pct}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className={cn("h-full rounded-full transition-all", t.bar)} style={{ width: `${Math.min(100, (count / Math.max(total, 1)) * 100)}%` }} />
      </div>
    </div>
  );
}

function Alert({ icon: Icon, label, value, tone }: { icon: typeof ListChecks; label: string; value: number; tone: keyof typeof TONE }) {
  const t = TONE[tone];
  return (
    <div className={cn("flex items-center justify-between rounded-xl border px-3.5 py-2.5 shadow-2xs", t.bg, t.border)}>
      <span className={cn("flex items-center gap-2 text-xs font-bold", t.text)}>
        <Icon className="h-4 w-4" />
        {label}
      </span>
      <span className={cn("tabular-nums text-base font-black", t.text)}>{value}</span>
    </div>
  );
}

function ARBucket({ label, amount, tone, lang }: { label: string; amount: number; tone: keyof typeof TONE; lang: "uz" | "ru" }) {
  const t = TONE[tone];
  return (
    <div className={cn("rounded-xl border p-3.5 shadow-2xs", t.bg, t.border)}>
      <div className={cn("text-[10px] font-black uppercase tracking-wider opacity-80", t.text)}>{label}</div>
      <div className={cn("mt-1 text-base font-black tabular-nums tracking-tight", t.text)}>{formatCurrency(amount, lang)}</div>
    </div>
  );
}
