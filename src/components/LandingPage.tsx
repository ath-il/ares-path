import { useMission } from '../context/MissionContext';

const STARS: { left: string; top: string; size: string; delay: string }[] = [
  { left: '8%', top: '12%', size: '1.5px', delay: '0s' },
  { left: '16%', top: '64%', size: '1px', delay: '0.8s' },
  { left: '24%', top: '28%', size: '2px', delay: '1.6s' },
  { left: '33%', top: '78%', size: '1px', delay: '0.4s' },
  { left: '42%', top: '18%', size: '1.5px', delay: '2.1s' },
  { left: '52%', top: '55%', size: '1px', delay: '1.2s' },
  { left: '61%', top: '8%', size: '2px', delay: '0.2s' },
  { left: '70%', top: '38%', size: '1.5px', delay: '1.9s' },
  { left: '78%', top: '70%', size: '1px', delay: '2.6s' },
  { left: '86%', top: '22%', size: '2px', delay: '0.9s' },
  { left: '93%', top: '48%', size: '1.5px', delay: '1.4s' },
  { left: '45%', top: '42%', size: '1px', delay: '2.9s' },
  { left: '30%', top: '45%', size: '1px', delay: '3.3s' },
  { left: '66%', top: '30%', size: '1.5px', delay: '0.6s' },
];

export default function LandingPage() {
  const { setView, setSection, setMissionPhase } = useMission();

  const initiate = () => {
    setSection('explore');
    setView('mission');
    setMissionPhase('boot');
    window.setTimeout(() => {
      setMissionPhase('ready');
    }, 2600);
  };

  const exploreTech = () => {
    setSection('explore');
    setView('mission');
    setMissionPhase('ready');
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-ap-bg text-ap-text" data-testid="landing-page">
      <div className="absolute inset-0 bg-[radial-gradient(1200px_700px_at_70%_20%,rgba(10,25,45,0.9),transparent_60%),radial-gradient(900px_600px_at_20%_90%,rgba(20,10,8,0.8),transparent_60%),#070b12]" />

      <div className="absolute inset-0">
        {STARS.map((s, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-white opacity-70"
            style={{
              left: s.left,
              top: s.top,
              width: s.size,
              height: s.size,
              animation: `ap-fade-in 2s ease both, ap-spin-slow 40s linear infinite`,
              animationDelay: s.delay,
              opacity: 0.5,
            }}
          />
        ))}
      </div>

      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="relative h-[min(88vh,640px)] w-[min(88vw,560px)]">
          <div className="absolute inset-0 rounded-full border border-ap-border/60 shadow-[0_0_120px_rgba(232,117,66,0.12)_inset] sm:shadow-[0_0_120px_rgba(232,117,66,0.18)]" />
          <div className="absolute left-1/2 top-1/2 h-[78%] w-[78%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_35%_30%,#d97b4a_0%,#a34d28_38%,#5f2c16_70%,#2c1509_100%)] shadow-[0_0_90px_rgba(232,117,66,0.35)]" />
          <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_25%,rgba(255,190,140,0.35),transparent_55%)]" />
          <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_70%_75%,rgba(40,10,5,0.9),transparent_60%)]" />
          <svg className="absolute inset-0 h-full w-full overflow-visible">
            <path
              d="M -20 30 C 60 -40, 120 -60, 180 -10 S 300 40, 340 10"
              fill="none"
              stroke="#e87542"
              strokeWidth="2"
              strokeDasharray="2 16"
              strokeLinecap="round"
              className="ap-animate-dash"
            />
          </svg>
        </div>
      </div>

      <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col items-center justify-center px-6 text-center">
        <div className="ap-animate-fade-in">
          <div className="font-mono text-[10px] tracking-[0.5em] text-ap-ice">NASA SPACE APPS CHALLENGE 2026</div>
          <h1 className="ap-font-display mt-6 text-5xl font-bold leading-[0.95] tracking-tight text-white sm:text-7xl md:text-8xl">
            THE NEXT FRONTIER
            <br />
            IS A STEP AWAY.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base text-ap-text-dim sm:text-lg">
            Explore the Martian surface. Decode planetary science. Plan humanity&apos;s next expedition.
          </p>
        </div>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <button
            type="button"
            onClick={initiate}
            className="group relative overflow-hidden rounded border border-ap-orange/70 bg-ap-orange px-10 py-4 ap-font-display text-sm tracking-[0.28em] text-ap-bg transition-transform hover:scale-[1.03] ap-glow-orange"
            data-testid="cta-initiate"
          >
            INITIATE MISSION
          </button>
          <button
            type="button"
            onClick={exploreTech}
            className="rounded border border-ap-border-strong bg-ap-panel/60 px-10 py-4 font-mono text-xs tracking-[0.28em] text-ap-text transition-colors hover:border-ap-ice/60 hover:text-ap-ice"
            data-testid="cta-explore"
          >
            EXPLORE THE TECHNOLOGY
          </button>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-20 border-t border-ap-border bg-ap-bg/80 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-8 gap-y-2 font-mono text-[9px] tracking-[0.28em] text-ap-text-dim">
          <span>MISSION: MARS SURFACE EXPLORATION</span>
          <span>SYSTEM: ONLINE</span>
          <span>PLANET: MARS</span>
          <span>MODE: SIMULATION / RESEARCH</span>
        </div>
      </div>

      <div className="absolute left-0 right-0 top-0 z-20 flex justify-between px-6 pt-5 font-mono text-[9px] tracking-[0.3em] text-ap-text-faint">
        <span>ARES PATH</span>
        <span className="text-ap-orange">GAGANTRIX</span>
        <span>EVERY STEP MATTERS.</span>
      </div>
    </div>
  );
}
