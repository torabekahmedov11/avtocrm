import { Mail, Phone, MapPin, Calendar, AlertTriangle, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import type { Patient } from "@/types";
import { useApp } from "@/context";

export function PatientOverview({ patient }: { patient: Patient }) {
  const { t, language } = useApp();

  const alerts = (patient.medical_alerts ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const age = patient.date_of_birth ? computeAge(patient.date_of_birth) : null;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2 shadow-2xs">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <span>{t("tabOverview")}</span>
            <span className="text-xs font-normal text-muted-foreground">
              ({language === "ru" ? "Основная контактная информация" : "Asosiy bog'lanish va shaxsiy ma'lumotlar"})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Detail icon={Calendar} label={language === "ru" ? "Дата рождения" : "Tug'ilgan sana"}>
            {patient.date_of_birth ? (
              <>
                {formatDate(patient.date_of_birth, language)} {age !== null && <span className="font-semibold text-muted-foreground">· {age} {t("ageYears")}</span>}
              </>
            ) : "—"}
          </Detail>
          <Detail icon={Phone} label={t("phone")}>
            {patient.phone ? <a href={`tel:${patient.phone}`} className="font-semibold text-primary hover:underline">{patient.phone}</a> : "—"}
          </Detail>
          <Detail icon={Mail} label={t("email")}>
            {patient.email ? <a href={`mailto:${patient.email}`} className="text-primary hover:underline">{patient.email}</a> : "—"}
          </Detail>
          <Detail icon={MapPin} label={t("address")}>
            {patient.address || "—"}
          </Detail>
          {patient.referral_source && (
            <Detail icon={Info} label={t("referralSource")}>
              <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground">
                {patient.referral_source}
              </span>
            </Detail>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-2xs">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-amber-900">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            {t("medicalAlerts")}
          </CardTitle>
          <p className="text-[11px] text-muted-foreground">
            {language === "ru" ? "Аллергии, хронические болезни и риски при анестезии" : "Allergiya, anesteziya xavflari hamda surunkali kasalliklar"}
          </p>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              {language === "ru" ? "Особых предупреждений нет." : "Tibbiy ogohlantirishlar yo'q."}
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {alerts.map((a) => (
                <Badge key={a} variant="outline" className="border-amber-300 bg-amber-50 text-amber-950 font-semibold">
                  {a}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-3 shadow-2xs">
        <CardHeader>
          <CardTitle className="text-base font-semibold">{t("notes")}</CardTitle>
          <p className="text-[11px] text-muted-foreground">
            {language === "ru" ? "Общие примечания администратора и врача" : "Bemor bo'yicha umumiy shifokor va qabulxona izohlari"}
          </p>
        </CardHeader>
        <CardContent>
          {patient.notes ? (
            <p className="whitespace-pre-wrap text-sm text-foreground">{patient.notes}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              {language === "ru" ? "Общих примечаний нет." : "Izohlar yozilmagan."}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Detail({ icon: Icon, label, children }: { icon: typeof Mail; label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5 text-primary" />
        {label}
      </div>
      <div className="mt-1 text-sm font-medium">{children}</div>
    </div>
  );
}

function computeAge(iso: string): number | null {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}
