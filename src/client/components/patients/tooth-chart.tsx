import { useEffect, useMemo, useState } from "react";
import { Odontogram, type ToothConditionGroup, type ToothDetail } from "react-odontogram";
import "react-odontogram/style.css";
import { Eraser, Lock, Unlock } from "lucide-react";
import { api } from "@/api";
import { useApp } from "@/context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ToothCondition, ToothConditionRow } from "@/types";

type Brush = ToothCondition | "erase";

const BRUSH_ORDER: ToothCondition[] = ["caries", "restoration", "crown", "endo", "implant", "missing"];

export function ToothChart({ patientId }: { patientId: number }) {
  const app = useApp();
  const { t, language } = app;

  const [conditions, setConditions] = useState<ToothConditionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [brush, setBrush] = useState<Brush>("caries");
  const [readOnly, setReadOnly] = useState(false);
  const [tick, setTick] = useState(0);

  const conditionMeta: Record<ToothCondition, { label: string; fill: string; outline: string }> = {
    caries:      { label: t("brushCaries"),       fill: "#fecaca", outline: "#dc2626" },
    restoration: { label: t("brushRestoration"),  fill: "#fde68a", outline: "#d97706" },
    crown:       { label: t("brushCrown"),        fill: "#ddd6fe", outline: "#7c3aed" },
    endo:        { label: t("brushEndo"),         fill: "#fbcfe8", outline: "#db2777" },
    implant:     { label: t("brushImplant"),      fill: "#99f6e4", outline: "#0d9488" },
    missing:     { label: t("brushMissing"),      fill: "#cbd5e1", outline: "#64748b" },
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await api<{ conditions: ToothConditionRow[] }>(
          "GET",
          `/api/patients/${patientId}/tooth-chart`,
        );
        setConditions(data.conditions);
      } catch (err) {
        app.setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [patientId, app]);

  const teethConditions: ToothConditionGroup[] = useMemo(() => {
    return BRUSH_ORDER.map((c) => ({
      label: conditionMeta[c].label,
      fillColor: conditionMeta[c].fill,
      outlineColor: conditionMeta[c].outline,
      teeth: conditions.filter((row) => row.condition === c && !row.surface).map((row) => `teeth-${row.tooth}`),
    })).filter((g) => g.teeth.length > 0);
  }, [conditions, conditionMeta]);

  async function setToothCondition(fdi: string, next: ToothCondition | null) {
    try {
      const existing = conditions.filter((c) => c.tooth === fdi && !c.surface);
      await Promise.all(existing.map((e) => api("DELETE", `/api/tooth-conditions/${e.id}`)));
      let nextLocal = conditions.filter((c) => !(c.tooth === fdi && !c.surface));

      if (next) {
        const res = await api<{ condition: ToothConditionRow }>("POST", "/api/tooth-conditions", {
          patient_id: patientId,
          tooth: fdi,
          condition: next,
        });
        nextLocal = [...nextLocal, res.condition];
      }
      setConditions(nextLocal);
    } catch (err) {
      app.setError((err as Error).message);
    }
  }

  function handleChange(selected: ToothDetail[]) {
    if (!selected.length) return;
    const fdi = selected[0].notations.fdi;
    const existing = conditions.find((c) => c.tooth === fdi && !c.surface);

    if (brush === "erase" || (existing && existing.condition === brush)) {
      setToothCondition(fdi, null);
    } else {
      setToothCondition(fdi, brush);
    }

    setTick((tVal) => tVal + 1);
  }

  const counts = useMemo(() => {
    const out: Record<ToothCondition, number> = {
      caries: 0, restoration: 0, crown: 0, endo: 0, implant: 0, missing: 0,
    };
    for (const c of conditions) {
      if (!c.surface) out[c.condition]++;
    }
    return out;
  }, [conditions]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-3 text-base font-semibold">
            <span>{t("toothChartTitle")}</span>
            <span className="ml-auto text-xs font-normal text-muted-foreground">{t("toothChartSubtitle")}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {language === "ru" ? "Инструмент:" : "Asbob:"}
            </span>
            {BRUSH_ORDER.map((c) => (
              <BrushButton
                key={c}
                active={brush === c}
                disabled={readOnly}
                onClick={() => setBrush(c)}
                label={conditionMeta[c].label}
                count={counts[c]}
                fill={conditionMeta[c].fill}
                outline={conditionMeta[c].outline}
              />
            ))}
            <button
              type="button"
              disabled={readOnly}
              onClick={() => setBrush("erase")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
                brush === "erase"
                  ? "border-foreground/20 bg-foreground/10 text-foreground font-semibold"
                  : "border-border bg-background text-muted-foreground hover:bg-accent",
                readOnly && "cursor-not-allowed opacity-50",
              )}
            >
              <Eraser className="h-3.5 w-3.5" />
              {t("clearTooth")}
            </button>
            <button
              type="button"
              onClick={() => setReadOnly((v) => !v)}
              className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-accent"
            >
              {readOnly ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
              {readOnly ? (language === "ru" ? "Только чтение" : "Faqat ko'rish") : (language === "ru" ? "Редактирование" : "Tahrirlash")}
            </button>
          </div>

          {loading ? (
            <p className="py-12 text-center text-sm text-muted-foreground">{t("loading")}</p>
          ) : (
            <div className="odontogram-host mx-auto w-full max-w-md rounded-md bg-muted/30 p-2 border">
              <Odontogram
                key={`chart-${tick}-${readOnly ? "ro" : "rw"}`}
                singleSelect
                readOnly={readOnly}
                notation="FDI"
                showTooltip
                teethConditions={teethConditions}
                onChange={handleChange}
                styles={{ width: "100%", height: "auto" }}
              />
            </div>
          )}

          {!readOnly && (
            <p className="text-xs text-muted-foreground">
              {language === "ru"
                ? "Выберите инструмент выше и нажмите на любой зуб для нанесения диагноза/лечения."
                : "Tepadagi asboblardan birini tanlang va tishga bosing. Bekor qilish uchun qayta bosing yoki tozalash asbobidan foydalaning."}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function BrushButton({
  active, disabled, onClick, label, count, fill, outline,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  label: string;
  count: number;
  fill: string;
  outline: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors shadow-2xs",
        active ? "ring-2 ring-offset-1 font-semibold" : "hover:bg-accent",
        disabled && "cursor-not-allowed opacity-50",
      )}
      style={{
        borderColor: active ? outline : "var(--border)",
        background: active ? fill : "var(--background)",
        color: active ? outline : "var(--foreground)",
      }}
    >
      <span
        className="inline-block h-3 w-3 rounded-sm border"
        style={{ background: fill, borderColor: outline }}
      />
      {label}
      {count > 0 && (
        <span
          className="rounded-full px-1.5 py-0.5 text-[10px] font-bold"
          style={{ background: outline, color: "white" }}
        >
          {count}
        </span>
      )}
    </button>
  );
}
