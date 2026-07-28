import { useEffect, useState } from "react";
import { ArrowLeft, Pencil, Trash2, Phone, MapPin, Calendar, ShieldCheck } from "lucide-react";
import { api } from "@/api";
import { useApp } from "@/context";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import type { Patient } from "@/types";
import { PatientOverview } from "./patient-overview";
import { ToothChart } from "./tooth-chart";
import { TreatmentPlan } from "./treatment-plan";
import { ClinicalNotes } from "./clinical-notes";
import { Billing } from "./billing";
import { InsuranceTab } from "./insurance-tab";
import { PatientDialog } from "./patient-dialog";

interface Props {
  id: number;
  navigate: (to: string) => void;
}

export function PatientPage({ id, navigate }: Props) {
  const app = useApp();
  const { t, language } = app;

  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await api<{ patient: Patient }>("GET", `/api/patients/${id}`);
        if (!cancelled) setPatient(data.patient);
      } catch (err) {
        if (!cancelled) app.setError((err as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, app]);

  async function deletePatient() {
    if (!patient) return;
    const msg = language === "ru"
      ? `Удалить пациента ${patient.first_name} ${patient.last_name}? Все его записи будут удалены.`
      : `Bemor ${patient.first_name} ${patient.last_name} o'chirilsinmi? Barcha ma'lumotlar o'chib ketadi.`;
    if (!confirm(msg)) return;
    try {
      await api("DELETE", `/api/patients/${patient.id}`);
      navigate("/patients");
    } catch (err) {
      app.setError((err as Error).message);
    }
  }

  if (loading) {
    return <div className="flex flex-1 items-center justify-center text-slate-500 font-medium">{t("loading")}</div>;
  }

  if (!patient) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
        <p className="text-lg font-bold text-slate-800">{language === "ru" ? "Пациент не найден" : "Bemor topilmadi"}</p>
        <Button variant="outline" onClick={() => navigate("/patients")}>{t("back")}</Button>
      </div>
    );
  }

  const alerts = (patient.medical_alerts ?? "").split(",").map((s) => s.trim()).filter(Boolean);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Patient Header Banner */}
      <div className="border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-5 py-4 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <Button variant="ghost" size="icon" onClick={() => navigate("/patients")} aria-label={t("back")} className="rounded-xl border border-slate-200">
              <ArrowLeft className="h-4 w-4 stroke-[2.5]" />
            </Button>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-teal-500 via-cyan-500 to-emerald-400 text-white font-extrabold text-lg shadow-md ring-2 ring-teal-400/30">
              {patient.last_name?.[0]}{patient.first_name?.[0]}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight text-slate-900 leading-none">
                  {patient.last_name} {patient.first_name}
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-2.5 py-0.5 text-[11px] font-bold text-teal-800 border border-teal-200">
                  <ShieldCheck className="h-3 w-3 text-teal-600" />
                  ID #{patient.id}
                </span>
              </div>

              <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-slate-500">
                {patient.date_of_birth && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-teal-600" />
                    {formatDate(patient.date_of_birth, language)}
                  </span>
                )}
                {patient.phone && (
                  <span className="flex items-center gap-1 text-slate-900 font-bold font-mono">
                    <Phone className="h-3.5 w-3.5 text-teal-600" />
                    {patient.phone}
                  </span>
                )}
                {patient.address && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-teal-600" />
                    {patient.address}
                  </span>
                )}
                {alerts.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {alerts.map((a) => (
                      <Badge key={a} variant="outline" className="border-amber-300 bg-amber-50 text-[10px] text-amber-950 font-bold">
                        {a}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="rounded-xl border-slate-200 font-bold">
              <Pencil className="h-4 w-4" />
              {t("edit")}
            </Button>
            <Button variant="ghost" size="sm" onClick={deletePatient} className="rounded-xl text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-bold">
              <Trash2 className="h-4 w-4" />
              {t("delete")}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-5">
        <Tabs defaultValue="chart">
          <TabsList className="bg-slate-100 p-1.5 rounded-xl border border-slate-200/80">
            <TabsTrigger value="chart" className="rounded-lg font-bold text-xs">{t("tabChart")}</TabsTrigger>
            <TabsTrigger value="plan" className="rounded-lg font-bold text-xs">{t("tabTreatmentPlan")}</TabsTrigger>
            <TabsTrigger value="notes" className="rounded-lg font-bold text-xs">{t("tabNotes")}</TabsTrigger>
            <TabsTrigger value="billing" className="rounded-lg font-bold text-xs">{t("tabBilling")}</TabsTrigger>
            <TabsTrigger value="overview" className="rounded-lg font-bold text-xs">{t("tabOverview")}</TabsTrigger>
            <TabsTrigger value="insurance" className="rounded-lg font-bold text-xs">{t("tabInsurance")}</TabsTrigger>
          </TabsList>
          <TabsContent value="chart" className="mt-5">
            <ToothChart patientId={patient.id} />
          </TabsContent>
          <TabsContent value="plan" className="mt-5">
            <TreatmentPlan patientId={patient.id} />
          </TabsContent>
          <TabsContent value="notes" className="mt-5">
            <ClinicalNotes patientId={patient.id} />
          </TabsContent>
          <TabsContent value="billing" className="mt-5">
            <Billing patientId={patient.id} />
          </TabsContent>
          <TabsContent value="overview" className="mt-5">
            <PatientOverview patient={patient} />
          </TabsContent>
          <TabsContent value="insurance" className="mt-5">
            <InsuranceTab patientId={patient.id} />
          </TabsContent>
        </Tabs>
      </div>

      <PatientDialog
        open={editing}
        onOpenChange={setEditing}
        patient={patient}
        onSaved={(p) => setPatient(p)}
      />
    </div>
  );
}
