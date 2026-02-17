import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { useSettings } from "@/contexts/SettingsContext";

export default function PrivacyPolicy() {
  const { settings } = useSettings();
  const academyName = settings.academy_name;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-28 pb-16 px-4">
        <div className="container mx-auto max-w-3xl prose prose-headings:font-display prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground prose-a:text-primary">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground">Last updated: February 2026</p>

          <p>
            {academyName} ("we", "our", or "us") is committed to protecting your personal data
            in accordance with the Nigeria Data Protection Regulation (NDPR) 2019 and other
            applicable data protection laws. This Privacy Policy explains how we collect, use,
            store, and share your information when you use our platform and services.
          </p>

          <h2 className="text-xl font-semibold mt-8">1. Information We Collect</h2>
          <p>We collect the following categories of personal data:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Identity Data:</strong> Full name, date of birth, gender, state of origin, LGA, and disability status.</li>
            <li><strong>Contact Data:</strong> Email address, phone number, alternative phone number, and residential address.</li>
            <li><strong>Educational Data:</strong> Highest education level, previous tech experience, and program preferences.</li>
            <li><strong>Financial Data:</strong> Employment status, household income, and payment transaction records.</li>
            <li><strong>Guarantor Data:</strong> Name, address, phone number, and email of your guarantor.</li>
            <li><strong>Technical Data:</strong> IP address, browser type, device information, and geolocation data (for attendance check-ins).</li>
            <li><strong>Usage Data:</strong> Login activity, pages visited, and interactions with the platform.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8">2. How We Use Your Data</h2>
          <p>Your personal data is processed for the following purposes:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Processing and managing your enrollment and student account;</li>
            <li>Administering tuition payments, scholarships, and financial records;</li>
            <li>Verifying attendance through geolocation-based check-ins;</li>
            <li>Communicating important updates, schedules, and notifications;</li>
            <li>Generating reports for program monitoring and institutional improvement;</li>
            <li>Sharing with third-party partners for scholarship opportunities and economic development research (with your consent);</li>
            <li>Complying with legal and regulatory obligations.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8">3. Legal Basis for Processing</h2>
          <p>We process your data based on the following legal grounds under NDPR:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Consent:</strong> You provide explicit consent when you accept our Terms and Conditions during registration.</li>
            <li><strong>Contractual Necessity:</strong> Processing is necessary to fulfill our training service agreement with you.</li>
            <li><strong>Legitimate Interest:</strong> For institutional research, program improvement, and workforce development initiatives.</li>
            <li><strong>Legal Obligation:</strong> To comply with Nigerian laws and regulatory requirements.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8">4. Data Sharing and Third Parties</h2>
          <p>
            We may share your personal data with the following categories of recipients:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Scholarship Partners:</strong> Organizations providing funding for student scholarships and grants.</li>
            <li><strong>Government Agencies:</strong> For workforce development reporting and TVET programme compliance.</li>
            <li><strong>Research Organizations:</strong> For economic development research and program impact assessments.</li>
            <li><strong>Payment Processors:</strong> To facilitate secure online and bank transfer payments.</li>
            <li><strong>Technology Service Providers:</strong> Cloud hosting, email services, and platform infrastructure partners who process data on our behalf.</li>
          </ul>
          <p>
            All third parties are required to handle your data in accordance with NDPR and
            applicable data protection standards. We do not sell your personal data.
          </p>

          <h2 className="text-xl font-semibold mt-8">5. Cookies and Tracking Technologies</h2>
          <p>Our platform uses cookies and similar technologies to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Essential Cookies:</strong> Maintain your login session and ensure the platform functions correctly. These are strictly necessary and cannot be disabled.</li>
            <li><strong>Authentication Tokens:</strong> Securely identify you across sessions and protect your account.</li>
            <li><strong>Preference Cookies:</strong> Remember your display preferences (e.g., theme settings).</li>
            <li><strong>Analytics:</strong> Understand how users interact with our platform to improve the experience.</li>
          </ul>
          <p>
            You can manage cookie preferences through your browser settings. Disabling essential
            cookies may prevent the platform from functioning properly.
          </p>

          <h2 className="text-xl font-semibold mt-8">6. Data Retention</h2>
          <p>
            We retain your personal data for as long as your student account is active and for a
            period of five (5) years after your last interaction with our platform, unless a
            longer retention period is required by law. Financial transaction records are retained
            for a minimum of six (6) years in compliance with Nigerian tax and accounting
            regulations.
          </p>

          <h2 className="text-xl font-semibold mt-8">7. Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to protect your
            personal data, including:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Encryption of data in transit (TLS/SSL) and at rest;</li>
            <li>Role-based access controls limiting data access to authorized personnel;</li>
            <li>Row-level security policies ensuring students can only access their own data;</li>
            <li>Regular security audits and monitoring of our systems;</li>
            <li>Secure password hashing and authentication mechanisms.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8">8. Your Rights Under NDPR</h2>
          <p>As a data subject, you have the following rights:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Right of Access:</strong> Request a copy of the personal data we hold about you.</li>
            <li><strong>Right to Rectification:</strong> Request correction of inaccurate or incomplete data.</li>
            <li><strong>Right to Erasure:</strong> Request deletion of your data where there is no compelling reason for continued processing.</li>
            <li><strong>Right to Restrict Processing:</strong> Request limitation of processing in certain circumstances.</li>
            <li><strong>Right to Data Portability:</strong> Receive your data in a structured, commonly used format.</li>
            <li><strong>Right to Object:</strong> Object to processing based on legitimate interest, including direct marketing.</li>
            <li><strong>Right to Withdraw Consent:</strong> Withdraw your consent for data sharing at any time by providing seven (7) days' written notice to {settings.contact_email}.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8">9. Children's Privacy</h2>
          <p>
            Our services are not intended for individuals under the age of 16. We do not
            knowingly collect personal data from children under 16. If we become aware that we
            have collected data from a child under 16 without appropriate parental consent, we
            will take steps to delete that information.
          </p>

          <h2 className="text-xl font-semibold mt-8">10. International Data Transfers</h2>
          <p>
            Your data may be processed on servers located outside Nigeria (e.g., cloud
            infrastructure providers). In such cases, we ensure that adequate safeguards are in
            place in accordance with NDPR requirements, including data processing agreements
            with our service providers.
          </p>

          <h2 className="text-xl font-semibold mt-8">11. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. Any material changes will be
            communicated to registered users via email or platform notification. Continued use
            of our services after such changes constitutes acceptance of the updated policy.
          </p>

          <h2 className="text-xl font-semibold mt-8">12. Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy or wish to exercise your data
            rights, please contact our Data Protection Officer:
          </p>
          <ul className="list-none pl-0 space-y-1">
            <li><strong>Email:</strong> {settings.contact_email}</li>
            <li><strong>Phone:</strong> {settings.contact_phone}</li>
            <li><strong>Address:</strong> {settings.contact_address}</li>
          </ul>
          <p>
            You also have the right to lodge a complaint with the National Information Technology
            Development Agency (NITDA) if you believe your data protection rights have been
            violated.
          </p>

          <div className="mt-12 p-6 bg-secondary/10 rounded-lg border border-border">
            <p className="text-sm text-muted-foreground">
              This Privacy Policy should be read alongside our{" "}
              <a href="/terms-and-conditions" className="text-primary hover:underline">
                Terms and Conditions
              </a>{" "}
              for a complete understanding of how your data is handled.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
