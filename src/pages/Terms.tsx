import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';

const Terms = () => (
  <AppLayout>
    <article className="max-w-2xl mx-auto p-4 space-y-4">
      <Link to="/settings">
        <Button variant="ghost" size="sm" className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Settings
        </Button>
      </Link>
      <h1 className="text-3xl font-heading font-bold gradient-text">Terms & Conditions</h1>
      <p className="text-xs text-muted-foreground">Last updated: June 2026</p>

      <section className="space-y-3 text-sm leading-relaxed text-foreground/90">
        <h2 className="text-lg font-semibold pt-2">1. Acceptance of Terms</h2>
        <p>By accessing or using WorldFace (the "Service"), you agree to be bound by these Terms. If you do not agree, do not use the Service.</p>

        <h2 className="text-lg font-semibold pt-2">2. Eligibility</h2>
        <p>You must be at least 13 years old to use WorldFace. By using the Service, you represent that you meet this requirement.</p>

        <h2 className="text-lg font-semibold pt-2">3. Your Account</h2>
        <p>You are responsible for safeguarding your password and for any activity that occurs under your account. Notify us immediately of any unauthorized use.</p>

        <h2 className="text-lg font-semibold pt-2">4. User Content</h2>
        <p>You retain ownership of content you post. By posting, you grant WorldFace a worldwide, non-exclusive license to host, display, and distribute it within the Service.</p>

        <h2 className="text-lg font-semibold pt-2">5. Prohibited Conduct</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>No hate speech, harassment, or illegal content.</li>
          <li>No spam, scams, or fraudulent activity.</li>
          <li>No attempts to disrupt, hack, or reverse-engineer the Service.</li>
        </ul>

        <h2 className="text-lg font-semibold pt-2">6. NexaPay & Wallet</h2>
        <p>NexaPay coins are virtual credits within WorldFace. Transfers are final. We are not liable for transfers made to the wrong recipient.</p>

        <h2 className="text-lg font-semibold pt-2">7. Termination</h2>
        <p>We may suspend or terminate accounts that violate these Terms, with or without notice.</p>

        <h2 className="text-lg font-semibold pt-2">8. Disclaimer</h2>
        <p>The Service is provided "as is" without warranties of any kind. We are not liable for indirect or consequential damages.</p>

        <h2 className="text-lg font-semibold pt-2">9. Changes</h2>
        <p>We may update these Terms from time to time. Continued use of the Service means acceptance of the updated Terms.</p>

        <h2 className="text-lg font-semibold pt-2">10. Contact</h2>
        <p>Questions? Reach us via the official approved links in Settings.</p>
      </section>
    </article>
  </AppLayout>
);

export default Terms;
