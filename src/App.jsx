import React, { useState, useEffect, useRef } from 'react';

const WINNING_SCORE = 5;
const paddleWidth = 14;
const paddleHeight = 110;
const paddleOffset = 18;
const paddleSpeed = 520;

export default function App() {
  const [scores, setScores] = useState({ p1: 0, p2: 0 });
  const [winner, setWinner] = useState(null);

  const boardRef = useRef(null);
  const leftPaddleRef = useRef(null);
  const rightPaddleRef = useRef(null);
  const ballRef = useRef(null);

  const gameStateRef = useRef({
    running: false,
    scores: { p1: 0, p2: 0 },
    lastTime: 0,
    leftPaddle: { x: 0, y: 0, width: paddleWidth, height: paddleHeight },
    rightPaddle: { x: 0, y: 0, width: paddleWidth, height: paddleHeight },
    ball: { x: 0, y: 0, radius: 10, vx: 0, vy: 0 },
    keys: {
      KeyW: false,
      KeyS: false,
      ArrowUp: false,
      ArrowDown: false,
    },
    animFrameId: null,
  });

  const getBoardSize = () => {
    if (!boardRef.current) return { width: 900, height: 506 };
    return {
      width: boardRef.current.clientWidth,
      height: boardRef.current.clientHeight,
    };
  };

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const setKeyState = (code, pressed) => {
    const c = String(code).toLowerCase();
    const keys = gameStateRef.current.keys;
    if (c === 'keyw' || c === 'w') {
      keys.KeyW = pressed;
    }
    if (c === 'keys' || c === 's') {
      keys.KeyS = pressed;
    }
    if (code === 'ArrowUp') {
      keys.ArrowUp = pressed;
    }
    if (code === 'ArrowDown') {
      keys.ArrowDown = pressed;
    }
  };

  const resetPaddles = () => {
    const size = getBoardSize();
    const g = gameStateRef.current;
    g.leftPaddle.x = paddleOffset;
    g.rightPaddle.x = size.width - paddleOffset - g.rightPaddle.width;
    g.leftPaddle.y = (size.height - g.leftPaddle.height) / 2;
    g.rightPaddle.y = (size.height - g.rightPaddle.height) / 2;
  };

  const resetBall = (direction = Math.random() < 0.5 ? -1 : 1) => {
    const size = getBoardSize();
    const angle = Math.random() * 1.1 - 0.55;
    const speed = 420;
    const g = gameStateRef.current;

    g.ball.x = size.width / 2;
    g.ball.y = size.height / 2;
    g.ball.vx = Math.cos(angle) * speed * direction;
    g.ball.vy = Math.sin(angle) * speed;
  };

  const renderPositions = () => {
    const g = gameStateRef.current;
    const size = getBoardSize();

    if (leftPaddleRef.current) {
      leftPaddleRef.current.style.width = `${g.leftPaddle.width}px`;
      leftPaddleRef.current.style.height = `${g.leftPaddle.height}px`;
      leftPaddleRef.current.style.left = `${g.leftPaddle.x}px`;
      leftPaddleRef.current.style.top = `${g.leftPaddle.y}px`;
    }

    if (rightPaddleRef.current) {
      rightPaddleRef.current.style.width = `${g.rightPaddle.width}px`;
      rightPaddleRef.current.style.height = `${g.rightPaddle.height}px`;
      rightPaddleRef.current.style.left = `${g.rightPaddle.x}px`;
      rightPaddleRef.current.style.top = `${g.rightPaddle.y}px`;
    }

    if (ballRef.current) {
      const b = g.ball;
      ballRef.current.style.width = `${b.radius * 2}px`;
      ballRef.current.style.height = `${b.radius * 2}px`;

      let leftPos = b.x - b.radius;
      let topPos = b.y - b.radius;

      if (b.x < 0 || b.x > size.width || b.y < 0 || b.y > size.height) {
        leftPos = clamp(b.x - b.radius, 0, size.width - b.radius * 2);
        topPos = clamp(b.y - b.radius, 0, size.height - b.radius * 2);
      }

      ballRef.current.style.left = `${leftPos}px`;
      ballRef.current.style.top = `${topPos}px`;
    }
  };

  const endGame = (w) => {
    const g = gameStateRef.current;
    g.running = false;
    setWinner(w);
  };

  const scorePoint = (player) => {
    const g = gameStateRef.current;
    g.scores[player] += 1;
    setScores({ ...g.scores });

    if (g.scores[player] >= WINNING_SCORE) {
      endGame(player);
      return;
    }

    const serveDirection = player === 'p1' ? 1 : -1;
    resetBall(serveDirection);
  };

  const handlePaddleCollision = (paddle, relativeSide) => {
    const b = gameStateRef.current.ball;
    const paddleTop = paddle.y;
    const paddleBottom = paddle.y + paddle.height;

    if (
      b.y + b.radius >= paddleTop &&
      b.y - b.radius <= paddleBottom &&
      ((relativeSide === 'left' && b.vx < 0 && b.x - b.radius <= paddle.x + paddle.width) ||
        (relativeSide === 'right' && b.vx > 0 && b.x + b.radius >= paddle.x))
    ) {
      const impactPoint = (b.y - (paddle.y + paddle.height / 2)) / (paddle.height / 2);
      const angle = impactPoint * (Math.PI / 3);
      const currentSpeed = Math.min(Math.hypot(b.vx, b.vy) * 1.08, 980);
      const direction = b.vx < 0 ? 1 : -1;

      b.vx = direction * Math.cos(angle) * currentSpeed;
      b.vy = Math.sin(angle) * currentSpeed;

      if (relativeSide === 'left') {
        b.x = paddle.x + paddle.width + b.radius;
      } else {
        b.x = paddle.x - b.radius;
      }
    }
  };

  const updatePlayerMovement = (dt) => {
    const size = getBoardSize();
    const g = gameStateRef.current;
    const k = g.keys;

    if (k.KeyW) g.leftPaddle.y -= paddleSpeed * dt;
    if (k.KeyS) g.leftPaddle.y += paddleSpeed * dt;
    if (k.ArrowUp) g.rightPaddle.y -= paddleSpeed * dt;
    if (k.ArrowDown) g.rightPaddle.y += paddleSpeed * dt;

    g.leftPaddle.y = clamp(g.leftPaddle.y, 0, size.height - g.leftPaddle.height);
    g.rightPaddle.y = clamp(g.rightPaddle.y, 0, size.height - g.rightPaddle.height);
  };

  const updateBall = (dt) => {
    const size = getBoardSize();
    const g = gameStateRef.current;
    const b = g.ball;

    b.x += b.vx * dt;
    b.y += b.vy * dt;

    if (b.y - b.radius <= 0) {
      b.y = b.radius;
      b.vy = Math.abs(b.vy);
    }

    if (b.y + b.radius >= size.height) {
      b.y = size.height - b.radius;
      b.vy = -Math.abs(b.vy);
    }

    if (b.x - b.radius <= 0) {
      scorePoint('p2');
      return;
    }

    if (b.x + b.radius >= size.width) {
      scorePoint('p1');
      return;
    }

    handlePaddleCollision(g.leftPaddle, 'left');
    handlePaddleCollision(g.rightPaddle, 'right');
  };

  const update = (dt) => {
    if (!gameStateRef.current.running) return;
    updatePlayerMovement(dt);
    updateBall(dt);
  };

  const gameLoop = (timestamp) => {
    const g = gameStateRef.current;
    const dt = Math.min((timestamp - g.lastTime) / 1000 || 0.016, 0.033);
    g.lastTime = timestamp;

    update(dt);
    renderPositions();
    g.animFrameId = requestAnimationFrame(gameLoop);
  };

  const resetGame = () => {
    const g = gameStateRef.current;
    g.scores.p1 = 0;
    g.scores.p2 = 0;
    g.running = true;
    setScores({ p1: 0, p2: 0 });
    setWinner(null);

    resetPaddles();
    resetBall(Math.random() < 0.5 ? -1 : 1);
  };

  useEffect(() => {
    resetPaddles();
    resetBall();
    renderPositions();

    const handleKeyDown = (event) => {
      const code = event.code || event.key;
      setKeyState(code, true);

      if (code === 'KeyW' || code === 'KeyS' || code === 'ArrowUp' || code === 'ArrowDown') {
        event.preventDefault();
      }
    };

    const handleKeyUp = (event) => {
      const code = event.code || event.key;
      setKeyState(code, false);
    };

    const handleBlur = () => {
      const k = gameStateRef.current.keys;
      k.KeyW = false;
      k.KeyS = false;
      k.ArrowUp = false;
      k.ArrowDown = false;
    };

    const handleResize = () => {
      const size = getBoardSize();
      const g = gameStateRef.current;
      g.leftPaddle.x = clamp(g.leftPaddle.x, 0, size.width - g.leftPaddle.width - paddleOffset);
      g.rightPaddle.x = clamp(g.rightPaddle.x, 0, size.width - g.rightPaddle.width - paddleOffset);
      g.leftPaddle.y = clamp(g.leftPaddle.y, 0, size.height - g.leftPaddle.height);
      g.rightPaddle.y = clamp(g.rightPaddle.y, 0, size.height - g.rightPaddle.height);
      g.ball.x = clamp(g.ball.x, g.ball.radius, size.width - g.ball.radius);
      g.ball.y = clamp(g.ball.y, g.ball.radius, size.height - g.ball.radius);
      renderPositions();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('resize', handleResize);

    gameStateRef.current.animFrameId = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('resize', handleResize);
      if (gameStateRef.current.animFrameId) {
        cancelAnimationFrame(gameStateRef.current.animFrameId);
      }
    };
  }, []);

  return (
    <main className="w-[min(92vw,980px)]">
      <header className="flex items-center justify-between gap-4 mb-[18px] flex-wrap max-sm:justify-center">
        <div className="flex items-center gap-3 px-[18px] py-3 border border-[rgba(255,255,255,0.26)] rounded-[12px] bg-[rgba(14,26,39,0.7)] min-h-[54px] shadow-[0_12px_25px_rgba(0,0,0,0.18)] max-sm:w-full max-sm:justify-center" aria-label="Scoreboard">
          <span className="font-bold tracking-[0.04em] uppercase text-[0.74rem] text-[#edf5ff] max-sm:text-[0.66rem]">Player 1</span>
          <span className="min-w-[2ch] text-center text-[clamp(1.6rem,2vw,2.2rem)] font-bold text-[#edf5ff]">{scores.p1}</span>
          <span className="text-[1.8rem] opacity-80 text-[#edf5ff]">|</span>
          <span className="min-w-[2ch] text-center text-[clamp(1.6rem,2vw,2.2rem)] font-bold text-[#edf5ff]">{scores.p2}</span>
          <span className="font-bold tracking-[0.04em] uppercase text-[0.74rem] text-[#edf5ff] max-sm:text-[0.66rem]">Player 2</span>
        </div>
        <button
          onClick={resetGame}
          className="border-none bg-gradient-to-br from-[#6ee7b7] to-[#86efac] text-[#052a1f] font-bold tracking-[0.04em] uppercase px-[18px] py-3 rounded-[12px] cursor-pointer transition-transform duration-150 ease-in-out shadow-[0_10px_18px_rgba(110,231,183,0.22)] hover:-translate-y-[1px] active:translate-y-[1px] max-sm:w-full"
          type="button"
        >
          Start / Restart
        </button>
      </header>

      <section ref={boardRef} className="relative w-full aspect-[16/9] rounded-[18px] overflow-hidden border-2 border-[rgba(255,255,255,0.18)] bg-gradient-to-b from-[rgba(14,35,41,0.9)] to-[rgba(8,17,24,0.9)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),0_18px_30px_rgba(0,0,0,0.25)] before:content-[''] before:absolute before:inset-0 before:bg-gradient-to-b before:from-[rgba(255,255,255,0.03)] before:to-[rgba(255,255,255,0.01)]" aria-label="Table tennis game area">
        <div className="absolute top-0 bottom-0 left-1/2 w-[2px] -translate-x-1/2 bg-[repeating-linear-gradient(to_bottom,rgba(255,255,255,0.7)_0,rgba(255,255,255,0.7)_14px,transparent_14px,transparent_22px)]" aria-hidden="true"></div>
        <div ref={leftPaddleRef} className="absolute bg-gradient-to-b from-[#f5f8ff] to-[#dfe9ff] rounded-[10px] shadow-[0_0_16px_rgba(255,255,255,0.15)]" aria-label="Player 1 paddle"></div>
        <div ref={rightPaddleRef} className="absolute bg-gradient-to-b from-[#f5f8ff] to-[#dfe9ff] rounded-[10px] shadow-[0_0_16px_rgba(255,255,255,0.15)]" aria-label="Player 2 paddle"></div>
        <div ref={ballRef} className="absolute rounded-full bg-[radial-gradient(circle_at_35%_35%,#ffffff,#dfe9ff_28%,#b5c2d8_100%)] shadow-[0_0_18px_rgba(255,255,255,0.4)]" aria-label="Ball"></div>
        {winner && (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-[18px] py-3 rounded-[12px] bg-[rgba(5,12,18,0.75)] border border-[rgba(255,255,255,0.12)] text-[#edf5ff] text-[clamp(0.95rem,2vw,1.2rem)] font-bold tracking-[0.06em] uppercase shadow-[0_10px_24px_rgba(0,0,0,0.18)]" aria-live="polite">
            {winner === 'p1' ? 'Player 1 wins!' : 'Player 2 wins!'}
          </div>
        )}
      </section>
    </main>
  );
}
