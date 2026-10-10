import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';

const Privacy = () => (
  <AppLayout>
    <article className="max-w-2xl mx-auto p-4 space-y-4">
      <Link to="/settings">
        <Button variant="ghost" size="sm" className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Settings
        </Button>
      </Link>
      <h1 className="text-3xl font-heading font-bold gradient-text">Privacy Policy</h1>
      <p className="text-xs text-muted-foreground">Last updated: June 2026</p>

      <section className="space-y-3 text-sm leading-relaxed text-foreground/90">
        <h2 className="text-lg font-semibold pt-2">1. Information We Collect</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Account info:</strong> name, email, avatar, NexaPay account number.</li>
          <li><strong>Content:</strong> posts, comments, messages, and media you upload.</li>
          <li><strong>Usage data:</strong> device info, IP address, and interactions for security and analytics.</li>
        </ul>

        <h2 className="text-lg font-semibold pt-2">2. How We Use Your Data</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>To provide and improve the Service.</li>
          <li>To enable messaging, calls, and NexaPay transactions.</li>
          <li>To send notifications you've opted into.</li>
          <li>To detect and prevent fraud or abuse.</li>
        </ul>

        <h2 className="text-lg font-semibold pt-2">3. Sharing</h2>
        <p>We do not sell your personal data. We share data only with service providers needed to run WorldFace, or when required by law.</p>

        <h2 className="text-lg font-semibold pt-2">4. Security</h2>
        <p>We use encryption, Row-Level Security, and access controls to protect your data. No system is 100% secure, but we work hard to safeguard it.</p>

        <h2 className="text-lg font-semibold pt-2">5. Your Rights</h2>
        <p>You can view, update, or delete your profile and content at any time. To request full data deletion, contact us via the approved links in Settings.</p>

        <h2 className="text-lg font-semibold pt-2">6. Children</h2>
        <p>WorldFace is not directed to children under 13. We do not knowingly collect data from them.</p>

        <h2 className="text-lg font-semibold pt-2">7. Cookies & Local Storage</h2>
        <p>We use local storage for session management and notification preferences. You can clear this in your browser settings.</p>

        <h2 className="text-lg font-semibold pt-2">8. Changes</h2>
        <p>We may update this policy. We'll notify you of significant changes via the app.</p>

        <h2 className="text-lg font-semibold pt-2">9. Contact</h2>
        <p>For privacy questions, reach us through the official approved links in Settings.</p>
      </section>
    </article>
  </AppLayout>
);

export default Privacy;
