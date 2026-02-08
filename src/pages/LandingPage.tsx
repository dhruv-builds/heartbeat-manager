import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { GradientLogo } from '@/components/ui/GradientLogo';
import { Button } from '@/components/ui/button';
import { Sparkles, Syringe, FolderKanban, Gauge, Flame, Brain, Clock, Chrome, ExternalLink } from 'lucide-react';
import heroCinematic from '@/assets/hero-cinematic.png';
export default function LandingPage() {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  const painPoints = [{
    icon: Flame,
    title: 'Vague prompts, wasted credits',
    description: 'Unclear instructions lead to bad builds. Every retry costs you.'
  }, {
    icon: Brain,
    title: 'Ideas lost between projects',
    description: "Great ideas slip away when you're bouncing between projects."
  }, {
    icon: Clock,
    title: 'Credits that expire at midnight',
    description: "Daily credits vanish if you don't use them. Stay on top of it."
  }];
  const features = [{
    icon: Sparkles,
    title: 'AI Prompt Engineer',
    description: 'Turn screenshots and ideas into code-ready prompts with one click.'
  }, {
    icon: Syringe,
    title: 'Smart Injection',
    description: 'One-click inject prompts directly into Lovable. Chrome Extension only.'
  }, {
    icon: FolderKanban,
    title: 'Project-Aware Backlog',
    description: 'Auto-detects your active Lovable project. Organize features per-project.'
  }, {
    icon: Gauge,
    title: 'Credit Monitor',
    description: 'Real-time credit status in your browser toolbar. Never miss expiring credits.'
  }];
  return <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Noise Overlay */}
      <div className="noise-overlay" />
      
      {/* Decorative Gradient Blobs */}
      <div className="absolute -top-48 -left-48 w-[500px] h-[500px] rounded-full bg-[hsl(340,100%,71%)] blur-[150px] opacity-[0.12] pointer-events-none" />
      <div className="absolute top-1/3 -right-64 w-[600px] h-[600px] rounded-full bg-[hsl(280,100%,65%)] blur-[180px] opacity-[0.08] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full bg-[hsl(28,100%,63%)] blur-[140px] opacity-[0.06] pointer-events-none" />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <GradientLogo size="sm" />
          
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate('/auth')} className="text-muted-foreground hover:text-foreground">
              Login
            </Button>
            <a href="https://chrome.google.com/webstore" target="_blank" rel="noopener noreferrer" className="gradient-button px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2">
              <Chrome size={16} />
              <span className="hidden sm:inline">Get Extension</span>
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section - Cinematic Full-Width */}
      <section ref={heroRef} className="relative min-h-[80vh] lg:min-h-[85vh] overflow-hidden">
        {/* Desktop: Background Image with Gradient Overlay */}
        <div className="hidden lg:block absolute inset-0">
          <img src={heroCinematic} alt="LovaLog Chrome Extension" className="w-full h-full object-cover object-right" />
          {/* Gradient Overlay: solid dark left, transparent right */}
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent opacity-75" />
        </div>
        
        {/* Text Content - positioned left */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 pt-32 lg:pt-40 pb-16 lg:pb-24">
          <div className="max-w-xl">
            <h1 className="text-5xl lg:text-7xl font-bold mb-6 leading-[1.1] tracking-tight">
              Build better.
              <br />
              <span className="gradient-brand-text">Waste nothing.</span>
            </h1>
            
            <p className="text-lg lg:text-xl text-muted-foreground max-w-md mb-10 leading-relaxed">
              Your backlog sidekick for Lovable. Capture ideas, craft prompts, track credits—all from your browser.
            </p>
            
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <a href="https://chrome.google.com/webstore" target="_blank" rel="noopener noreferrer" className="gradient-button px-8 py-3.5 rounded-xl font-semibold text-base flex items-center gap-2.5">
                <Chrome size={20} />
                Get the Extension
              </a>
              <Button variant="outline" size="lg" onClick={() => navigate('/auth')} className="border-border hover:bg-accent rounded-xl h-[50px]">
                Go to Dashboard
                <ExternalLink size={16} className="ml-2" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Mobile: Image shown below text */}
        <div className="lg:hidden px-6 pb-12">
          <div className="relative drop-shadow-2xl">
            <img src={heroCinematic} alt="LovaLog Chrome Extension" className="w-full rounded-2xl" />
          </div>
        </div>
      </section>

      {/* Pain Points Section */}
      <section className="py-28 lg:py-32 px-6 relative z-10 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-4">
            Why LovaLog?
          </p>
          <h2 className="text-3xl lg:text-5xl font-bold mb-16 leading-[1.15]">
            The problems <span className="gradient-brand-text">we fix</span>
          </h2>
          
          <div className="space-y-12">
            {painPoints.map((item, index) => <div key={index} className="flex items-start gap-6 group">
                <div className="w-14 h-14 gradient-brand rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <item.icon size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-lg leading-relaxed max-w-lg">{item.description}</p>
                </div>
              </div>)}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-28 lg:py-32 px-6 relative z-10 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-4">
            Features
          </p>
          <h2 className="text-3xl lg:text-5xl font-bold mb-16 leading-[1.15]">
            What's <span className="gradient-brand-text">inside</span>
          </h2>
          
          <div className="grid md:grid-cols-2 gap-x-16 gap-y-12">
            {features.map((item, index) => <div key={index} className="flex items-start gap-5 group">
                <div className="w-12 h-12 gradient-brand rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <item.icon size={22} className="text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              </div>)}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-28 lg:py-32 px-6 relative z-10 border-t border-border">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl lg:text-5xl font-bold mb-6 leading-[1.15]">
            Start building <span className="gradient-brand-text">smarter</span>
          </h2>
          <p className="text-muted-foreground text-lg mb-10">
            It's free. It's fast. It works.
          </p>
          <a href="https://chrome.google.com/webstore" target="_blank" rel="noopener noreferrer" className="gradient-button px-10 py-4 rounded-xl font-semibold text-lg inline-flex items-center gap-3">
            <Chrome size={22} />
            Get the Chrome Extension
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-border relative z-10">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
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

    </div>;
}