import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import { Link } from "react-router-dom";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="orb w-96 h-96 bg-primary top-0 right-0" style={{ animationDelay: '3s' }} />

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
              Privacy <span className="gradient-text">Policy</span>
            </h1>
            <p className="text-muted-foreground">Last updated: January 2024</p>
          </div>

          <div className="glass-strong p-8 md:p-12 rounded-3xl space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
              <p className="text-muted-foreground leading-relaxed">
                We collect information that you provide directly to us when using the Brototype Complaint Management System, including your name, email address, complaint details, and any attachments you upload.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Process and track your complaints</li>
                <li>Communicate with you about complaint status</li>
                <li>Improve our services and user experience</li>
                <li>Generate analytics for administrative purposes</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Data Security</h2>
              <p className="text-muted-foreground leading-relaxed">
                We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Data Sharing</h2>
              <p className="text-muted-foreground leading-relaxed">
                We do not sell or share your personal information with third parties except as necessary to provide our services or as required by law.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Your Rights</h2>
              <p className="text-muted-foreground leading-relaxed">
                You have the right to access, correct, or delete your personal information. Contact us at privacy@brototype.com to exercise these rights.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about this Privacy Policy, please contact us at privacy@brototype.com.
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

export default Privacy;
