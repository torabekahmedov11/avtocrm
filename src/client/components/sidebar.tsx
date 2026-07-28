import {
  Calendar,
  Users,
  Settings,
  Stethoscope,
  FileBarChart2,
  FlaskConical,
  Globe,
  MapPin,
  Sparkles,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Route } from "@/hooks/use-router";
import { useApp } from "@/context";
import type { TranslationKey } from "@/lib/i18n";

interface NavItem {
  key: TranslationKey;
  icon: typeof Calendar;
  path?: string;
  match?: (r: Route) => boolean;
  disabled?: boolean;
}

const sections: { headingKey: TranslationKey; items: NavItem[] }[] = [
  {
    headingKey: "navPractice",
    items: [
      { key: "agenda",     icon: Calendar,      path: "/agenda",   match: (r) => r.name === "agenda" },
      { key: "patients",   icon: Users,         path: "/patients", match: (r) => r.name === "patients" || r.name === "patient" },
      { key: "lab",        icon: FlaskConical,  path: "/lab",      match: (r) => r.name === "lab" },
    ],
  },
  {
    headingKey: "navAdmin",
    items: [
      { key: "reports",  icon: FileBarChart2, path: "/reports",  match: (r) => r.name === "reports" },
      { key: "settings", icon: Settings,      path: "/settings", match: (r) => r.name === "settings" },
    ],
  },
];

export function Sidebar({
  route,
  navigate,
}: {
  route: Route;
  navigate: (to: string) => void;
}) {
  const { language, setLanguage, t } = useApp();

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-950 text-slate-100 shadow-xl">
      {/* Clinic Premium Header */}
      <div className="flex flex-col border-b border-slate-800/80 px-4 py-4 bg-slate-900/50">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 via-teal-500 to-emerald-400 text-slate-950 shadow-md ring-2 ring-teal-400/30">
            <Stethoscope className="h-6 w-6 stroke-[2.5]" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-extrabold tracking-tight text-white leading-tight flex items-center gap-1.5">
              {t("appTitle")}
            </span>
            <span className="text-xs font-semibold text-teal-400 flex items-center gap-1 mt-0.5">
              <MapPin className="h-3 w-3 shrink-0 text-cyan-400" />
              {t("urgenchCity")}
            </span>
          </div>
        </div>

        {/* Live Clinic Badge */}
        <div className="mt-3 flex items-center justify-between rounded-lg bg-slate-900/90 border border-slate-800 px-2.5 py-1.5 text-[11px]">
          <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>{language === "ru" ? "Клиника открыта" : "Klinika ochiq"}</span>
          </div>
          <span className="font-mono text-slate-400 text-[10px]">08:00 - 19:00</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {sections.map((section) => (
          <div key={section.headingKey} className="space-y-1">
            <div className="px-3 pb-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-teal-400" />
              {t(section.headingKey)}
            </div>
            <ul className="space-y-1">
              {section.items.map((item) => {
                const active = item.match ? item.match(route) : false;
                const isDisabled = !!item.disabled;
                const label = t(item.key);
                return (
                  <li key={item.key}>
                    <button
                      type="button"
                      disabled={isDisabled}
                      onClick={() => item.path && navigate(item.path)}
                      className={cn(
                        "group relative flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-150",
                        active && "bg-gradient-to-r from-teal-500/20 via-cyan-500/15 to-transparent text-teal-300 font-bold border-l-4 border-teal-400 shadow-xs",
                        !active && !isDisabled && "text-slate-400 hover:bg-slate-900 hover:text-slate-100",
                        isDisabled && "cursor-not-allowed opacity-50",
                      )}
                    >
                      <item.icon className={cn("h-4 w-4 shrink-0 transition-colors", active ? "text-teal-400" : "text-slate-400 group-hover:text-slate-200")} />
                      <span className="flex-1 text-left">{label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Language Switcher Footer */}
      <div className="border-t border-slate-800 p-3.5 bg-slate-900/60">
        <div className="flex items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
            <Globe className="h-4 w-4 text-teal-400" />
            <span>{t("language")}</span>
          </div>
          <div className="flex gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setLanguage("uz")}
              className={cn(
                "px-2.5 py-1 rounded-lg font-bold transition-all",
                language === "uz" ? "bg-teal-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-slate-100"
              )}
            >
              O'ZB
            </button>
            <button
              type="button"
              onClick={() => setLanguage("ru")}
              className={cn(
                "px-2.5 py-1 rounded-lg font-bold transition-all",
                language === "ru" ? "bg-teal-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-slate-100"
              )}
            >
              РУС
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
