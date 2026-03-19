interface MainMenuProps {
  onNewRun: () => void
  onContinue?: () => void
  hasSavedRun: boolean
}

export default function MainMenu({ onNewRun, onContinue, hasSavedRun }: MainMenuProps) {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-amber-400 mb-2 tracking-wider">IRONMARK</h1>
        <p className="text-slate-500 text-lg mb-12">A roguelite deckbuilder</p>

        <div className="flex flex-col gap-4 items-center">
          {hasSavedRun && onContinue && (
            <button
              onClick={onContinue}
              className="w-64 px-8 py-4 bg-green-600 text-white font-bold rounded-lg hover:bg-green-500 transition-all hover:scale-105 text-lg"
            >
              Continue Run
            </button>
          )}
          <button
            onClick={onNewRun}
            className="w-64 px-8 py-4 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-500 transition-all hover:scale-105 text-lg"
          >
            New Run
          </button>
          <button
            disabled
            className="w-64 px-8 py-3 bg-slate-800 text-slate-600 font-semibold rounded-lg cursor-not-allowed text-sm"
          >
            Collection (Coming Soon)
          </button>
          <button
            disabled
            className="w-64 px-8 py-3 bg-slate-800 text-slate-600 font-semibold rounded-lg cursor-not-allowed text-sm"
          >
            Settings (Coming Soon)
          </button>
        </div>
      </div>

      <div className="absolute bottom-4 text-slate-700 text-xs">
        v0.1.0 — MVP
      </div>
    </div>
  )
}
