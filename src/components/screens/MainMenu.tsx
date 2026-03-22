import { useState } from 'react'

interface MainMenuProps {
  onNewRun: () => void
  onContinue?: () => void
  hasSavedRun: boolean
}

const tutorialSteps = [
  {
    title: 'Welcome to IRONMARK',
    text: 'A roguelite fantasy deckbuilder. Build your deck, equip gear, and defeat the boss to win!',
  },
  {
    title: 'Choose Your Hero',
    text: 'Pick from three heroes \u2014 Kael (Might), Lira (Wisdom), or Orin (Heart). Each has a unique passive ability and hero power.',
  },
  {
    title: 'Navigate the Map',
    text: 'Travel through nodes: Combat, Elite encounters, Shops, Rest sites, and Events. Plan your path wisely!',
  },
  {
    title: 'Combat',
    text: 'Play ally and spell cards using mana (which grows each turn). Allies auto-attack at end of turn. Use your hero power once per turn.',
  },
  {
    title: 'Build Your Deck',
    text: 'Win card rewards after combat. Visit shops to buy cards and gear. Rest sites let you heal, upgrade, or remove cards.',
  },
  {
    title: 'Gear Up',
    text: 'Equip up to 4 gear cards. Each has an upside and a downside \u2014 choose your tradeoffs carefully!',
  },
]

export default function MainMenu({ onNewRun, onContinue, hasSavedRun }: MainMenuProps) {
  const [showTutorial, setShowTutorial] = useState(false)
  const [tutorialStep, setTutorialStep] = useState(0)

  return (
    <div className="min-h-screen im-bg-ambient flex flex-col items-center justify-center px-4 relative" role="main" aria-label="Main menu">
      {/* Vignette */}
      <div className="absolute inset-0 im-vignette" />

      {/* Floating ember particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-amber-400/40"
            style={{
              left: `${15 + i * 14}%`,
              bottom: '10%',
              animation: `im-float ${3 + i * 0.7}s ease-in-out ${i * 0.5}s infinite`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 text-center w-full max-w-md">
        <h1
          className="text-5xl sm:text-7xl font-black text-amber-400 mb-2 tracking-widest im-title-glow"
          style={{ fontVariant: 'small-caps' }}
        >
          IRONMARK
        </h1>
        <p className="text-slate-500 text-sm sm:text-base mb-10 tracking-wide">A roguelite deckbuilder</p>

        <div className="flex flex-col gap-3 items-center">
          {hasSavedRun && onContinue && (
            <button
              onClick={onContinue}
              className="w-full max-w-64 px-8 py-4 min-h-11 rounded-lg transition-all hover:scale-105 text-lg font-bold focus-visible:outline-2 focus-visible:outline-amber-400 focus-visible:outline-offset-2 bg-gradient-to-b from-green-500 to-green-700 text-white border border-green-400/30 hover:from-green-400 hover:to-green-600 im-glow-green"
            >
              Continue Run
            </button>
          )}
          <button
            onClick={onNewRun}
            className="w-full max-w-64 px-8 py-4 min-h-11 rounded-lg transition-all hover:scale-105 text-lg im-btn-primary focus-visible:outline-2 focus-visible:outline-amber-400 focus-visible:outline-offset-2"
          >
            New Run
          </button>
          <button
            onClick={() => { setShowTutorial(true); setTutorialStep(0) }}
            className="w-full max-w-64 px-8 py-3 min-h-11 bg-slate-800/60 text-slate-400 font-semibold rounded-lg hover:bg-slate-700/60 hover:text-slate-200 transition-all text-sm border border-slate-700/30 focus-visible:outline-2 focus-visible:outline-amber-400 focus-visible:outline-offset-2"
          >
            How to Play
          </button>
        </div>
      </div>

      <div className="absolute bottom-4 text-slate-700/50 text-xs">
        v0.1.0 \u2014 MVP
      </div>

      {/* Tutorial overlay */}
      {showTutorial && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50" role="dialog" aria-label="How to play tutorial" aria-modal="true">
          <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-xl p-8 w-[420px] max-w-[calc(100vw-2rem)] mx-4 border border-amber-900/20 im-card-frame">
            <div className="text-xs text-amber-600/60 mb-2 font-medium">{tutorialStep + 1} / {tutorialSteps.length}</div>
            <h2 className="text-xl font-bold text-amber-300 mb-3">{tutorialSteps[tutorialStep].title}</h2>
            <p className="text-slate-300 mb-6 leading-relaxed min-h-[4.5rem]">{tutorialSteps[tutorialStep].text}</p>
            <div className="flex justify-between">
              <button
                onClick={() => setShowTutorial(false)}
                className="px-4 py-2 min-h-11 text-slate-500 hover:text-slate-300 text-sm transition-colors"
              >
                Close
              </button>
              <div className="flex gap-2">
                {tutorialStep > 0 && (
                  <button
                    onClick={() => setTutorialStep((s) => s - 1)}
                    className="px-4 py-2 min-h-11 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-600/50 text-sm border border-slate-600/30"
                  >
                    Back
                  </button>
                )}
                {tutorialStep < tutorialSteps.length - 1 ? (
                  <button
                    onClick={() => setTutorialStep((s) => s + 1)}
                    className="px-4 py-2 min-h-11 im-btn-primary rounded-lg text-sm"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={() => setShowTutorial(false)}
                    className="px-4 py-2 min-h-11 im-btn-primary rounded-lg text-sm"
                  >
                    Got it!
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
