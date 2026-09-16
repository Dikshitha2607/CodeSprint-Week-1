import React, { useState, useEffect, useRef } from 'react';
import {
  Gamepad2,
  Wifi,
  Smartphone,
  Zap,
  QrCode,
  Tv,
  ChevronDown,
  ShieldCheck,
  Play,
  Radio,
  ExternalLink,
  Cpu,
  Layers,
  Sparkles,
  CheckCircle2,
  X,
  Volume2,
  RotateCcw
} from 'lucide-react';

export default function App() {
  // Modal states
  const [activeModal, setActiveModal] = useState(null); // 'host' | 'join' | null
  const [controllerRole, setControllerRole] = useState('p1'); // 'p1' | 'p2'
  const [roomCode, setRoomCode] = useState('AIR-8080');

  // FAQ Accordion state
  const [openFaq, setOpenFaq] = useState(0);

  // Live Canvas Pong Arena State & Physics (Automated Endless Rally)
  const canvasRef = useRef(null);
  const [gameStats, setGameStats] = useState({ speed: 184, pingP1: 11, pingP2: 14 });
  const [p1ActiveBtn, setP1ActiveBtn] = useState(null);
  const [p2ActiveBtn, setP2ActiveBtn] = useState(null);

  const gameStateRef = useRef({
    p1Y: 140,
    p2Y: 140,
    paddleHeight: 70,
    paddleWidth: 10,
    ballX: 350,
    ballY: 175,
    ballVx: 5.2,
    ballVy: 2.2,
    speed: 184,
    p1Offset: 0,
    p2Offset: 0,
    p1Lerp: 0.11,
    p2Lerp: 0.09
  });

  // Game Loop for Live TV Display Preview (Automated continuous ping pong rally with randomized realistic AI)
  useEffect(() => {
    let animId;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    const g = gameStateRef.current;

    const loop = () => {
      // Move Ball
      g.ballX += g.ballVx;
      g.ballY += g.ballVy;

      // Realistic Randomized AI movement for Player 1 (Left) & Player 2 (Right)
      if (g.ballVx < 0) {
        // Ball moving towards P1 (Left): P1 tracks ball, P2 relaxes back to center area
        const targetP1Y = g.ballY - g.paddleHeight / 2 + g.p1Offset;
        g.p1Y += (targetP1Y - g.p1Y) * g.p1Lerp;

        const restP2Y = (height - g.paddleHeight) / 2 + Math.sin(Date.now() / 600) * 15;
        g.p2Y += (restP2Y - g.p2Y) * 0.04;
      } else {
        // Ball moving towards P2 (Right): P2 tracks ball, P1 relaxes back to center area
        const targetP2Y = g.ballY - g.paddleHeight / 2 + g.p2Offset;
        g.p2Y += (targetP2Y - g.p2Y) * g.p2Lerp;

        const restP1Y = (height - g.paddleHeight) / 2 + Math.cos(Date.now() / 600) * 15;
        g.p1Y += (restP1Y - g.p1Y) * 0.04;
      }

      // Guarantee paddle coverage as ball approaches impact zone
      if (g.ballX <= 120 && g.ballVx < 0) {
        // Ensure P1 covers ball Y
        const minY = g.ballY - g.paddleHeight + 12;
        const maxY = g.ballY - 12;
        g.p1Y = Math.max(minY, Math.min(maxY, g.p1Y));
      }
      if (g.ballX >= width - 120 && g.ballVx > 0) {
        // Ensure P2 covers ball Y
        const minY = g.ballY - g.paddleHeight + 12;
        const maxY = g.ballY - 12;
        g.p2Y = Math.max(minY, Math.min(maxY, g.p2Y));
      }

      // Clamp paddles inside arena canvas
      g.p1Y = Math.max(10, Math.min(height - g.paddleHeight - 10, g.p1Y));
      g.p2Y = Math.max(10, Math.min(height - g.paddleHeight - 10, g.p2Y));

      // Ball Wall bounce (top/bottom)
      if (g.ballY <= 12) {
        g.ballY = 12;
        g.ballVy = Math.abs(g.ballVy);
      } else if (g.ballY >= height - 12) {
        g.ballY = height - 12;
        g.ballVy = -Math.abs(g.ballVy);
      }

      // Ball P1 Paddle Collision (Left) - Always hits & bounces with dynamic angle
      if (g.ballX - 7 <= 25 && g.ballVx < 0) {
        g.ballX = 26;
        g.ballVx = Math.abs(g.ballVx);
        // Calculate hit impact location relative to paddle center for angle variation
        const hitPos = (g.ballY - (g.p1Y + g.paddleHeight / 2)) / (g.paddleHeight / 2);
        g.ballVy = hitPos * 3.8 + (Math.random() - 0.5) * 0.5;
        g.ballVy = Math.max(-5, Math.min(5, g.ballVy));

        // Randomize P2's upcoming target offset and reaction speed
        g.p2Offset = (Math.random() - 0.5) * 36;
        g.p2Lerp = 0.08 + Math.random() * 0.08;

        // Visual flash indicator for P1 hit
        setP1ActiveBtn('hit');
        setTimeout(() => setP1ActiveBtn(null), 180);
      }

      // Ball P2 Paddle Collision (Right) - Always hits & bounces with dynamic angle
      if (g.ballX + 7 >= width - 25 && g.ballVx > 0) {
        g.ballX = width - 26;
        g.ballVx = -Math.abs(g.ballVx);
        // Calculate hit impact location relative to paddle center for angle variation
        const hitPos = (g.ballY - (g.p2Y + g.paddleHeight / 2)) / (g.paddleHeight / 2);
        g.ballVy = hitPos * 3.8 + (Math.random() - 0.5) * 0.5;
        g.ballVy = Math.max(-5, Math.min(5, g.ballVy));

        // Randomize P1's upcoming target offset and reaction speed
        g.p1Offset = (Math.random() - 0.5) * 36;
        g.p1Lerp = 0.08 + Math.random() * 0.08;

        // Visual flash indicator for P2 hit
        setP2ActiveBtn('hit');
        setTimeout(() => setP2ActiveBtn(null), 180);
      }

      // Draw Screen
      ctx.clearRect(0, 0, width, height);

      // Background grid subtle effect
      ctx.strokeStyle = '#161b22';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Center Divider line
      ctx.strokeStyle = '#30363d';
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(width / 2, 0);
      ctx.lineTo(width / 2, height);
      ctx.stroke();
      ctx.setLineDash([]);

      // Center Circle
      ctx.strokeStyle = '#30363d';
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, 45, 0, Math.PI * 2);
      ctx.stroke();

      // P1 Paddle (Electric Blue #58a6ff)
      ctx.shadowColor = '#58a6ff';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#58a6ff';
      ctx.beginPath();
      ctx.roundRect(15, g.p1Y, g.paddleWidth, g.paddleHeight, 5);
      ctx.fill();

      // P2 Paddle (Coral Red #f85149)
      ctx.shadowColor = '#f85149';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#f85149';
      ctx.beginPath();
      ctx.roundRect(width - 25, g.p2Y, g.paddleWidth, g.paddleHeight, 5);
      ctx.fill();

      // Ball (White with soft glow)
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 15;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(g.ballX, g.ballY, 7, 0, Math.PI * 2);
      ctx.fill();

      // Reset shadow
      ctx.shadowBlur = 0;

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, []);

  // Helper trigger functions for P1 controls (Visual interactive response)
  const handleP1Dir = (dir) => {
    setP1ActiveBtn(dir);
    setTimeout(() => setP1ActiveBtn(null), 250);
  };

  // Helper trigger functions for P2 controls (Visual interactive response)
  const handleP2Btn = (btn) => {
    setP2ActiveBtn(btn);
    setTimeout(() => setP2ActiveBtn(null), 250);
  };

  const faqData = [
    {
      q: "01. How do players join a room?",
      a: "Players simply scan the QR code displayed on the host screen using their phone's camera, or type in the 4-digit room code at airgamepad.com. The WebRTC peer-to-peer data channel initializes automatically in under 1 second without downloading any app."
    },
    {
      q: "02. Do both phones need to be on the same Wi-Fi network?",
      a: "While staying on the same local Wi-Fi router delivers sub-10ms latency via direct P2P LAN connection, Air Game Pad automatically utilizes STUN/TURN signaling to support seamless multiplayer over 5G/4G cellular networks."
    },
    {
      q: "03. Are controller haptics and motion sensors supported?",
      a: "Yes! Modern web APIs allow us to trigger physical device vibration motors for tactile recoil on trigger clicks, as well as leverage the smartphone gyroscope for motion-assisted steering and motion controls."
    },
    {
      q: "04. Is any dongle, app, or extra hardware needed?",
      a: "Zero hardware dongles, USB adapters, or native mobile installations are needed. Any modern web browser (Google Chrome, Apple Safari, Mozilla Firefox, Microsoft Edge) running on a Smart TV, laptop, or desktop acts as the display host."
    }
  ];

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#ffffff] font-['Inter',sans-serif] selection:bg-[#58a6ff] selection:text-[#0d1117]">

      {/* NAV BAR */}
      <header className="sticky top-0 z-40 border-b border-[#30363d]/80 bg-[#0d1117]/90 backdrop-blur-md px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Logo & Status Badge */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#161b22] border border-[#30363d] flex items-center justify-center text-[#58a6ff] shadow-sm">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold tracking-tight text-lg leading-tight flex items-center gap-1.5">
                Air Game <span className="text-[#58a6ff]">Pad</span>
              </span>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono-code bg-[#161b22] border border-[#30363d] text-[#00ff85]">
              <span className="w-2 h-2 rounded-full bg-[#00ff85] animate-pulse"></span>
              WEBRTC
            </span>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#8b949e]">
            <a href="#features" className="hover:text-[#ffffff] transition-colors">Features</a>
            <a href="#architecture" className="hover:text-[#ffffff] transition-colors">Architecture</a>
            <a href="#faq" className="hover:text-[#ffffff] transition-colors">FAQ</a>
            <a href="https://github.com/Dikshitha2607/CodeSprint-Week-1" target="_blank" rel="noreferrer" className="hover:text-[#ffffff] transition-colors flex items-center gap-1">
              GitHub
            </a>
          </nav>

          {/* Right Metrics & CTA */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-[#161b22] border border-[#30363d] text-xs font-mono-code text-[#c9d1d9]">
              <span className="flex items-center gap-1 text-[#00ff85]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00ff85]"></span>
                WEBRTC P2P 12ms
              </span>
              <span className="text-[#8b949e]">|</span>
              <span className="text-[#8b949e]">1 fps | s2psd</span>
            </div>

            <button
              onClick={() => setActiveModal('host')}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#58a6ff] text-[#0d1117] hover:bg-[#58a6ff]/90 transition-all shadow-[0_0_15px_rgba(88,166,255,0.3)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-12 sm:pt-20 pb-16 px-4 sm:px-6 overflow-hidden">
        {/* Glow background elements */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#58a6ff]/10 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="max-w-4xl mx-auto text-center relative z-10 flex flex-col items-center">
          
          {/* Version pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#161b22] border border-[#30363d] text-xs font-mono-code text-[#c9d1d9] mb-6 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#00ff85]"></span>
            <span>V2.4 • WEBRTC DATACHANNEL MESH • ZERO CONFIG</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-[#ffffff] mb-4">
            Air Game <span className="bg-gradient-to-r from-[#ffffff] via-[#c9d1d9] to-[#58a6ff] bg-clip-text text-transparent">Pad</span>
          </h1>

          {/* Subtitle & Description */}
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#c9d1d9] mb-4 max-w-2xl">
            Turn your phone into a gamepad. Zero setup required.
          </h2>

          <p className="text-base sm:text-lg text-[#8b949e] max-w-2xl mb-8 leading-relaxed">
            High-performance, ultra-low latency wireless controller streaming direct in the browser via WebRTC data channels.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <button
              onClick={() => setActiveModal('host')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl text-base font-bold bg-[#58a6ff] text-[#0d1117] hover:bg-[#58a6ff]/90 transition-all flex items-center justify-center gap-2.5 shadow-[0_0_20px_rgba(88,166,255,0.4)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Play className="w-5 h-5 fill-current" />
              Start Game Room
            </button>

            <button
              onClick={() => setActiveModal('join')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl text-base font-bold bg-[#161b22] text-[#ffffff] border border-[#30363d] hover:border-[#58a6ff]/50 hover:bg-[#161b22]/80 transition-all flex items-center justify-center gap-2.5 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Radio className="w-5 h-5 text-[#58a6ff]" />
              Join as Controller
            </button>
          </div>
        </div>
      </section>

      {/* 3 FEATURE CARDS GRID */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        
        {/* Section Title Header for Features (matching Living Room Arena Architecture design) */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-mono-code text-[#58a6ff] mb-2 uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-[#58a6ff]"></span>
              CORE PLATFORM CAPABILITIES
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#ffffff]">
              Features
            </h2>
          </div>
          <div className="px-3.5 py-1.5 rounded-lg bg-[#161b22] border border-[#30363d] text-xs font-mono-code text-[#c9d1d9] flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#58a6ff]" />
            <span>ARCH SPEC: 0-APP SETUP • P2P MESH</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1 - P2P Local Duel */}
          <div className="glass-card glass-card-hover rounded-2xl p-6 sm:p-7 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#161b22] border border-[#30363d] flex items-center justify-center text-[#58a6ff] mb-5 shadow-sm">
                <Gamepad2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#ffffff] mb-2.5">
                P2P Local Duel
              </h3>
              <p className="text-sm text-[#8b949e] leading-relaxed mb-6">
                True split-screen arena gameplay. Dual-controller parity featuring directional thumb sweeps, trigger clicks, and tactile haptic recoil.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono-code text-[#58a6ff] pt-4 border-t border-[#30363d]/60">
              <CheckCircle2 className="w-4 h-4" />
              <span>Dual P1/P2 Support</span>
            </div>
          </div>

          {/* Card 2 - Sub-15ms WebRTC */}
          <div className="glass-card glass-card-hover rounded-2xl p-6 sm:p-7 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#161b22] border border-[#30363d] flex items-center justify-center text-[#00ff85] mb-5 shadow-sm">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#ffffff] mb-2.5">
                Sub-15ms WebRTC
              </h3>
              <p className="text-sm text-[#8b949e] leading-relaxed mb-6">
                Sub-15ms direct UDP input streaming with automated WebSocket signaling fallback and adaptive STUN packet interleaving.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono-code text-[#00ff85] pt-4 border-t border-[#30363d]/60">
              <span className="w-2 h-2 rounded-full bg-[#00ff85] animate-pulse"></span>
              <span>~8.5ms Local Wi-Fi</span>
            </div>
          </div>

          {/* Card 3 - Zero-App Install */}
          <div className="glass-card glass-card-hover rounded-2xl p-6 sm:p-7 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#161b22] border border-[#30363d] flex items-center justify-center text-[#f85149] mb-5 shadow-sm">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#ffffff] mb-2.5">
                Zero-App Install
              </h3>
              <p className="text-sm text-[#8b949e] leading-relaxed mb-6">
                Instant browser-to-browser P2P via QR scan, zero downloads, zero App Store friction. Works on iOS Safari & Android Chrome.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono-code text-[#f85149] pt-4 border-t border-[#30363d]/60">
              <QrCode className="w-4 h-4" />
              <span>Scan & Connect</span>
            </div>
          </div>

        </div>
      </section>

      {/* LIVING ROOM ARENA ARCHITECTURE (SHARED TV DISPLAY ON TOP, P1 & P2 CONTROLLERS SIDE-BY-SIDE BELOW) */}
      <section id="architecture" className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        
        {/* Section Title Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-mono-code text-[#58a6ff] mb-2 uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-[#58a6ff]"></span>
              INTERACTIVE STREAMING TOPOLOGY
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#ffffff]">
              Living Room Arena Architecture
            </h2>
          </div>
          <div className="px-3.5 py-1.5 rounded-lg bg-[#161b22] border border-[#30363d] text-xs font-mono-code text-[#c9d1d9] flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#58a6ff]" />
            <span>P2P CHANNEL MESH: P1 (<span className="text-[#58a6ff]">#58A6FF</span>) • P2 (<span className="text-[#f85149]">#F85149</span>)</span>
          </div>
        </div>

        {/* Outer Container for Architecture Visualizer */}
        <div className="rounded-2xl bg-[#161b22] border border-[#30363d] p-4 sm:p-8 flex flex-col gap-6 shadow-2xl relative">
          
          {/* 1. SHARED LIVING ROOM DESKTOP DISPLAY (TOP SECTION) */}
          <div className="rounded-xl border border-[#30363d] bg-[#0d1117] p-4 sm:p-5 relative">
            
            {/* Header bar of TV Display (Scores Removed) */}
            <div className="flex items-center justify-between mb-3 border-b border-[#30363d]/60 pb-2.5">
              <div className="flex items-center gap-2 font-mono-code text-xs font-bold text-[#00ff85]">
                <span className="w-2 h-2 rounded-full bg-[#00ff85] animate-pulse"></span>
                TV APP Neon Hyper-Rally • Arena #8080
              </div>
              <div className="flex items-center gap-3 text-xs font-mono-code">
                <span className="text-[#58a6ff] font-bold">P1 MATCH ACTIVE</span>
                <span className="text-[#8b949e]">•</span>
                <span className="text-[#f85149] font-bold">P2 MATCH ACTIVE</span>
                <span className="w-2 h-2 rounded-full bg-[#00ff85] animate-pulse"></span>
              </div>
            </div>

            {/* Continuous Table Tennis Game Canvas */}
            <div className="relative w-full aspect-[16/8] sm:aspect-[16/7] rounded-lg bg-[#0d1117] border border-[#30363d] overflow-hidden flex items-center justify-center shadow-inner">
              <canvas
                ref={canvasRef}
                width={700}
                height={350}
                className="w-full h-full object-contain"
              />

              {/* Status bar overlays on TV display */}
              <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded bg-[#161b22]/90 border border-[#30363d] text-[11px] font-mono-code text-[#00ff85] flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                SPD: {gameStats.speed} MPH
              </div>

              <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded bg-[#161b22]/90 border border-[#30363d] text-[11px] font-mono-code text-[#f85149] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                CONTINUOUS RALLIES
              </div>
            </div>

            {/* Sub-bar below TV Display */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-3 font-mono-code text-xs text-[#8b949e]">
              <div className="flex items-center gap-2 text-[#00ff85]">
                <Tv className="w-4 h-4" />
                <span>SHARED LIVING ROOM DESKTOP DISPLAY</span>
              </div>
              <div>NO DONGLES OR PLUGINS REQUIRED</div>
            </div>
          </div>

          {/* 2. PLAYER 1 AND PLAYER 2 REMOTES SECTION (HALF-HALF BELOW THE TENNIS GAME) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* PLAYER 1 CONTROLLER (LEFT HALF) */}
            <div className="rounded-xl border border-[#30363d] bg-[#0d1117] p-4 sm:p-5 relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3 border-b border-[#30363d]/60 pb-2.5">
                <div className="flex items-center gap-2 font-mono-code text-xs font-bold text-[#58a6ff]">
                  <span className="w-2 h-2 rounded-full bg-[#58a6ff] animate-pulse"></span>
                  ● PLAYER 1
                </div>
                <div className="flex items-center gap-3 text-xs font-mono-code text-[#8b949e]">
                  <span>{gameStats.pingP1}ms PING</span>
                  <BatteryIcon level={92} color="#58a6ff" />
                </div>
              </div>

              {/* Mobile Touch Controller Surface P1 */}
              <div className="bg-[#161b22] rounded-lg p-4 border border-[#30363d]/80 flex flex-col items-center">
                <div className="w-full flex items-center justify-between mb-3 text-[11px] font-mono-code text-[#8b949e]">
                  <span>AIR CONTROLLER P1</span>
                  <span className="text-[#58a6ff]">TOUCH / D-PAD READY</span>
                </div>

                {/* D-PAD Controls */}
                <div className="grid grid-cols-3 gap-2 w-36 h-36 my-2">
                  <div></div>
                  <button
                    onClick={() => handleP1Dir('up')}
                    className={`rounded-lg bg-[#0d1117] border border-[#30363d] text-[#c9d1d9] hover:border-[#58a6ff] hover:text-[#58a6ff] flex items-center justify-center font-bold text-sm transition-all cursor-pointer ${p1ActiveBtn === 'up' ? 'bg-[#58a6ff]/30 border-[#58a6ff] text-[#58a6ff] scale-95' : ''}`}
                  >
                    ▲
                  </button>
                  <div></div>

                  <button
                    onClick={() => handleP1Dir('left')}
                    className={`rounded-lg bg-[#0d1117] border border-[#30363d] text-[#c9d1d9] hover:border-[#58a6ff] hover:text-[#58a6ff] flex items-center justify-center font-bold text-sm transition-all cursor-pointer ${p1ActiveBtn === 'left' ? 'bg-[#58a6ff]/30 border-[#58a6ff] text-[#58a6ff] scale-95' : ''}`}
                  >
                    ◀
                  </button>
                  <div className="rounded-lg bg-[#0d1117] border border-[#30363d] flex items-center justify-center">
                    <span className={`w-2.5 h-2.5 rounded-full ${p1ActiveBtn ? 'bg-[#ffffff] scale-125' : 'bg-[#58a6ff]'} transition-all`}></span>
                  </div>
                  <button
                    onClick={() => handleP1Dir('right')}
                    className={`rounded-lg bg-[#0d1117] border border-[#30363d] text-[#c9d1d9] hover:border-[#58a6ff] hover:text-[#58a6ff] flex items-center justify-center font-bold text-sm transition-all cursor-pointer ${p1ActiveBtn === 'right' ? 'bg-[#58a6ff]/30 border-[#58a6ff] text-[#58a6ff] scale-95' : ''}`}
                  >
                    ▶
                  </button>

                  <div></div>
                  <button
                    onClick={() => handleP1Dir('down')}
                    className={`rounded-lg bg-[#0d1117] border border-[#30363d] text-[#c9d1d9] hover:border-[#58a6ff] hover:text-[#58a6ff] flex items-center justify-center font-bold text-sm transition-all cursor-pointer ${p1ActiveBtn === 'down' ? 'bg-[#58a6ff]/30 border-[#58a6ff] text-[#58a6ff] scale-95' : ''}`}
                  >
                    ▼
                  </button>
                  <div></div>
                </div>

                {/* Bottom Trigger Buttons */}
                <div className="w-full flex items-center justify-between gap-4 mt-3 pt-3 border-t border-[#30363d]/60 font-mono-code text-xs">
                  <button
                    onClick={() => handleP1Dir('L1')}
                    className={`flex-1 py-1.5 rounded-md bg-[#0d1117] border border-[#30363d] hover:border-[#58a6ff] text-[#58a6ff] text-center font-semibold transition-all cursor-pointer ${p1ActiveBtn === 'L1' ? 'bg-[#58a6ff]/30 border-[#58a6ff]' : ''}`}
                  >
                    L1 • BOOST
                  </button>
                  <button
                    onClick={() => handleP1Dir('R1')}
                    className={`flex-1 py-1.5 rounded-md bg-[#0d1117] border border-[#30363d] hover:border-[#58a6ff] text-[#58a6ff] text-center font-semibold transition-all cursor-pointer ${p1ActiveBtn === 'R1' ? 'bg-[#58a6ff]/30 border-[#58a6ff]' : ''}`}
                  >
                    R1 • NITRO
                  </button>
                </div>
              </div>
              <div className="text-center font-mono-code text-xs text-[#8b949e] mt-3">
                Mobile Touch Surface (P1)
              </div>
            </div>

            {/* PLAYER 2 CONTROLLER (RIGHT HALF) */}
            <div className="rounded-xl border border-[#30363d] bg-[#0d1117] p-4 sm:p-5 relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3 border-b border-[#30363d]/60 pb-2.5">
                <div className="flex items-center gap-2 font-mono-code text-xs font-bold text-[#f85149]">
                  <span className="w-2 h-2 rounded-full bg-[#f85149] animate-pulse"></span>
                  ● PLAYER 2
                </div>
                <div className="flex items-center gap-3 text-xs font-mono-code text-[#8b949e]">
                  <span>{gameStats.pingP2}ms PING</span>
                  <BatteryIcon level={88} color="#f85149" />
                </div>
              </div>

              {/* Mobile Touch Controller Surface P2 */}
              <div className="bg-[#161b22] rounded-lg p-4 border border-[#30363d]/80 flex flex-col items-center">
                <div className="w-full flex items-center justify-between mb-3 text-[11px] font-mono-code text-[#8b949e]">
                  <span>AIR CONTROLLER P2</span>
                  <span className="text-[#f85149]">ACTION POD READY</span>
                </div>

                {/* Action Buttons (Y, X, B, A) */}
                <div className="grid grid-cols-3 gap-2 w-36 h-36 my-2">
                  <div></div>
                  <button
                    onClick={() => handleP2Btn('Y')}
                    className={`rounded-full bg-[#0d1117] border border-[#30363d] text-[#f85149] hover:border-[#f85149] hover:bg-[#f85149]/20 flex items-center justify-center font-bold text-sm transition-all cursor-pointer ${p2ActiveBtn === 'Y' ? 'scale-90 bg-[#f85149]/40 border-[#f85149]' : ''}`}
                  >
                    Y
                  </button>
                  <div></div>

                  <button
                    onClick={() => handleP2Btn('X')}
                    className={`rounded-full bg-[#0d1117] border border-[#30363d] text-[#f85149] hover:border-[#f85149] hover:bg-[#f85149]/20 flex items-center justify-center font-bold text-sm transition-all cursor-pointer ${p2ActiveBtn === 'X' ? 'scale-90 bg-[#f85149]/40 border-[#f85149]' : ''}`}
                  >
                    X
                  </button>
                  <div className="rounded-full bg-[#0d1117] border border-[#30363d] flex items-center justify-center">
                    <span className={`w-2.5 h-2.5 rounded-full ${p2ActiveBtn ? 'bg-[#ffffff] scale-125' : 'bg-[#f85149]'} transition-all`}></span>
                  </div>
                  <button
                    onClick={() => handleP2Btn('B')}
                    className={`rounded-full bg-[#0d1117] border border-[#30363d] text-[#f85149] hover:border-[#f85149] hover:bg-[#f85149]/20 flex items-center justify-center font-bold text-sm transition-all cursor-pointer ${p2ActiveBtn === 'B' ? 'scale-90 bg-[#f85149]/40 border-[#f85149]' : ''}`}
                  >
                    B
                  </button>

                  <div></div>
                  <button
                    onClick={() => handleP2Btn('A')}
                    className={`rounded-full bg-[#0d1117] border border-[#30363d] text-[#f85149] hover:border-[#f85149] hover:bg-[#f85149]/20 flex items-center justify-center font-bold text-sm transition-all cursor-pointer ${p2ActiveBtn === 'A' ? 'scale-90 bg-[#f85149]/40 border-[#f85149]' : ''}`}
                  >
                    A
                  </button>
                  <div></div>
                </div>

                {/* Haptic Engine Status */}
                <div className="w-full flex items-center justify-between gap-4 mt-3 pt-3 border-t border-[#30363d]/60 font-mono-code text-xs">
                  <span className="text-[#8b949e]">HAPTIC ENGINE</span>
                  <span className="text-[#00ff85] font-semibold">ACTIVE (30MS)</span>
                </div>
              </div>
              <div className="text-center font-mono-code text-xs text-[#8b949e] mt-3">
                Tactile Action Pod (P2)
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#161b22] border border-[#30363d] text-xs font-mono-code text-[#58a6ff] mb-4">
            # faq
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#ffffff] mb-3">
            Everything You Need to Know
          </h2>
          <p className="text-[#8b949e] text-base">
            Instant couch multiplayer, zero drivers or configuration.
          </p>
        </div>

        {/* Accordion list */}
        <div className="flex flex-col gap-3">
          {faqData.map((item, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={index}
                className="glass-card rounded-xl border border-[#30363d] overflow-hidden transition-all duration-200"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? -1 : index)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-semibold text-base sm:text-lg text-[#ffffff] hover:text-[#58a6ff] transition-colors cursor-pointer"
                >
                  <span>{item.q}</span>
                  <ChevronDown className={`w-5 h-5 text-[#8b949e] transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180 text-[#58a6ff]' : ''}`} />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 text-sm text-[#8b949e] leading-relaxed border-t border-[#30363d]/50 pt-3">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* BOTTOM CTA BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="glass-card rounded-2xl p-8 sm:p-12 border border-[#30363d] relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-8 shadow-2xl">
          
          {/* Subtle glow background */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-80 h-80 bg-[#58a6ff]/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="max-w-xl relative z-10">
            <div className="text-xs font-mono-code font-bold text-[#58a6ff] tracking-wider uppercase mb-2">
              COUCH GAMING REIMAGINED
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#ffffff] mb-3">
              Open this screen on your Smart TV or Laptop.
            </h2>
            <p className="text-sm sm:text-base text-[#8b949e] leading-relaxed">
              Create a room in 3 seconds, gather your friends on the couch, and start playing competitive arcade party duels immediately.
            </p>
          </div>

          <div className="relative z-10 w-full md:w-auto">
            <button
              onClick={() => setActiveModal('host')}
              className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-bold bg-[#58a6ff] text-[#0d1117] hover:bg-[#58a6ff]/90 transition-all flex items-center justify-center gap-3 shadow-[0_0_25px_rgba(88,166,255,0.4)] hover:scale-[1.03] active:scale-[0.98] cursor-pointer whitespace-nowrap"
            >
              Launch Arena Now
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#30363d]/80 py-8 px-4 sm:px-8 text-xs font-mono-code text-[#8b949e]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00ff85] animate-pulse"></span>
            <span>All Systems Operational • P2P-App WebRTC Peer-To-Peer • 60 FPS Sync</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="#architecture" className="hover:text-[#ffffff] transition-colors">Setup Guide</a>
            <a href="https://github.com/Dikshitha2607/CodeSprint-Week-1" target="_blank" rel="noreferrer" className="hover:text-[#ffffff] transition-colors">GitHub</a>
            <a href="#faq" className="hover:text-[#ffffff] transition-colors">APIDocs</a>
            <a href="#architecture" className="hover:text-[#ffffff] transition-colors">Controls Support</a>
          </div>

        </div>
      </footer>

      {/* MODAL: START GAME ROOM (HOST) */}
      {activeModal === 'host' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0d1117]/80 backdrop-blur-md animate-fadeIn">
          <div className="glass-card w-full max-w-lg rounded-2xl p-6 sm:p-8 border border-[#30363d] relative shadow-2xl">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-5 right-5 text-[#8b949e] hover:text-[#ffffff] p-1 rounded-lg hover:bg-[#30363d]/50 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#58a6ff]/10 border border-[#58a6ff]/30 flex items-center justify-center text-[#58a6ff]">
                <Tv className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#ffffff]">Game Room Created</h3>
                <p className="text-xs text-[#8b949e]">Room Code: <span className="text-[#58a6ff] font-mono-code font-bold">{roomCode}</span></p>
              </div>
            </div>

            <div className="bg-[#0d1117] rounded-xl p-6 border border-[#30363d] my-5 flex flex-col items-center text-center">
              {/* Mock QR Code */}
              <div className="w-44 h-44 bg-[#ffffff] p-3 rounded-xl shadow-lg flex items-center justify-center mb-4">
                <QrCode className="w-full h-full text-[#0d1117]" />
              </div>
              <p className="text-sm font-semibold text-[#c9d1d9] mb-1">
                Scan with Phone Camera to Join
              </p>
              <p className="text-xs text-[#8b949e]">
                Or enter code <span className="text-[#00ff85] font-mono-code">{roomCode}</span> on airgamepad.com
              </p>
            </div>

            <div className="flex items-center justify-between text-xs font-mono-code text-[#8b949e] mb-6">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00ff85]"></span>
                <span>P1: Connected</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00ff85]"></span>
                <span>P2: Connected</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setActiveModal(null);
                  document.getElementById('architecture')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full py-3 rounded-xl font-bold bg-[#58a6ff] text-[#0d1117] hover:bg-[#58a6ff]/90 transition-all cursor-pointer text-center"
              >
                Launch Arena Screen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: JOIN AS CONTROLLER */}
      {activeModal === 'join' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0d1117]/80 backdrop-blur-md animate-fadeIn">
          <div className="glass-card w-full max-w-lg rounded-2xl p-6 sm:p-8 border border-[#30363d] relative shadow-2xl">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-5 right-5 text-[#8b949e] hover:text-[#ffffff] p-1 rounded-lg hover:bg-[#30363d]/50 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#00ff85]/10 border border-[#00ff85]/30 flex items-center justify-center text-[#00ff85]">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#ffffff]">Join Controller Room</h3>
                <p className="text-xs text-[#8b949e]">Enter your host room code to pair instantly</p>
              </div>
            </div>

            <div className="my-5 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-mono-code text-[#8b949e] mb-1.5 uppercase">Room Code</label>
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  className="w-full bg-[#0d1117] border border-[#30363d] focus:border-[#58a6ff] rounded-xl px-4 py-3 font-mono-code text-center text-lg text-[#58a6ff] font-bold uppercase tracking-wider outline-none"
                  placeholder="AIR-8080"
                />
              </div>

              <div>
                <label className="block text-xs font-mono-code text-[#8b949e] mb-1.5 uppercase">Select Player Slot</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setControllerRole('p1')}
                    className={`py-3 rounded-xl border font-mono-code text-sm font-bold transition-all cursor-pointer ${controllerRole === 'p1' ? 'bg-[#58a6ff]/20 border-[#58a6ff] text-[#58a6ff]' : 'bg-[#0d1117] border-[#30363d] text-[#8b949e]'}`}
                  >
                    PLAYER 1 (#58A6FF)
                  </button>
                  <button
                    onClick={() => setControllerRole('p2')}
                    className={`py-3 rounded-xl border font-mono-code text-sm font-bold transition-all cursor-pointer ${controllerRole === 'p2' ? 'bg-[#f85149]/20 border-[#f85149] text-[#f85149]' : 'bg-[#0d1117] border-[#30363d] text-[#8b949e]'}`}
                  >
                    PLAYER 2 (#F85149)
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setActiveModal(null);
                document.getElementById('architecture')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full py-3.5 rounded-xl font-bold bg-[#00ff85] text-[#0d1117] hover:bg-[#00ff85]/90 transition-all cursor-pointer text-center shadow-[0_0_20px_rgba(0,255,133,0.3)]"
            >
              Connect Controller
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

// Helper Battery Icon Component
function BatteryIcon({ level = 100, color = "#58a6ff" }) {
  return (
    <div className="flex items-center gap-1">
      <div className="w-5 h-2.5 rounded-[2px] border border-[#30363d] p-[1px] relative">
        <div
          className="h-full rounded-[1px]"
          style={{ width: `${level}%`, backgroundColor: color }}
        ></div>
      </div>
      <span>{level}%</span>
    </div>
  );
}
