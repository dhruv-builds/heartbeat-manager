import { motion } from 'framer-motion';
import { Sparkles, Syringe, FolderKanban, Gauge, Image as ImageIcon } from 'lucide-react';

export default function BentoFeatures() {
  return (
    <section className="py-32 px-6 relative border-t border-border">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-3">Features</p>
          <h2 className="text-3xl md:text-5xl font-bold leading-tight">
            Everything you need. <span className="gradient-brand-text">Nothing you don't.</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 md:grid-rows-2 gap-4 auto-rows-[180px]">
          {/* Big tile: AI Prompt Engineer */}
          <BentoTile className="md:col-span-2 md:row-span-2" delay={0}>
            <div className="flex flex-col h-full justify-between">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-12 h-12 rounded-xl gradient-brand flex items-center justify-center text-white"
                >
                  <Sparkles size={22} />
                </motion.div>
                <span className="text-xs font-mono text-muted-foreground">AI ENGINEER</span>
              </div>
              <div>
                <h3 className="text-3xl md:text-4xl font-bold mb-3">Prompts that actually <span className="gradient-brand-text">work</span></h3>
                <p className="text-muted-foreground max-w-md">Drop a screenshot, type the feature, hit ✨. Our AI reads your project context and crafts a precise development prompt.</p>
              </div>
            </div>
          </BentoTile>

          <BentoTile delay={0.1}>
            <Syringe size={22} className="text-[hsl(var(--brand-pink))] mb-3" />
            <h3 className="font-semibold mb-1">One-click inject</h3>
            <p className="text-sm text-muted-foreground">Right into Lovable chat.</p>
          </BentoTile>

          <BentoTile delay={0.2}>
            <FolderKanban size={22} className="text-[hsl(var(--brand-purple))] mb-3" />
            <h3 className="font-semibold mb-1">Project-aware</h3>
            <p className="text-sm text-muted-foreground">Auto-detects your active project.</p>
          </BentoTile>

          <BentoTile delay={0.3}>
            <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}>
              <Gauge size={22} className="text-[hsl(var(--brand-orange))] mb-3" />
            </motion.div>
            <h3 className="font-semibold mb-1">Credits monitor</h3>
            <p className="text-sm text-muted-foreground">Live count in toolbar.</p>
          </BentoTile>

          <BentoTile delay={0.4}>
            <ImageIcon size={22} className="text-[hsl(var(--brand-pink))] mb-3" />
            <h3 className="font-semibold mb-1">Visual references</h3>
            <p className="text-sm text-muted-foreground">Attach mockups & screenshots.</p>
          </BentoTile>
        </div>
      </div>
    </section>
  );
}

function BentoTile({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`group relative p-6 rounded-2xl border border-border bg-card/40 backdrop-blur-sm overflow-hidden hover:border-[hsl(var(--brand-purple)/0.4)] transition-colors ${className}`}
    >
      <div className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ background: 'linear-gradient(135deg, hsl(var(--brand-pink)/0.1), hsl(var(--brand-purple)/0.1), hsl(var(--brand-orange)/0.1))' }} />
      <div className="relative h-full">{children}</div>
    </motion.div>
  );
}