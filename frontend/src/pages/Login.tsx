import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Code2, 
  User, 
  KeyRound, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ArrowUpRight, 
  Terminal 
} from 'lucide-react';

const DEFAULT_SNIPPET = `import { createSession } from '@codesync/workspace';

const session = createSession({
  language: 'typescript',
  collaboration: true,
  execution: 'sandboxed'
});`;

export const Login: React.FC = () => {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Typing animation state for the code teaser
  const [code, setCode] = useState('');
  const [isTypingDone, setIsTypingDone] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const fromLocation = (location.state as any)?.from;
  const redirectPath = fromLocation
    ? `${fromLocation.pathname || '/'}${fromLocation.search || ''}${fromLocation.hash || ''}`
    : '/';

  // 1. Typing animation on page load for the code teaser
  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      index++;
      setCode(DEFAULT_SNIPPET.slice(0, index));
      if (index >= DEFAULT_SNIPPET.length) {
        clearInterval(interval);
        setIsTypingDone(true);
      }
    }, 18);

    return () => clearInterval(interval);
  }, []);

  // 2. Syntax highlighter for live typed text
  const renderHighlightedCode = (text: string) => {
    const tokens = text.split(/(\b(?:import|from|const|true)\b|'[^']*'|\bcreateSession\b|[{}(),:;])/g);
    return tokens.map((token, i) => {
      if (token === 'import' || token === 'from' || token === 'const') {
        return <span key={i} className="text-purple-600 dark:text-purple-400 font-semibold">{token}</span>;
      }
      if (token === 'true') {
        return <span key={i} className="text-indigo-600 dark:text-indigo-400 font-semibold">{token}</span>;
      }
      if (token === 'createSession') {
        return <span key={i} className="text-blue-600 dark:text-blue-400">{token}</span>;
      }
      if (token.startsWith("'")) {
        return <span key={i} className="text-emerald-600 dark:text-emerald-400 font-medium">{token}</span>;
      }
      return <span key={i}>{token}</span>;
    });
  };

  // 3. Subtle Animated Network Mesh Background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 600);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 800);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    const particleCount = 26;
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      radius: Math.random() * 1.5 + 1.2,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw faint connection lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 115) {
            const alpha = (1 - dist / 115) * 0.22;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(99, 102, 241, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      // Draw particles
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(99, 102, 241, 0.45)';
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(usernameOrEmail, password);
      navigate(redirectPath, { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#FAF7F0] dark:bg-dark-900 transition-colors font-sans">
      
      {/* ========================================================
          LEFT COLUMN: Visual Showcase & Typing Animated Code
         ======================================================== */}
      <div className="w-full lg:w-1/2 relative bg-gradient-to-br from-[#FAF7F0] via-[#FFFDF9] to-[#F5EFE4]/70 dark:from-dark-900 dark:via-dark-800 dark:to-dark-900/60 p-8 sm:p-12 lg:p-16 xl:p-20 flex flex-col justify-between overflow-hidden border-b lg:border-b-0 lg:border-r border-[#E8E0D1] dark:border-dark-700 min-h-[520px] lg:min-h-screen">
        
        {/* Animated Network Mesh Canvas */}
        <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0 opacity-80 dark:opacity-40" />

        {/* Subtle Radial Pulse behind the code card */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] bg-gradient-to-tr from-indigo-500/10 via-purple-500/10 to-blue-500/10 rounded-full blur-3xl pointer-events-none animate-pulse duration-[4000ms]" />

        {/* Top Brand Header */}
        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-2.5 hover:opacity-90 transition">
            <div className="p-2 bg-slate-900 dark:bg-accent-blue text-white rounded-xl shadow-md">
              <Code2 className="w-5 h-5 text-accent-blue dark:text-white" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-slate-900 dark:text-white">CodeSync</span>
          </Link>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100 mt-6 max-w-md leading-snug tracking-tight">
            Real-time collaborative code editor
          </h2>
        </div>

        {/* Glassmorphic Code Card with Live Typing Animation */}
        <div className="relative z-10 my-10 max-w-lg w-full">
          <div className="w-full backdrop-blur-xl bg-white/75 dark:bg-dark-800/70 border border-white/80 dark:border-white/10 shadow-[0_20px_50px_-10px_rgba(99,102,241,0.22)] rounded-2xl p-6 sm:p-7 relative overflow-hidden transition-all duration-300 hover:shadow-[0_25px_60px_-10px_rgba(99,102,241,0.3)]">
            
            {/* Top Specular Inner Reflection Line */}
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/80 dark:via-white/20 to-transparent pointer-events-none" />

            {/* Iridescent Glow Accent */}
            <div className="absolute -top-10 -right-10 w-44 h-44 bg-gradient-to-br from-cyan-400/20 via-indigo-400/20 to-pink-400/20 rounded-full blur-2xl pointer-events-none" />

            {/* Code Block with Highlighted Syntax and Live Typing Effect */}
            <pre className="font-mono text-xs sm:text-sm leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap select-none">
              <code>
                {renderHighlightedCode(code)}
                {!isTypingDone && (
                  <span className="inline-block w-2 h-4 bg-indigo-500 animate-pulse ml-0.5 -mb-0.5" />
                )}
              </code>
            </pre>
          </div>
        </div>

        {/* Perspective 3D Grid Floor */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-44 pointer-events-none opacity-50 dark:opacity-20 z-0"
          style={{
            backgroundImage: 'linear-gradient(to right, rgba(99, 102, 241, 0.18) 1px, transparent 1px), linear-gradient(to bottom, rgba(99, 102, 241, 0.18) 1px, transparent 1px)',
            backgroundSize: '36px 36px',
            transform: 'perspective(320px) rotateX(55deg)',
            transformOrigin: 'bottom center',
            maskImage: 'linear-gradient(to top, black 40%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to top, black 40%, transparent 100%)',
          }}
        />

        {/* Empty bottom spacer to keep vertical balance */}
        <div className="relative z-10 h-2"></div>
      </div>

      {/* ========================================================
          RIGHT COLUMN: Full-Height Clean Sign-In Form Viewport
         ======================================================== */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-16 xl:p-20 bg-[#FFFDF9] dark:bg-dark-800 transition-colors">
        <div className="max-w-md w-full flex flex-col items-start text-left">
          
          {/* Badge Pill - Aligned flush with left edge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-blue-600 dark:text-blue-400 text-[11px] font-bold rounded-full mb-4 uppercase tracking-wider self-start">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse"></span>
            LET'S BUILD SOMETHING
          </div>

          {/* Headline & Description */}
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight w-full">
            Sign in to CodeSync
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-8 leading-relaxed w-full">
            Pick up where you left off. Your code, your team, and your next idea are waiting.
          </p>

          {/* Notice when arriving via a shared workspace link */}
          {redirectPath.startsWith('/workspace/') && (
            <div className="mb-5 p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs rounded-xl flex items-center gap-2 font-medium w-full">
              <span className="text-base">🚀</span>
              <span>Sign in to enter the shared workspace room.</span>
            </div>
          )}

          {error && (
            <div className="mb-5 p-3.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs rounded-xl font-medium w-full">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 w-full">
            
            {/* Username or Email Input with Micro-Interaction Glowing Gradient on Focus */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Username or Email
              </label>
              <div className="relative group/field rounded-xl p-[1px] transition-all duration-300 bg-transparent focus-within:bg-gradient-to-r focus-within:from-blue-500 focus-within:via-indigo-500 focus-within:to-violet-500 focus-within:shadow-[0_0_20px_rgba(99,102,241,0.25)]">
                <div className="relative flex items-center bg-slate-50/70 dark:bg-dark-900 border border-slate-200 dark:border-dark-600 group-focus-within/field:border-transparent rounded-xl transition-colors">
                  <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within/field:text-indigo-500 transition-colors z-10">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={usernameOrEmail}
                    onChange={(e) => setUsernameOrEmail(e.target.value)}
                    placeholder="e.g. dev_sarah or sarah@example.com"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-transparent rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none transition"
                  />
                </div>
              </div>
            </div>

            {/* Password Input with Micro-Interaction Glowing Gradient on Focus */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative group/field rounded-xl p-[1px] transition-all duration-300 bg-transparent focus-within:bg-gradient-to-r focus-within:from-blue-500 focus-within:via-indigo-500 focus-within:to-violet-500 focus-within:shadow-[0_0_20px_rgba(99,102,241,0.25)]">
                <div className="relative flex items-center bg-slate-50/70 dark:bg-dark-900 border border-slate-200 dark:border-dark-600 group-focus-within/field:border-transparent rounded-xl transition-colors">
                  <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within/field:text-indigo-500 transition-colors z-10">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-transparent rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition z-10"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Gradient Sign In Button with Dynamic Shifting Hover State & Glowing Outer Spread */}
            <button
              type="submit"
              disabled={loading}
              className="group w-full py-3 px-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-[length:200%_auto] hover:bg-right hover:shadow-[0_0_28px_rgba(99,102,241,0.55)] hover:scale-[1.01] active:scale-[0.99] text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-500/25 transition-all duration-500 flex items-center justify-between disabled:opacity-50 mt-4"
            >
              <span className="font-mono text-xs opacity-75 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                <Terminal className="w-3.5 h-3.5" />
              </span>
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          {/* Bottom Create Account Link */}
          <div className="mt-8 text-center text-xs text-slate-600 dark:text-slate-400 w-full">
            Don't have an account?{' '}
            <Link 
              to="/register" 
              state={{ from: fromLocation }}
              className="font-semibold text-slate-900 dark:text-blue-400 hover:text-blue-600 transition inline-flex items-center gap-1 ml-1"
            >
              <span>Create an account</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
};
