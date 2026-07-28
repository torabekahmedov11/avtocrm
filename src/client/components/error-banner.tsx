import { useApp } from "../context";
import { X, AlertCircle } from "lucide-react";

export function ErrorBanner() {
  const { error, setError, language } = useApp();
  if (!error) return null;
  return (
    <div className="fixed bottom-4 left-1/2 z-50 flex w-[min(90vw,520px)] -translate-x-1/2 items-start gap-3 rounded-xl border border-rose-300/50 bg-rose-600 px-4 py-3 text-sm font-semibold text-white shadow-xl backdrop-blur-sm">
      <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-rose-100" />
      <span className="flex-1">{error}</span>
      <button
        type="button"
        onClick={() => setError(null)}
        className="opacity-80 hover:opacity-100 rounded-lg p-1 hover:bg-rose-500 transition-colors"
        aria-label={language === "ru" ? "Закрыть" : "Yopish"}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
