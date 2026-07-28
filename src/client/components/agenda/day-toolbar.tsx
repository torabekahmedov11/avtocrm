import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, Users, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate, toIsoDate } from "@/lib/utils";
import { useApp } from "@/context";

interface Props {
  date: string;
  onChange: (date: string) => void;
  onCreate: () => void;
}

export function DayToolbar({ date, onChange, onCreate }: Props) {
  const { t, language, appointments, operatories } = useApp();
  const today = toIsoDate(new Date());
  const isToday = date === today;

  const shift = (days: number) => {
    const d = new Date(`${date}T00:00:00`);
    d.setDate(d.getDate() + days);
    onChange(toIsoDate(d));
  };

  const dayAppointmentsCount = appointments.length;

  return (
    <div className="flex flex-wrap items-center gap-4 border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-5 py-3.5 shadow-2xs">
      {/* Date Title & Badge */}
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 border border-teal-200 text-teal-700 shadow-2xs">
          <CalendarIcon className="h-6 w-6 stroke-[2.2]" />
        </div>
        <div>
          <h2 className="text-lg font-extrabold tracking-tight text-slate-900 leading-snug capitalize">
            {formatDate(date, language, { month: "long", year: "numeric" })}
          </h2>
          <p className="text-xs font-semibold text-slate-500 capitalize flex items-center gap-1.5">
            <span>{formatDate(date, language, { weekday: "long", day: "numeric" })}</span>
            <span className="inline-block h-1 w-1 rounded-full bg-slate-300"></span>
            <span className="text-teal-700 font-bold">{dayAppointmentsCount} {language === "ru" ? "записей" : "ta qabul"}</span>
          </p>
        </div>
      </div>

      {/* Stats Summary Chips */}
      <div className="hidden sm:flex items-center gap-2.5 ml-4">
        <div className="flex items-center gap-2 rounded-lg bg-slate-100/90 border border-slate-200/80 px-3 py-1.5 text-xs font-semibold text-slate-700">
          <Activity className="h-3.5 w-3.5 text-teal-600" />
          <span>{operatories.length} {language === "ru" ? "Кабинетов" : "ta Kabinet"}</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-teal-50 border border-teal-200/80 px-3 py-1.5 text-xs font-bold text-teal-900">
          <Clock className="h-3.5 w-3.5 text-teal-600" />
          <span>{language === "ru" ? "Пн–Сб (08:00 – 19:00)" : "Du–Sha (08:00 – 19:00)"}</span>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="ml-auto flex flex-wrap items-center gap-3">
        {/* Prev | Today | Next pill */}
        <div className="inline-flex items-center gap-0.5 rounded-xl border border-slate-200 bg-slate-100 p-1 shadow-2xs">
          <button
            type="button"
            onClick={() => shift(-1)}
            aria-label={t("prevDay")}
            title={t("prevDay")}
            className="rounded-lg p-1.5 text-slate-600 transition-colors hover:bg-white hover:text-slate-900 shadow-2xs"
          >
            <ChevronLeft className="h-4 w-4 stroke-[2.5]" />
          </button>
          <button
            type="button"
            onClick={() => onChange(today)}
            className={
              "rounded-lg px-3 py-1 text-xs font-bold transition-all " +
              (isToday ? "bg-teal-600 text-white shadow-sm" : "hover:bg-white text-slate-700")
            }
          >
            {t("today")}
          </button>
          <button
            type="button"
            onClick={() => shift(1)}
            aria-label={t("nextDay")}
            title={t("nextDay")}
            className="rounded-lg p-1.5 text-slate-600 transition-colors hover:bg-white hover:text-slate-900 shadow-2xs"
          >
            <ChevronRight className="h-4 w-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Date picker */}
        <input
          type="date"
          value={date}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-teal-500 transition-all"
        />

        <div className="h-6 w-px bg-slate-200 hidden sm:block" />

        <Button onClick={onCreate} size="sm" className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-bold shadow-md hover:from-teal-700 hover:to-cyan-700 transition-all rounded-xl px-4">
          <Plus className="h-4 w-4 stroke-[3]" />
          {t("newAppointment")}
        </Button>
      </div>
    </div>
  );
}
