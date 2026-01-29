import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { GradientLogo } from '@/components/ui/GradientLogo';
import { Button } from '@/components/ui/button';
import { 
  Sparkles, 
  Syringe, 
  FolderKanban, 
  Gauge, 
  Flame, 
  Brain, 
  Clock,
  Chrome,
  ExternalLink
} from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();
  const [showStickyCta, setShowStickyCta] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowStickyCta(!entry.isIntersecting);
      },
      { threshold: 0 }
    );

    if (heroRef.current) {
      observer.observe(heroRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const painPoints = [
    {
      icon: Flame,
      title: 'Bad Prompts Burn Budget',
      description: 'Vague prompts lead to bad builds and wasted credits. Every retry costs you.',
    },
    {
      icon: Brain,
      title: 'Context Switching Kills Flow',
      description: 'You forget great ideas when bouncing between projects. Your backlog is scattered.',
    },
    {
      icon: Clock,
      title: 'Use It or Lose It',
      description: 'Daily credits expire at midnight. Monitor them instantly so you never waste a single one.',
    },
  ];

  const features = [
    {
      icon: Sparkles,
      title: 'AI Prompt Engineer',
      description: 'Turn screenshots and ideas into code-ready prompts with one click.',
    },
    {
      icon: Syringe,
      title: 'Smart Injection',
      description: 'One-click inject prompts directly into Lovable. Chrome Extension only.',
    },
    {
      icon: FolderKanban,
      title: 'Project-Aware Backlog',
      description: 'Auto-detects your active Lovable project. Organize features per-project.',
    },
    {
      icon: Gauge,
      title: 'Credit Monitor',
      description: 'Real-time credit status in your browser toolbar. Never miss expiring credits.',
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <GradientLogo size="sm" />
          
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/auth')}
              className="text-muted-foreground hover:text-foreground"
            >
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

      {/* Hero Section */}
      <section ref={heroRef} className="pt-32 pb-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-8">
            <GradientLogo size="xl" showText={false} />
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
            Build Better Lovable Apps.
            <br />
            <span className="gradient-brand-text">Spend Fewer Credits.</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            The all-in-one Chrome Extension for backlog management, AI prompt engineering, 
            and smart credit monitoring.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="https://chrome.google.com/webstore"
              target="_blank"
              rel="noopener noreferrer"
              className="gradient-button px-8 py-3 rounded-lg font-semibold text-lg flex items-center gap-2 w-full sm:w-auto justify-center"
            >
              <Chrome size={20} />
              Get the Chrome Extension
            </a>
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => navigate('/auth')}
              className="border-border hover:bg-accent w-full sm:w-auto"
            >
              Login / Go to Dashboard
              <ExternalLink size={16} className="ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Pain Points Section */}
      <section className="py-20 px-4 sm:px-6 bg-card/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
            Stop Wasting Your <span className="gradient-brand-text">Lovable Credits</span>
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Every Lovable builder faces these challenges. LovaLog solves them all.
          </p>
          
          <div className="grid md:grid-cols-3 gap-6">
            {painPoints.map((item, index) => (
              <div 
                key={index}
                className="bg-card border border-border rounded-xl p-6 hover:border-brand-purple/50 transition-colors"
              >
                <div className="w-12 h-12 gradient-brand rounded-lg flex items-center justify-center mb-4">
                  <item.icon size={24} className="text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
            Everything You Need to <span className="gradient-brand-text">Ship Faster</span>
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            LovaLog is built specifically for Lovable builders. Every feature is designed to save you time and credits.
          </p>
          
          <div className="grid sm:grid-cols-2 gap-6">
            {features.map((item, index) => (
              <div 
                key={index}
                className="bg-card border border-border rounded-xl p-6 hover:border-brand-purple/50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 gradient-brand rounded-lg flex items-center justify-center flex-shrink-0">
                    <item.icon size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                    <p className="text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 bg-card/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to Build <span className="gradient-brand-text">Better</span>?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Join thousands of Lovable builders who are shipping faster and spending fewer credits.
          </p>
          <a
            href="https://chrome.google.com/webstore"
            target="_blank"
            rel="noopener noreferrer"
            className="gradient-button px-8 py-3 rounded-lg font-semibold text-lg inline-flex items-center gap-2"
          >
            <Chrome size={20} />
            Get the Chrome Extension — It's Free
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 border-t border-border">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <GradientLogo size="sm" showText={false} />
            <span className="text-sm text-muted-foreground">© 2026 LovaLog</span>
          </div>
          
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              Support
            </a>
          </div>
        </div>
      </footer>

      {/* Sticky CTA Banner */}
      {showStickyCta && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/95 backdrop-blur-sm border-t border-border animate-in slide-in-from-bottom-4 duration-300">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            <span className="text-foreground font-medium hidden sm:block">
              Ready to build better Lovable apps?
            </span>
            <a
              href="https://chrome.google.com/webstore"
              target="_blank"
              rel="noopener noreferrer"
              className="gradient-button px-6 py-2 rounded-lg font-semibold flex items-center gap-2 w-full sm:w-auto justify-center"
            >
              <Chrome size={18} />
              Get the Chrome Extension
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
