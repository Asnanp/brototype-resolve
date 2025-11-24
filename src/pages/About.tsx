import { Button } from "@/components/ui/button";
import { Shield, Users, Target, Award } from "lucide-react";
import { Link } from "react-router-dom";

const About = () => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated gradient orbs */}
      <div className="orb w-96 h-96 bg-primary top-0 right-0" style={{ animationDelay: '2s' }} />
      <div className="orb w-80 h-80 bg-primary-glow bottom-1/4 left-0" style={{ animationDelay: '6s' }} />

      {/* Navigation */}
      <nav className="glass-strong sticky top-0 z-50 border-b border-border/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold gradient-text">Brototype CMS</span>
            </Link>
            <Link to="/">
              <Button variant="ghost" className="hover:bg-secondary/50">
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 pt-20 pb-16 relative z-10">
        <div className="max-w-3xl mx-auto text-center space-y-6 animate-fade-in">
          <h1 className="text-5xl md:text-6xl font-bold">
            About <span className="gradient-text">Brototype CMS</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Building the future of educational complaint management with cutting-edge technology and user-centric design.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="container mx-auto px-6 py-16 relative z-10">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 animate-slide-up">
            <div className="inline-block px-4 py-2 glass rounded-full">
              <span className="text-sm text-muted-foreground">Our Mission</span>
            </div>
            <h2 className="text-4xl font-bold">
              Empowering Educational
              <br />
              <span className="gradient-text">Excellence</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed text-lg">
              At Brototype CMS, we're dedicated to revolutionizing how educational institutions handle student feedback and complaints. Our platform combines advanced technology with intuitive design to create a seamless support experience.
            </p>
            <p className="text-muted-foreground leading-relaxed text-lg">
              We believe that every student voice matters, and our mission is to ensure that no concern goes unheard or unresolved.
            </p>
          </div>
          <div className="glass-strong p-8 rounded-3xl glow">
            <div className="grid grid-cols-2 gap-6">
              {values.map((value, index) => (
                <div key={index} className="space-y-3 text-center">
                  <div className="w-14 h-14 mx-auto rounded-xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
                    <value.icon className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <h3 className="font-semibold">{value.title}</h3>
                  <p className="text-sm text-muted-foreground">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="container mx-auto px-6 py-16 relative z-10">
        <div className="text-center mb-12 space-y-4">
          <h2 className="text-4xl font-bold">
            Built by <span className="gradient-text">Experts</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Our team combines years of experience in education technology and enterprise software development
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-16 relative z-10">
        <div className="glass-strong rounded-3xl p-12 text-center space-y-6 glow">
          <h2 className="text-3xl md:text-4xl font-bold">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Join us in transforming student support at Brototype
          </p>
          <Link to="/register">
            <Button size="lg" className="bg-gradient-to-r from-primary to-primary-glow hover:opacity-90 glow">
              Create Your Account
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="glass-strong border-t border-border/50 mt-16">
        <div className="container mx-auto px-6 py-8 text-center text-sm text-muted-foreground">
          © 2024 Brototype CMS. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

const values = [
  {
    icon: Shield,
    title: "Security First",
    description: "Enterprise-grade protection for all data"
  },
  {
    icon: Users,
    title: "User-Centric",
    description: "Designed with students and staff in mind"
  },
  {
    icon: Target,
    title: "Goal-Driven",
    description: "Focused on resolution and satisfaction"
  },
  {
    icon: Award,
    title: "Excellence",
    description: "Committed to highest quality standards"
  }
];

export default About;
