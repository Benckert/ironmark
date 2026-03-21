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
    text: 'Pick from three heroes — Kael (Might), Lira (Wisdom), or Orin (Heart). Each has a unique passive ability and hero power.',
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
    text: 'Equip up to 4 gear cards. Each has an upside and a downside — choose your tradeoffs carefully!',
  },
]

export default function MainMenu({ onNewRun, onContinue, hasSavedRun }: MainMenuProps) {
  const [showTutorial, setShowTutorial] = useState(false)
  const [tutorialStep, setTutorialStep] = useState(0)

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
            onClick={() => { setShowTutorial(true); setTutorialStep(0) }}
            className="w-64 px-8 py-3 bg-slate-700 text-slate-200 font-semibold rounded-lg hover:bg-slate-600 transition-all text-sm"
          >
            How to Play
          </button>
        </div>
      </div>

      <div className="absolute bottom-4 text-slate-700 text-xs">
        v0.1.0 — MVP
      </div>

      {/* Tutorial overlay */}
      {showTutorial && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-8 max-w-md w-full mx-4 border border-slate-600">
            <div className="text-xs text-slate-500 mb-2">{tutorialStep + 1} / {tutorialSteps.length}</div>
            <h2 className="text-xl font-bold text-amber-400 mb-3">{tutorialSteps[tutorialStep].title}</h2>
            <p className="text-slate-300 mb-6 leading-relaxed">{tutorialSteps[tutorialStep].text}</p>
            <div className="flex justify-between">
              <button
                onClick={() => setShowTutorial(false)}
                className="px-4 py-2 text-slate-400 hover:text-slate-200 text-sm"
              >
                Close
              </button>
              <div className="flex gap-2">
                {tutorialStep > 0 && (
                  <button
                    onClick={() => setTutorialStep((s) => s - 1)}
                    className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 text-sm"
                  >
                    Back
                  </button>
                )}
                {tutorialStep < tutorialSteps.length - 1 ? (
                  <button
                    onClick={() => setTutorialStep((s) => s + 1)}
                    className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-500 text-sm font-semibold"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={() => setShowTutorial(false)}
                    className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-500 text-sm font-semibold"
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
