import { useAppState } from "./hooks/use-app-state";
import { useRouter } from "./hooks/use-router";
import { AppContext, useApp } from "./context";
import { Sidebar } from "./components/sidebar";
import { ErrorBanner } from "./components/error-banner";
import { AgendaPage } from "./components/agenda/agenda-page";
import { PatientsList } from "./components/patients/patients-list";
import { PatientPage } from "./components/patients/patient-page";
import { ReportsPage } from "./components/reports/reports-page";
import { LabPage } from "./components/lab/lab-page";
import { SettingsPage } from "./components/settings/settings-page";

export function App() {
  const state = useAppState();
  const { route, navigate } = useRouter();

  return (
    <AppContext.Provider value={state}>
      <div className="flex h-screen min-h-0 overflow-hidden">
        <Sidebar route={route} navigate={navigate} />
        <main className="flex flex-1 flex-col overflow-hidden bg-slate-50/50">
          {state.loading ? (
            <LoadingScreen language={state.language} />
          ) : (
            <>
              {route.name === "agenda" && <AgendaPage />}
              {route.name === "patients" && <PatientsList navigate={navigate} />}
              {route.name === "patient" && <PatientPage id={route.id} navigate={navigate} />}
              {route.name === "reports" && <ReportsPage />}
              {route.name === "lab" && <LabPage navigate={navigate} />}
              {route.name === "settings" && <SettingsPage />}
              {route.name === "not-found" && (
                <NotFoundScreen language={state.language} navigate={navigate} />
              )}
            </>
          )}
        </main>
        <ErrorBanner />
      </div>
    </AppContext.Provider>
  );
}

function LoadingScreen({ language }: { language: "uz" | "ru" }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-teal-500 via-cyan-500 to-emerald-400 shadow-lg animate-pulse">
        <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
          <circle cx="12" cy="12" r="10" />
        </svg>
      </div>
      <div>
        <p className="text-lg font-extrabold text-slate-900 tracking-tight">
          {language === "ru" ? "Загрузка..." : "Yuklanmoqda..."}
        </p>
        <p className="text-xs font-semibold text-slate-500 mt-1">
          {language === "ru" ? "Подготовка данных клиники" : "Klinika ma'lumotlari tayyorlanmoqda"}
        </p>
      </div>
    </div>
  );
}

function NotFoundScreen({ language, navigate }: { language: "uz" | "ru"; navigate: (to: string) => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-12 text-center">
      <div className="text-6xl font-black text-slate-300">404</div>
      <h1 className="text-xl font-extrabold tracking-tight text-slate-800">
        {language === "ru" ? "Страница не найдена" : "Sahifa topilmadi"}
      </h1>
      <p className="text-sm font-medium text-slate-500">
        {language === "ru" ? "Эта страница не существует или была перемещена." : "Bu sahifa mavjud emas yoki boshqa joyga ko'chirilgan."}
      </p>
      <button
        type="button"
        onClick={() => navigate("/agenda")}
        className="mt-2 rounded-xl bg-teal-600 px-6 py-2.5 text-sm font-bold text-white shadow-md hover:bg-teal-700 transition-all"
      >
        {language === "ru" ? "На главную" : "Bosh sahifaga qaytish"}
      </button>
    </div>
  );
}
