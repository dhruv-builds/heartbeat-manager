import { useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { Chrome, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import heroCinematic from '@/assets/hero-cinematic.png';

const words = ['Build', 'better.', 'Waste', 'nothing.'];

export default function HeroKinetic() {
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 200]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, reduce ? 1 : 0.9]);

  return (
    <section ref={ref} className="relative min-h-[100vh] flex items-center overflow-hidden pt-24">
      {/* Animated gradient mesh */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={reduce ? {} : { backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        style={{
          background: 'radial-gradient(at 20% 30%, hsl(340 100% 71% / 0.18) 0px, transparent 50%), radial-gradient(at 80% 20%, hsl(280 100% 65% / 0.15) 0px, transparent 50%), radial-gradient(at 40% 80%, hsl(28 100% 63% / 0.12) 0px, transparent 50%)',
          backgroundSize: '200% 200%',
        }}
      />

      <motion.div style={{ y, opacity, scale }} className="relative z-10 max-w-6xl mx-auto px-6 grid lg:grid-cols-[1.1fr_1fr] gap-12 items-center">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card/50 backdrop-blur-sm text-xs font-medium text-muted-foreground mb-8"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--brand-pink))] animate-pulse" />
            Chrome Extension for Lovable builders
          </motion.div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight mb-8">
            {words.map((word, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 30, rotateX: -40 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ delay: 0.2 + i * 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className={`inline-block mr-4 ${i >= 2 ? 'gradient-brand-text' : ''}`}
              >
                {word}
              </motion.span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="text-lg lg:text-xl text-muted-foreground max-w-lg mb-10 leading-relaxed"
          >
            Your sidekick for Lovable. Capture ideas the moment they hit, let AI craft the perfect prompt, and inject straight into Lovable — without leaving the tab.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85, duration: 0.6 }}
            className="flex flex-col sm:flex-row items-start gap-4"
          >
            <a
              href="https://chrome.google.com/webstore"
              target="_blank"
              rel="noopener noreferrer"
              className="gradient-button px-7 py-3.5 rounded-xl font-semibold flex items-center gap-2.5 group"
            >
              <Chrome size={20} />
              Get the Extension
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </a>
            <button
              onClick={() => navigate('/auth')}
              className="px-7 py-3.5 rounded-xl font-medium border border-border hover:bg-accent transition-colors"
            >
              Open Dashboard
            </button>
          </motion.div>
        </div>

        {/* Floating tilted product card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, rotate: -3 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ delay: 0.4, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="relative hidden lg:block"
        >
          <motion.div
            animate={reduce ? {} : { y: [0, -12, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            className="relative rounded-2xl overflow-hidden border border-border shadow-2xl"
            style={{ transform: 'perspective(1000px) rotateY(-8deg) rotateX(4deg)' }}
          >
            <img src={heroCinematic} alt="LovaLog extension preview" className="w-full" />
          </motion.div>
          {/* Floating accent shapes */}
          <motion.div
            animate={reduce ? {} : { y: [0, 15, 0], rotate: [0, 8, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-8 -right-4 w-20 h-20 rounded-2xl gradient-brand opacity-70 blur-sm"
          />
          <motion.div
            animate={reduce ? {} : { y: [0, -10, 0], rotate: [0, -6, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            className="absolute -bottom-6 -left-8 w-16 h-16 rounded-full bg-[hsl(var(--brand-orange))] opacity-50 blur-sm"
          />
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-xs text-muted-foreground flex flex-col items-center gap-2"
      >
        <span className="uppercase tracking-widest">Scroll</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-px h-8 bg-gradient-to-b from-muted-foreground to-transparent"
        />
      </motion.div>
    </section>
  );
}