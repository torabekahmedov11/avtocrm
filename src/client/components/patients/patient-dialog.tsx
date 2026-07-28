import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/api";
import { useApp } from "@/context";
import type { Patient } from "@/types";
import { KHOREZM_LOCATIONS } from "@/lib/i18n";

const REFERRAL_SOURCES_UZ = ["Tavsiya (Tanish/Qarindosh)", "Instagram / Telegram", "Tashqi reklama (Bannert)", "Piyoda kirib keldi (Walk-in)", "Boshqa"];
const REFERRAL_SOURCES_RU = ["Рекомендация (Друзья/Родственники)", "Instagram / Telegram", "Наружная реклама", "Проходил мимо", "Другое"];

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  /** When provided, the dialog edits this patient. Otherwise it creates a new one. */
  patient: Patient | null;
  onSaved?: (patient: Patient) => void;
}

export function PatientDialog({ open, onOpenChange, patient, onSaved }: Props) {
  const app = useApp();
  const { t, language } = app;

  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [dob, setDob] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [alerts, setAlerts] = useState("");
  const [referralSource, setReferralSource] = useState<string>("none");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFirst(patient?.first_name ?? "");
    setLast(patient?.last_name ?? "");
    setDob(patient?.date_of_birth ?? "");
    setEmail(patient?.email ?? "");
    setPhone(patient?.phone ?? "");
    setAddress(patient?.address ?? "");
    setAlerts(patient?.medical_alerts ?? "");
    setReferralSource(patient?.referral_source ?? "none");
    setNotes(patient?.notes ?? "");
  }, [open, patient]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!first.trim() || !last.trim()) {
      app.setError(language === "ru" ? "Имя и фамилия обязательны" : "Ism va familiyasi kiritilishi shart");
      return;
    }
    setSaving(true);
    try {
      const body = {
        first_name: first.trim(),
        last_name: last.trim(),
        date_of_birth: dob.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        address: address.trim() || null,
        medical_alerts: alerts.trim() || null,
        referral_source: referralSource === "none" ? null : referralSource,
        notes: notes.trim() || null,
      };
      const res = patient
        ? await api<{ patient: Patient }>("PUT", `/api/patients/${patient.id}`, body)
        : await api<{ patient: Patient }>("POST", "/api/patients", body);
      onSaved?.(res.patient);
      onOpenChange(false);
    } catch (err) {
      app.setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const referralList = language === "ru" ? REFERRAL_SOURCES_RU : REFERRAL_SOURCES_UZ;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            {patient ? (language === "ru" ? "Редактировать карту пациента" : "Bemor kartochkasini tahrirlash") : t("newPatient")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label={`${t("firstName")} *`}>
              <Input value={first} onChange={(e) => setFirst(e.target.value)} placeholder="Otabek" required />
            </Field>
            <Field label={`${t("lastName")} *`}>
              <Input value={last} onChange={(e) => setLast(e.target.value)} placeholder="Ergashev" required />
            </Field>
            <Field label={language === "ru" ? "Дата рождения" : "Tug'ilgan sana"}>
              <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
            </Field>
            <Field label={t("phone")}>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+998 (91) 234-56-78" />
            </Field>
            <Field label={t("email")}>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="bemor@mail.uz" />
            </Field>
            <Field label={t("address")}>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Urganch sh., Al-Xorazmiy k. 24" />
            </Field>
          </div>
          <Field label={t("medicalAlerts")}>
            <Input
              value={alerts}
              onChange={(e) => setAlerts(e.target.value)}
              placeholder={language === "ru" ? "напр.: аллергия на пенициллин, диабет, гипертония" : "masalan: penitsilinga allergiya, diabet, gipertoniya"}
            />
          </Field>
          <Field label={t("referralSource")}>
            <Select value={referralSource} onValueChange={setReferralSource}>
              <SelectTrigger><SelectValue placeholder={t("select")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— {t("none")} —</SelectItem>
                {referralList.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label={t("notes")}>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder={t("notePlaceholder")} />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? t("loading") : patient ? t("save") : t("add")}
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
