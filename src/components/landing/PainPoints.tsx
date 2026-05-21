import { motion } from 'framer-motion';
import { Flame, Brain, Clock } from 'lucide-react';

const items = [
  { icon: Flame, title: 'Vague prompts burn credits', desc: 'Every retry costs you. Stop paying for "I think I meant..."' },
  { icon: Brain, title: 'Ideas vanish between projects', desc: 'Great features lost to context switching. Capture them in one click.' },
  { icon: Clock, title: 'Credits expire at midnight', desc: 'Daily credits gone if unused. We surface the count, always.' },
];

export default function PainPoints() {
  return (
    <section className="py-32 px-6 relative border-t border-border">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-3">The problem</p>
          <h2 className="text-3xl md:text-5xl font-bold leading-tight max-w-3xl">
            Building with AI shouldn't feel like <span className="gradient-brand-text">lighting money on fire</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {items.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              whileHover={{ y: -6 }}
              className="group relative p-8 rounded-2xl border border-border bg-card/40 backdrop-blur-sm overflow-hidden"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 gradient-brand" style={{ mixBlendMode: 'overlay' }} />
              <motion.div
                animate={i === 0 ? { rotate: [-2, 2, -2] } : i === 1 ? { scale: [1, 1.08, 1] } : { rotate: [0, 360] }}
                transition={{ duration: i === 2 ? 8 : 3, repeat: Infinity, ease: i === 2 ? 'linear' : 'easeInOut' }}
                className="w-14 h-14 rounded-xl gradient-brand flex items-center justify-center text-white mb-6 relative"
              >
                <item.icon size={24} />
              </motion.div>
              <h3 className="text-xl font-semibold mb-3 relative">{item.title}</h3>
              <p className="text-muted-foreground leading-relaxed relative">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}