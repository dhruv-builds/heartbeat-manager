import { useNavigate } from 'react-router-dom';
import { GradientLogo } from '@/components/ui/GradientLogo';
import { Button } from '@/components/ui/button';
import { Chrome } from 'lucide-react';
import HeroKinetic from '@/components/landing/HeroKinetic';
import ScrollytellingHow from '@/components/landing/ScrollytellingHow';
import PainPoints from '@/components/landing/PainPoints';
import BentoFeatures from '@/components/landing/BentoFeatures';
import CreditCounter from '@/components/landing/CreditCounter';
import MagneticCTA from '@/components/landing/MagneticCTA';

export default function LandingPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-x-hidden">
      <div className="noise-overlay" />

      <nav className="fixed top-0 left-0 right-0 z-40 bg-background/70 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <GradientLogo size="sm" />
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate('/auth')} className="text-muted-foreground hover:text-foreground">
              Login
            </Button>
            <a
              href="https://chrome.google.com/webstore"
              target="_blank"
              rel="noopener noreferrer"
              className="gradient-button px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2"
            >
              <Chrome size={16} />
              <span className="hidden sm:inline">Get Extension</span>
            </a>
          </div>
        </div>
      </nav>

      <main>
        <HeroKinetic />
        <ScrollytellingHow />
        <PainPoints />
        <BentoFeatures />
        <CreditCounter />
        <MagneticCTA />
      </main>

      <footer className="py-10 px-6 border-t border-border relative">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <GradientLogo size="sm" showText={false} />
            <span className="text-sm text-muted-foreground">© 2026 LovaLog</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-foreground transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}