import { useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { MessageSquare, Sparkles, Syringe } from 'lucide-react';

export default function ScrollytellingHow() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });

  // Phase opacity windows
  const p1 = useTransform(scrollYProgress, [0.05, 0.2, 0.33, 0.4], [0, 1, 1, 0]);
  const p2 = useTransform(scrollYProgress, [0.4, 0.5, 0.63, 0.7], [0, 1, 1, 0]);
  const p3 = useTransform(scrollYProgress, [0.7, 0.8, 0.95, 1], [0, 1, 1, 1]);

  // Capture bubble flight
  const bubbleX = useTransform(scrollYProgress, [0.1, 0.3], ['0%', '120%']);
  const bubbleScale = useTransform(scrollYProgress, [0.1, 0.25, 0.3], [1, 1.05, 0.8]);

  // Inject slide
  const injectX = useTransform(scrollYProgress, [0.75, 0.95], ['-100%', '0%']);

  return (
    <section ref={ref} className="relative" style={{ height: reduce ? 'auto' : '300vh' }}>
      <div className={reduce ? 'py-20 px-6' : 'sticky top-0 h-screen flex items-center overflow-hidden'}>
        <div className="max-w-6xl mx-auto px-6 w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-3">How it works</p>
            <h2 className="text-3xl md:text-5xl font-bold">From idea to <span className="gradient-brand-text">shipped</span> in three moves</h2>
          </motion.div>

          <div className="grid md:grid-cols-[1fr_1.2fr] gap-12 items-center">
            {/* Left: phase descriptions */}
            <div className="space-y-6">
              <PhaseCard opacity={p1} icon={<MessageSquare />} step="01" title="Capture" desc="Idea pops in your head while building? Drop it into the sidebar without breaking flow." />
              <PhaseCard opacity={p2} icon={<Sparkles />} step="02" title="Generate" desc="Click ✨ — AI reads your project context and writes a precise prompt for Lovable." />
              <PhaseCard opacity={p3} icon={<Syringe />} step="03" title="Inject" desc="One click. Your prompt lands in the Lovable chat, ready to ship." />
            </div>

            {/* Right: stage */}
            <div className="relative aspect-[4/3] rounded-2xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden">
              {/* Phase 1: idea bubble flies into sidebar */}
              <motion.div style={{ opacity: p1 }} className="absolute inset-0 p-6 flex items-center justify-center">
                <div className="w-full flex items-center gap-4">
                  <div className="flex-1 rounded-xl bg-background border border-border p-4 h-32 text-xs text-muted-foreground">Lovable chat...</div>
                  <motion.div style={{ x: bubbleX, scale: bubbleScale }} className="px-4 py-2 rounded-full gradient-brand text-white text-sm font-medium whitespace-nowrap shadow-lg">
                    💡 Add dark mode toggle
                  </motion.div>
                  <div className="w-32 rounded-xl bg-background border border-dashed border-border h-32 flex items-center justify-center text-xs text-muted-foreground">Backlog</div>
                </div>
              </motion.div>

              {/* Phase 2: AI types prompt */}
              <motion.div style={{ opacity: p2 }} className="absolute inset-0 p-6 flex items-center justify-center">
                <div className="w-full max-w-sm rounded-xl bg-background border border-border p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={14} className="text-[hsl(var(--brand-purple))]" />
                    <span className="text-xs font-medium">Generating...</span>
                  </div>
                  <TypingLines progress={scrollYProgress} />
                </div>
              </motion.div>

              {/* Phase 3: inject */}
              <motion.div style={{ opacity: p3 }} className="absolute inset-0 p-6 flex items-center justify-center">
                <div className="w-full relative">
                  <div className="rounded-xl bg-background border border-border p-4 h-32 text-xs text-muted-foreground">Lovable chat ready...</div>
                  <motion.div style={{ x: injectX }} className="absolute top-1/2 -translate-y-1/2 left-0 right-0 mx-4 px-4 py-3 rounded-lg gradient-brand text-white text-xs font-medium shadow-2xl">
                    Add a dark mode toggle in the header using next-themes...
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PhaseCard({ opacity, icon, step, title, desc }: { opacity: any; icon: React.ReactNode; step: string; title: string; desc: string }) {
  return (
    <motion.div style={{ opacity }} className="flex gap-4">
      <div className="flex-shrink-0 w-12 h-12 rounded-xl gradient-brand flex items-center justify-center text-white">{icon}</div>
      <div>
        <div className="text-xs text-muted-foreground font-mono mb-1">{step}</div>
        <h3 className="text-xl font-semibold mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  );
}

function TypingLines({ progress }: { progress: any }) {
  const w1 = useTransform(progress, [0.42, 0.5], ['0%', '100%']);
  const w2 = useTransform(progress, [0.48, 0.56], ['0%', '90%']);
  const w3 = useTransform(progress, [0.54, 0.62], ['0%', '75%']);
  return (
    <div className="space-y-2">
      <motion.div style={{ width: w1 }} className="h-2 rounded bg-foreground/80" />
      <motion.div style={{ width: w2 }} className="h-2 rounded bg-foreground/60" />
      <motion.div style={{ width: w3 }} className="h-2 rounded bg-foreground/40" />
    </div>
  );
}