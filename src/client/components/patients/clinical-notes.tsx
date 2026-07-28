import { useEffect, useState } from "react";
import { Plus, Trash2, User } from "lucide-react";
import { api } from "@/api";
import { useApp } from "@/context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate } from "@/lib/utils";
import type { ClinicalNote } from "@/types";

export function ClinicalNotes({ patientId }: { patientId: number }) {
  const app = useApp();
  const { t, language } = app;

  const [notes, setNotes] = useState<ClinicalNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [practitionerId, setPractitionerId] = useState<string>("none");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await api<{ notes: ClinicalNote[] }>("GET", `/api/patients/${patientId}/notes`);
        setNotes(data.notes);
      } catch (err) {
        app.setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [patientId, app]);

  async function addNote(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setAdding(true);
    try {
      const res = await api<{ note: ClinicalNote }>("POST", "/api/clinical-notes", {
        patient_id: patientId,
        practitioner_id: practitionerId === "none" ? null : parseInt(practitionerId, 10),
        body: body.trim(),
      });
      setNotes((prev) => [res.note, ...prev]);
      setBody("");
    } catch (err) {
      app.setError((err as Error).message);
    } finally {
      setAdding(false);
    }
  }

  async function remove(id: number) {
    const msg = language === "ru" ? "Удалить эту запись?" : "Ushbu qaydni o'chirasizmi?";
    if (!confirm(msg)) return;
    try {
      await api("DELETE", `/api/clinical-notes/${id}`);
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      app.setError((err as Error).message);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="shadow-2xs">
        <CardHeader>
          <CardTitle className="text-base font-semibold">{t("addClinicalNote")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={addNote} className="space-y-3">
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              placeholder={t("notePlaceholder")}
              className="text-sm"
            />
            <div className="flex flex-wrap items-center gap-2">
              <div className="w-full max-w-xs">
                <Select value={practitionerId} onValueChange={setPractitionerId}>
                  <SelectTrigger className="text-xs font-medium">
                    <SelectValue placeholder={t("selectPractitioner")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— {t("none")} —</SelectItem>
                    {app.practitioners.map((p) => (
                      <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={adding || !body.trim()} className="ml-auto">
                <Plus className="h-4 w-4" />
                {t("add")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {loading ? (
        <p className="py-12 text-center text-sm text-muted-foreground">{t("loading")}</p>
      ) : notes.length === 0 ? (
        <Card className="shadow-2xs">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            {language === "ru" ? "Клинических записей пока нет" : "Klinik qaydlar hali yozilmagan."}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notes.map((n) => (
            <Card key={n.id} className="shadow-2xs">
              <CardContent className="flex gap-3 py-4">
                <div className="shrink-0">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {formatDate(n.note_date, { year: "numeric", month: "short", day: "numeric" })}
                  </div>
                  <div className="mt-1 text-[11px] font-medium text-muted-foreground">
                    {new Date(n.note_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                    <User className="h-3.5 w-3.5 text-primary" />
                    {n.practitioner_name || (language === "ru" ? "Врач не указан" : "Shifokor ko'rsatilmadi")}
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-foreground">{n.body}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => remove(n.id)} aria-label={t("delete")}>
                  <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
