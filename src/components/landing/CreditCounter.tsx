import { useEffect, useRef, useState } from 'react';
import { motion, useInView, animate } from 'framer-motion';

export default function CreditCounter() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });
  const [wasted, setWasted] = useState(47);
  const [saved, setSaved] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const c1 = animate(47, 12, { duration: 2, ease: 'easeOut', onUpdate: (v) => setWasted(Math.round(v)) });
    const c2 = animate(0, 73, { duration: 2.2, ease: 'easeOut', onUpdate: (v) => setSaved(Math.round(v)) });
    return () => { c1.stop(); c2.stop(); };
  }, [inView]);

  return (
    <section ref={ref} className="py-32 px-6 relative border-t border-border">
      <div className="max-w-5xl mx-auto text-center">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-6"
        >
          The math
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-5xl font-bold mb-16 max-w-3xl mx-auto leading-tight"
        >
          Builders using LovaLog waste <span className="gradient-brand-text">73% fewer credits</span>
        </motion.h2>

        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          <div className="p-8 rounded-2xl border border-border bg-card/40">
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Before LovaLog</div>
            <div className="text-6xl md:text-7xl font-bold tabular-nums">{wasted}%</div>
            <div className="text-sm text-muted-foreground mt-2">credits wasted on retries</div>
          </div>
          <div className="p-8 rounded-2xl border border-[hsl(var(--brand-purple)/0.3)] bg-gradient-to-br from-[hsl(var(--brand-pink)/0.05)] to-[hsl(var(--brand-purple)/0.05)]">
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">With LovaLog</div>
            <div className="text-6xl md:text-7xl font-bold tabular-nums gradient-brand-text">{saved}%</div>
            <div className="text-sm text-muted-foreground mt-2">credits saved per project</div>
          </div>
        </div>
      </div>
    </section>
  );
}