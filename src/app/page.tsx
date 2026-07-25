import Link from "next/link";
import { Film, Play, Zap, Bot, ArrowRight, ShieldCheck, Video, Workflow, Send, FileText, Mic, PenTool, Edit3, Image as ImageIcon, MonitorPlay, Share2 } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans selection:bg-purple-500/30">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between border-b border-white/5 bg-[#0a0a0a]/80 px-6 py-4 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-fuchsia-600 to-purple-600 text-white shadow-lg shadow-purple-500/20">
            <Film size={18} />
          </div>
          <span className="font-bold tracking-tight text-white">AI Film Studio</span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
          <Link href="#features" className="hover:text-white transition-colors">Features</Link>
          <Link href="#workflows" className="hover:text-white transition-colors">Workflows</Link>
          <Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-full px-5 py-2 text-sm font-medium text-zinc-300 transition hover:text-white"
          >
            Sign In
          </Link>
          <Link
            href="/login"
            className="rounded-full bg-gradient-to-r from-purple-600 to-blue-600 px-5 py-2 text-sm font-medium text-white transition hover:opacity-90 shadow-lg shadow-purple-500/20"
          >
            Sign Up
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative pt-24 lg:pt-32 pb-12 lg:pb-16 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/4 -z-10 h-[600px] w-[600px] -translate-x-1/2 bg-fuchsia-600/20 opacity-50 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-20 right-1/4 -z-10 h-[500px] w-[500px] translate-x-1/4 bg-cyan-600/20 opacity-40 blur-[120px] rounded-full pointer-events-none" />

        <div className="container mx-auto px-4 text-center">
          <h1 className="mx-auto max-w-4xl text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl leading-[1.1]">
            <span className="bg-gradient-to-r from-fuchsia-500 to-purple-500 bg-clip-text text-transparent">Produce AI Films</span>
            <br />
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">with Visual Scripting</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-zinc-400">
            Design autonomous AI agent pipelines to write, review, and render video content on a node-based canvas.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="group flex items-center gap-2 rounded-full bg-purple-600 px-8 py-3.5 text-base font-medium text-white shadow-[0_0_30px_rgba(168,85,247,0.4)] transition-all hover:bg-purple-500 hover:scale-105 hover:shadow-[0_0_40px_rgba(168,85,247,0.6)]"
            >
              Open Studio
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <a
              href="#demo"
              className="group flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900/50 px-8 py-4 text-base font-medium text-zinc-300 transition-all hover:bg-zinc-800 hover:text-white"
            >
              <Play size={16} className="fill-zinc-400 group-hover:fill-white transition-colors" />
              Watch Demo
            </a>
          </div>

          {/* Node Canvas Graphic */}
          <div className="mx-auto mt-10 sm:mt-12 max-w-5xl overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/80 shadow-2xl shadow-black/80 backdrop-blur-md p-1">
            <div className="relative h-[350px] w-full rounded-xl bg-[#0c0c0c] overflow-hidden border border-zinc-800/50">
              {/* Dot Grid Background */}
              <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.03]"></div>

              {/* Flow Lines */}
              <svg className="absolute inset-0 h-full w-full pointer-events-none" style={{ zIndex: 0 }}>
                {/* Left side (Magenta) */}
                <path d="M 120 60 L 250 160 L 350 110 L 500 185" stroke="url(#magentaGrad)" strokeWidth="3" fill="none" className="opacity-80" />
                <path d="M 120 280 L 250 160" stroke="url(#magentaGrad)" strokeWidth="3" fill="none" className="opacity-80" />

                {/* Right side (Cyan) */}
                <path d="M 500 185 L 650 60 L 800 110 L 880 185" stroke="url(#cyanGrad)" strokeWidth="3" fill="none" className="opacity-80" />
                <path d="M 500 185 L 650 280 L 800 240 L 880 185" stroke="url(#cyanGrad)" strokeWidth="3" fill="none" className="opacity-80" />

                <defs>
                  <linearGradient id="magentaGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#d946ef" stopOpacity="0.2" />
                    <stop offset="50%" stopColor="#d946ef" stopOpacity="1" />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity="1" />
                  </linearGradient>
                  <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity="1" />
                    <stop offset="50%" stopColor="#06b6d4" stopOpacity="1" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.2" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Nodes */}
              {/* Left Cluster */}
              <div className="absolute top-[40px] left-[80px] flex items-center gap-2 rounded-lg border border-fuchsia-500/30 bg-zinc-900/90 p-3 shadow-[0_0_15px_rgba(217,70,239,0.15)] backdrop-blur-md">
                <FileText size={16} className="text-fuchsia-400" /><span className="text-sm font-medium text-zinc-200">Script</span>
              </div>
              <div className="absolute top-[260px] left-[80px] flex items-center gap-2 rounded-lg border border-fuchsia-500/30 bg-zinc-900/90 p-3 shadow-[0_0_15px_rgba(217,70,239,0.15)] backdrop-blur-md">
                <Mic size={16} className="text-fuchsia-400" /><span className="text-sm font-medium text-zinc-200">Voice</span>
              </div>
              <div className="absolute top-[140px] left-[200px] flex items-center gap-2 rounded-lg border border-fuchsia-500/50 bg-zinc-900/90 p-3 shadow-[0_0_20px_rgba(217,70,239,0.2)] backdrop-blur-md">
                <Bot size={16} className="text-fuchsia-400" /><span className="text-sm font-medium text-zinc-200">Producer</span>
              </div>
              <div className="absolute top-[90px] left-[320px] flex items-center gap-2 rounded-lg border border-purple-500/50 bg-zinc-900/90 p-3 shadow-[0_0_20px_rgba(168,85,247,0.2)] backdrop-blur-md">
                <PenTool size={16} className="text-purple-400" /><span className="text-sm font-medium text-zinc-200">Writer</span>
              </div>

              {/* Center Hub */}
              <div className="absolute top-[160px] left-[450px] flex items-center gap-3 rounded-xl border border-indigo-500/60 bg-zinc-900/95 p-4 shadow-[0_0_30px_rgba(99,102,241,0.3)] backdrop-blur-md scale-110">
                <Workflow size={20} className="text-indigo-400" /><span className="text-base font-bold text-white">Pipeline Core</span>
              </div>

              {/* Right Cluster */}
              <div className="absolute top-[40px] left-[610px] flex items-center gap-2 rounded-lg border border-cyan-500/40 bg-zinc-900/90 p-3 shadow-[0_0_15px_rgba(6,182,212,0.15)] backdrop-blur-md">
                <ImageIcon size={16} className="text-cyan-400" /><span className="text-sm font-medium text-zinc-200">Storyboarding</span>
              </div>
              <div className="absolute top-[260px] left-[610px] flex items-center gap-2 rounded-lg border border-cyan-500/40 bg-zinc-900/90 p-3 shadow-[0_0_15px_rgba(6,182,212,0.15)] backdrop-blur-md">
                <Zap size={16} className="text-cyan-400" /><span className="text-sm font-medium text-zinc-200">VFX</span>
              </div>
              <div className="absolute top-[90px] left-[760px] flex items-center gap-2 rounded-lg border border-blue-500/40 bg-zinc-900/90 p-3 shadow-[0_0_15px_rgba(59,130,246,0.15)] backdrop-blur-md">
                <Edit3 size={16} className="text-blue-400" /><span className="text-sm font-medium text-zinc-200">Editing</span>
              </div>
              <div className="absolute top-[220px] left-[760px] flex items-center gap-2 rounded-lg border border-blue-500/40 bg-zinc-900/90 p-3 shadow-[0_0_15px_rgba(59,130,246,0.15)] backdrop-blur-md">
                <Video size={16} className="text-blue-400" /><span className="text-sm font-medium text-zinc-200">Render</span>
              </div>

              <div className="absolute top-[165px] left-[850px] flex items-center gap-2 rounded-lg border border-indigo-500/50 bg-indigo-600/20 p-3 shadow-[0_0_20px_rgba(99,102,241,0.25)] backdrop-blur-md">
                <Share2 size={16} className="text-indigo-400" /><span className="text-sm font-bold text-white">Distribution</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Trusted By Section
      <section className="py-12 border-b border-zinc-800/50 bg-zinc-950/50">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm font-semibold tracking-wider text-zinc-500 uppercase mb-8">Trusted By Innovative Creators At</p>
          <div className="flex flex-wrap justify-center items-center gap-12 sm:gap-20 opacity-50 grayscale">
            {/* Simulating logos with text for the demo */}
      {/* <span className="text-2xl font-bold tracking-tighter">Microsoft</span>
            <span className="text-2xl font-bold tracking-tight">Spotify</span>
            <span className="text-2xl font-black tracking-tighter">Netflix</span>
            <span className="text-2xl font-bold tracking-tight">YouTube</span>
            <span className="text-3xl font-serif font-bold">B B C</span>
          </div>
        </div>
      </section> */}

      {/* Features Section */}
      <section id="features" className="py-24 bg-[#0a0a0a]">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-white">Engineered for Creators</h2>
            <p className="mt-4 text-zinc-400">Everything you need to automate your video production pipeline.</p>
          </div>

          <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
            <div className="group rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 transition-all hover:bg-zinc-900 hover:border-fuchsia-500/30 hover:shadow-[0_0_30px_rgba(217,70,239,0.05)]">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-fuchsia-500/10 text-fuchsia-400 group-hover:scale-110 transition-transform">
                <Workflow size={28} />
              </div>
              <h3 className="mb-3 text-xl font-semibold text-zinc-100">Visual Scripting</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Connect nodes to build custom AI pipelines for different niches without code.
              </p>
            </div>
            <div className="group rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 transition-all hover:bg-zinc-900 hover:border-purple-500/30 hover:shadow-[0_0_30px_rgba(168,85,247,0.05)]">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">
                <Bot size={28} />
              </div>
              <h3 className="mb-3 text-xl font-semibold text-zinc-100">Autonomous Agents</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Automate your video production pipeline with self-operating AI teams.
              </p>
            </div>
            <div className="group rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 transition-all hover:bg-zinc-900 hover:border-cyan-500/30 hover:shadow-[0_0_30px_rgba(6,182,212,0.05)]">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 group-hover:scale-110 transition-transform">
                <MonitorPlay size={28} />
              </div>
              <h3 className="mb-3 text-xl font-semibold text-zinc-100">Multi-Modal Rendering</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Render stunning videos with diverse styles, integrating audio, image, and motion seamlessly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Quotas Section */}
      <section className="py-24 border-t border-zinc-800/50 bg-zinc-950">
        <div className="container mx-auto px-4 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-900 border border-zinc-700/50 text-zinc-400 shadow-inner">
            <ShieldCheck size={32} />
          </div>
          <h2 className="text-3xl font-bold tracking-tight mb-4 text-white">Production Quotas & Limits</h2>
          <p className="mt-2 text-zinc-400 max-w-2xl mx-auto mb-12">
            To ensure fair usage of the Wan Video Engine and Qwen models during the demo, the following limits are enforced per pipeline run.
          </p>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto text-left">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-5 hover:border-zinc-700 transition-colors">
              <div className="text-3xl font-bold text-white mb-1">5 <span className="text-base font-normal text-zinc-500">USD</span></div>
              <div className="text-sm font-medium text-zinc-300">Daily API Credit Limit</div>
              <div className="text-xs text-zinc-500 mt-2">Hard limit to prevent abuse on DashScope.</div>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-5 hover:border-zinc-700 transition-colors">
              <div className="text-3xl font-bold text-white mb-1">30 <span className="text-base font-normal text-zinc-500">Nodes</span></div>
              <div className="text-sm font-medium text-zinc-300">Max Executions per Run</div>
              <div className="text-xs text-zinc-500 mt-2">Prevents infinite review loops.</div>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-5 hover:border-zinc-700 transition-colors">
              <div className="text-3xl font-bold text-white mb-1">5 <span className="text-base font-normal text-zinc-500">Calls</span></div>
              <div className="text-sm font-medium text-zinc-300">Max Media Generations</div>
              <div className="text-xs text-zinc-500 mt-2">Maximum video/image generations per pipeline.</div>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-5 hover:border-zinc-700 transition-colors">
              <div className="text-3xl font-bold text-white mb-1">30 <span className="text-base font-normal text-zinc-500">Sec</span></div>
              <div className="text-sm font-medium text-zinc-300">Max Video Duration</div>
              <div className="text-xs text-zinc-500 mt-2">Supported rendering options: 5s, 15s, or 30s.</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-12 text-center text-zinc-600 bg-[#0a0a0a]">
        <p className="text-sm">Built for Alibaba Cloud Model Studio.</p>
      </footer>
    </div>
  );
}
