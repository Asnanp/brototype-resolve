import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Zap, BarChart3, MessageSquare, Clock, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated gradient orbs */}
      <div className="orb w-96 h-96 bg-primary -top-48 -left-48" style={{ animationDelay: '0s' }} />
      <div className="orb w-96 h-96 bg-primary-glow top-1/3 -right-48" style={{ animationDelay: '4s' }} />
      <div className="orb w-80 h-80 bg-accent bottom-0 left-1/3" style={{ animationDelay: '8s' }} />

      {/* Navigation */}
      <nav className="glass-strong sticky top-0 z-50 border-b border-border/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold gradient-text">Brototype CMS</span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/login">
                <Button variant="ghost" className="hover:bg-secondary/50">
                  Login
                </Button>
              </Link>
              <Link to="/register">
                <Button className="bg-gradient-to-r from-primary to-primary-glow hover:opacity-90 transition-all glow">
                  Get Started
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 pt-20 pb-32 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in">
          <div className="inline-block px-4 py-2 glass rounded-full mb-4">
            <span className="text-sm text-muted-foreground">Enterprise-Grade Complaint Management</span>
          </div>
          
          <h1 className="text-6xl md:text-7xl font-bold leading-tight">
            Manage Student
            <br />
            <span className="gradient-text">Complaints Effortlessly</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Advanced ticketing system with real-time notifications, analytics dashboard, and multi-role access control. Built for Brototype educational excellence.
          </p>

          <div className="flex items-center justify-center gap-4 pt-4">
            <Link to="/register">
              <Button size="lg" className="bg-gradient-to-r from-primary to-primary-glow hover:opacity-90 text-lg px-8 py-6 glow hover-lift">
                Start Free Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link to="/about">
              <Button size="lg" variant="outline" className="glass border-border/50 text-lg px-8 py-6 hover-lift">
                Learn More
              </Button>
            </Link>
          </div>

          <div className="flex items-center justify-center gap-8 pt-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-success" />
              <span>Real-time Updates</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-success" />
              <span>Advanced Analytics</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-success" />
              <span>SLA Tracking</span>
            </div>
          </div>
        </div>

        {/* Hero Image/Dashboard Preview */}
        <div className="max-w-6xl mx-auto mt-20 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="glass-strong rounded-3xl p-2 glow">
            <div className="aspect-video rounded-2xl bg-gradient-to-br from-secondary via-secondary to-muted flex items-center justify-center border border-border/30">
              <div className="text-center space-y-4">
                <BarChart3 className="w-20 h-20 mx-auto text-primary/50" />
                <p className="text-muted-foreground">Dashboard Preview Coming Soon</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-6 py-32 relative z-10">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold">
            Powerful Features for
            <span className="gradient-text"> Modern Support</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to manage complaints efficiently and keep students satisfied
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="glass-strong p-8 rounded-2xl hover-lift group cursor-pointer animate-scale-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <feature.icon className="w-7 h-7 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-6 py-32 relative z-10">
        <div className="glass-strong rounded-3xl p-16 text-center">
          <div className="grid md:grid-cols-3 gap-12">
            {stats.map((stat, index) => (
              <div key={index} className="space-y-2">
                <div className="text-5xl font-bold gradient-text">{stat.value}</div>
                <div className="text-muted-foreground text-lg">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-32 relative z-10">
        <div className="glass-strong rounded-3xl p-16 text-center space-y-6 glow">
          <h2 className="text-4xl md:text-5xl font-bold">
            Ready to Transform Your
            <br />
            <span className="gradient-text">Support System?</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Join Brototype in delivering exceptional student support with our enterprise-grade complaint management platform.
          </p>
          <div className="pt-4">
            <Link to="/register">
              <Button size="lg" className="bg-gradient-to-r from-primary to-primary-glow hover:opacity-90 text-lg px-8 py-6 glow hover-lift">
                Get Started Now
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="glass-strong border-t border-border/50 mt-32">
        <div className="container mx-auto px-6 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="font-bold gradient-text">Brototype CMS</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Enterprise complaint management for modern education.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/about" className="hover:text-foreground transition-colors">About</Link></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Pricing</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Help Center</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-border/50 text-center text-sm text-muted-foreground">
            © 2024 Brototype CMS. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

const features = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Real-time updates and notifications ensure instant response to student complaints and feedback."
  },
  {
    icon: Shield,
    title: "Role-Based Access",
    description: "Secure multi-role system with student, staff, and admin access levels for complete control."
  },
  {
    icon: BarChart3,
    title: "Advanced Analytics",
    description: "Comprehensive dashboards with insights on response times, resolution rates, and trends."
  },
  {
    icon: MessageSquare,
    title: "Smart Communication",
    description: "Internal notes, public comments, and canned responses for efficient team collaboration."
  },
  {
    icon: Clock,
    title: "SLA Management",
    description: "Track response and resolution deadlines with automated breach alerts and escalations."
  },
  {
    icon: CheckCircle2,
    title: "Complete Tracking",
    description: "Full audit trail with activity logs, status history, and complaint lifecycle management."
  }
];

const stats = [
  { value: "99.9%", label: "Uptime Guarantee" },
  { value: "<2min", label: "Average Response" },
  { value: "24/7", label: "Support Available" }
];

export default Index;
