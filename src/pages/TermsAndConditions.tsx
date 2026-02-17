import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { useSettings } from "@/contexts/SettingsContext";

export default function TermsAndConditions() {
  const { settings } = useSettings();
  const academyName = settings.academy_name;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-28 pb-16 px-4">
        <div className="container mx-auto max-w-3xl prose prose-headings:font-display prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground prose-a:text-primary">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">Terms and Conditions</h1>
          <p className="text-sm text-muted-foreground">Last updated: February 2026</p>

          <p>
            Welcome to {academyName}. By accessing our website, registering for any of our
            training programs, or using our services, you agree to be bound by these Terms and
            Conditions. Please read them carefully before proceeding.
          </p>

          <h2 className="text-xl font-semibold mt-8">1. Acceptance of Terms</h2>
          <p>
            By submitting a registration form, creating an account, or otherwise using our
            platform, you ("the Applicant" or "Student") acknowledge that you have read,
            understood, and agree to be bound by these Terms and Conditions, as well as our
            Privacy Policy. If you do not agree, please do not use our services.
          </p>

          <h2 className="text-xl font-semibold mt-8">2. Eligibility</h2>
          <p>
            Applicants must be at least 16 years of age and possess a minimum educational
            qualification of SSCE/WAEC or its equivalent. By registering, you confirm that
            all information provided is accurate and truthful to the best of your knowledge.
          </p>

          <h2 className="text-xl font-semibold mt-8">3. Registration and Enrollment</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Registration is subject to availability and program capacity at your chosen training center.</li>
            <li>A non-refundable registration fee is required to secure your enrollment.</li>
            <li>Enrollment is only confirmed upon successful payment verification by our team.</li>
            <li>{academyName} reserves the right to reject or cancel any application at its discretion.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8">4. Fees and Payments</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Tuition and registration fees are as displayed on the platform at the time of enrollment.</li>
            <li>Fees may be paid in full or via approved partial payment plans.</li>
            <li>All registration fees are non-refundable.</li>
            <li>Tuition refunds, if applicable, are subject to our refund policy and will be assessed on a case-by-case basis.</li>
            <li>Students who fail to complete payment by the specified deadline may have their enrollment suspended or revoked.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8">5. Scholarships</h2>
          <p>
            Scholarship awards are granted at the sole discretion of {academyName} and are
            subject to the availability of funding. Scholarship approval does not guarantee
            placement; students must still meet all enrollment and payment requirements (including
            the base registration fee). Scholarship percentages and terms may be modified or
            revoked if the student is found to have provided false or misleading information.
          </p>

          <h2 className="text-xl font-semibold mt-8">6. Data Collection, Use, and Sharing</h2>
          <p>
            By registering on our platform, you expressly consent to the following:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Data Collection:</strong> {academyName} collects personal information
              including but not limited to your name, date of birth, gender, contact details,
              educational background, employment status, household income, and guarantor
              information.
            </li>
            <li>
              <strong>Third-Party Sharing:</strong> Your personal data may be shared with
              third-party partners, sponsors, government agencies, and development organizations
              for the purposes of:
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Identifying and facilitating future scholarship opportunities;</li>
                <li>Economic development research and workforce planning;</li>
                <li>Program impact assessment and reporting;</li>
                <li>Employment placement and career development services;</li>
                <li>Any other activities and purposes aligned with {academyName}'s goals and vision.</li>
              </ul>
            </li>
            <li>
              <strong>Right to Revoke Consent:</strong> You may revoke your consent for data
              sharing by providing a written notice (via email to {settings.contact_email}) with
              a minimum of <strong>seven (7) days</strong> prior notice. Upon receipt and
              processing of your request, {academyName} will cease sharing your data with new
              third parties. However, data already shared prior to the revocation notice cannot
              be recalled.
            </li>
            <li>
              <strong>Limitation of Liability:</strong> {academyName} shall not be held liable
              for any consequences arising from the lawful sharing of your data with third
              parties in accordance with these Terms, provided that such sharing occurred before
              the expiry of your seven (7) day revocation notice period.
            </li>
          </ul>

          <h2 className="text-xl font-semibold mt-8">7. Student Conduct</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Students are expected to maintain regular attendance as per the program schedule.</li>
            <li>Any form of misconduct, harassment, or dishonesty may result in suspension or expulsion without refund.</li>
            <li>{academyName} reserves the right to suspend or terminate any student's account for violation of these Terms.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8">8. Intellectual Property</h2>
          <p>
            All course materials, curriculum content, software, and branding are the intellectual
            property of {academyName}. Students may not reproduce, distribute, or commercially
            exploit any course content without prior written consent.
          </p>

          <h2 className="text-xl font-semibold mt-8">9. Limitation of Liability</h2>
          <p>
            {academyName} provides training services on an "as-is" basis. While we strive for
            the highest quality of instruction, we do not guarantee specific employment outcomes,
            salary levels, or career advancement as a result of completing our programs. The
            academy shall not be liable for any indirect, incidental, or consequential damages
            arising from the use of our services.
          </p>

          <h2 className="text-xl font-semibold mt-8">10. Modifications to Terms</h2>
          <p>
            {academyName} reserves the right to modify these Terms and Conditions at any time.
            Changes will be communicated via the platform and/or registered email addresses.
            Continued use of our services after such changes constitutes acceptance of the
            revised Terms.
          </p>

          <h2 className="text-xl font-semibold mt-8">11. Governing Law</h2>
          <p>
            These Terms and Conditions shall be governed by and construed in accordance with the
            laws of the Federal Republic of Nigeria. Any disputes arising shall be subject to the
            exclusive jurisdiction of the courts in Nigeria.
          </p>

          <h2 className="text-xl font-semibold mt-8">12. Contact</h2>
          <p>
            For questions regarding these Terms and Conditions, please contact us at:
          </p>
          <ul className="list-none pl-0 space-y-1">
            <li><strong>Email:</strong> {settings.contact_email}</li>
            <li><strong>Phone:</strong> {settings.contact_phone}</li>
            <li><strong>Address:</strong> {settings.contact_address}</li>
          </ul>

          <div className="mt-12 p-6 bg-secondary/10 rounded-lg border border-border">
            <p className="text-sm text-muted-foreground">
              By clicking "I agree with the terms and conditions" during registration, you
              confirm that you have read, understood, and consent to all the provisions outlined
              above, including the sharing of your personal data with third-party partners as
              described in Section 6.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
