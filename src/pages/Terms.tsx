import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import { Link } from "react-router-dom";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="orb w-96 h-96 bg-primary-glow bottom-0 left-0" style={{ animationDelay: '2s' }} />

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

      <section className="container mx-auto px-6 py-20 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 space-y-4 animate-fade-in">
            <h1 className="text-5xl font-bold">
              Terms of <span className="gradient-text">Service</span>
            </h1>
            <p className="text-muted-foreground">Last updated: January 2024</p>
          </div>

          <div className="glass-strong p-8 md:p-12 rounded-3xl space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing and using the Brototype Complaint Management System, you accept and agree to be bound by the terms and provision of this agreement.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Use License</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Permission is granted to use this system for complaint management purposes within the Brototype educational institution. This license shall automatically terminate if you violate any of these restrictions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. User Responsibilities</h2>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Provide accurate and truthful information</li>
                <li>Use the system only for legitimate complaint purposes</li>
                <li>Respect the privacy and rights of other users</li>
                <li>Not attempt to gain unauthorized access to any part of the system</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Prohibited Activities</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                You are prohibited from:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Posting false or misleading complaints</li>
                <li>Harassing or abusing staff or other users</li>
                <li>Attempting to compromise system security</li>
                <li>Using the system for commercial purposes</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Disclaimer</h2>
              <p className="text-muted-foreground leading-relaxed">
                The system is provided "as is". Brototype makes no warranties, expressed or implied, and hereby disclaims all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Modifications</h2>
              <p className="text-muted-foreground leading-relaxed">
                Brototype may revise these terms of service at any time without notice. By using this system, you are agreeing to be bound by the current version of these terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Contact Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                For questions about these Terms of Service, please contact us at legal@brototype.com.
              </p>
            </section>
          </div>
        </div>
      </section>

      <footer className="glass-strong border-t border-border/50 mt-16">
        <div className="container mx-auto px-6 py-8 text-center text-sm text-muted-foreground">
          © 2024 Brototype CMS. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Terms;
