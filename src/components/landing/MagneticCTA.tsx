import { useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Chrome, Sparkles } from 'lucide-react';

export default function MagneticCTA() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLAnchorElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const onMove = (e: React.MouseEvent) => {
    if (reduce || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const x = (e.clientX - (r.left + r.width / 2)) * 0.3;
    const y = (e.clientY - (r.top + r.height / 2)) * 0.3;
    setPos({ x, y });
  };
  const reset = () => setPos({ x: 0, y: 0 });

  return (
    <section className="py-32 px-6 relative border-t border-border overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-20 blur-[120px] gradient-brand" />
      </div>

      <div className="max-w-3xl mx-auto text-center relative">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl md:text-6xl font-bold mb-6 leading-tight"
        >
          Stop wasting credits.
          <br />
          <span className="gradient-brand-text">Start shipping faster.</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-muted-foreground text-lg mb-12"
        >
          Free Chrome extension. Two clicks to install.
        </motion.p>

        <motion.div
          onMouseMove={onMove}
          onMouseLeave={reset}
          className="inline-block"
          animate={{ x: pos.x, y: pos.y }}
          transition={{ type: 'spring', stiffness: 150, damping: 15 }}
        >
          <a
            ref={ref}
            href="https://chrome.google.com/webstore"
            target="_blank"
            rel="noopener noreferrer"
            className="gradient-button px-10 py-5 rounded-2xl font-semibold text-lg inline-flex items-center gap-3 shadow-2xl"
          >
            <Chrome size={24} />
            Get LovaLog Free
            <Sparkles size={20} />
          </a>
        </motion.div>
      </div>
    </section>
  );
}