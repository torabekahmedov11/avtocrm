import { useEffect, useMemo, useState } from "react";
import { Plus, Search, UserCheck, User } from "lucide-react";
import { useApp } from "@/context";
import { api } from "@/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import type { Patient } from "@/types";
import { PatientDialog } from "./patient-dialog";

export function PatientsList({ navigate }: { navigate: (to: string) => void }) {
  const app = useApp();
  const { t, language } = app;

  const [patients, setPatients] = useState<Patient[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Debounced search
  useEffect(() => {
    let cancelled = false;
    const tTimer = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await api<{ patients: Patient[] }>(
          "GET",
          q.trim() ? `/api/patients?q=${encodeURIComponent(q.trim())}` : "/api/patients",
        );
        if (!cancelled) setPatients(res.patients);
      } catch (err) {
        if (!cancelled) app.setError((err as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(tTimer);
    };
  }, [q, app]);

  const visible = useMemo(() => patients, [patients]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-5 py-3.5 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 border border-teal-200 text-teal-700 shadow-2xs">
            <UserCheck className="h-5 w-5 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-slate-900 leading-snug">{t("patientListTitle")}</h1>
            <p className="text-xs font-semibold text-slate-500">
              {language === "ru" ? "Управление записями и амбулаторными картами" : "Bemorlar ro'yxati va ambulatoriya kartalarini boshqarish"}
            </p>
          </div>
          <span className="ml-2 rounded-full bg-teal-100 px-3 py-1 text-xs font-extrabold text-teal-800 border border-teal-200">
            {visible.length} {language === "ru" ? "пациентов" : "nafar bemor"}
          </span>
        </div>
        <div className="relative ml-auto w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("searchPatientsPlaceholder")}
            className="pl-9 text-xs font-medium rounded-xl border-slate-200 bg-slate-50 focus:bg-white"
          />
        </div>
        <Button onClick={() => setDialogOpen(true)} size="sm" className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-bold shadow-md hover:from-teal-700 hover:to-cyan-700 rounded-xl px-4">
          <Plus className="h-4 w-4 stroke-[3]" />
          {t("newPatient")}
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-5">
        <Card className="overflow-hidden shadow-xs rounded-xl border-slate-200">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-100/80 border-b border-slate-200">
                <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-700">{t("patientName")}</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-700">{t("date")}</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-700">{t("phone")}</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-700">{t("address")}</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-700">{t("medicalAlerts")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && visible.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-sm font-medium text-slate-500">
                    {t("loading")}
                  </TableCell>
                </TableRow>
              ) : visible.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-sm font-medium text-slate-500">
                    {q ? t("noPatientsFound") : (language === "ru" ? "Пациентов пока нет. Нажмите «Новый пациент»." : "Hali bemorlar yo'q. Yangi bemor qo'shishingiz mumkin.")}
                  </TableCell>
                </TableRow>
              ) : (
                visible.map((p) => (
                  <TableRow
                    key={p.id}
                    onClick={() => navigate(`/patients/${p.id}`)}
                    className="cursor-pointer hover:bg-teal-50/40 transition-colors border-b border-slate-100"
                  >
                    <TableCell className="font-bold text-slate-900">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100 text-teal-800 text-xs font-bold border border-teal-200">
                          {p.last_name?.[0]}{p.first_name?.[0]}
                        </div>
                        <span>{p.last_name} {p.first_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600 font-medium">
                      {p.date_of_birth ? formatDate(p.date_of_birth, language) : "—"}
                    </TableCell>
                    <TableCell className="text-slate-800 font-bold font-mono text-xs">{p.phone ?? "—"}</TableCell>
                    <TableCell className="text-slate-600 text-xs font-medium">{p.address ?? "—"}</TableCell>
                    <TableCell>
                      {p.medical_alerts ? (
                        <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-900 border border-amber-300">
                          {p.medical_alerts}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      <PatientDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        patient={null}
        onSaved={(p) => {
          setPatients((prev) => [p, ...prev]);
          navigate(`/patients/${p.id}`);
        }}
      />
    </div>
  );
}
