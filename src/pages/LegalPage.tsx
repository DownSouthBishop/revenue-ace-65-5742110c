export default function LegalPage({ kind }: { kind: 'terms' | 'privacy' | 'consent' }) {
  const titles = {
    terms: 'Terms of Service',
    privacy: 'Privacy Policy',
    consent: 'SMS Consent & Messaging Disclosure',
  };
  const updated = 'Last updated: May 6, 2025';

  return (
    <main className="min-h-[100dvh] bg-background text-foreground px-5 py-10 max-w-2xl mx-auto">
      <a href="/" className="text-xs font-mono text-t3 hover:text-sky">
        ← Back
      </a>
      <h1 className="font-display text-2xl font-bold tracking-[.05em] mt-4 mb-1">
        {titles[kind]}
      </h1>
      <p className="text-[11px] font-mono text-t3 mb-6">{updated}</p>
      <article className="prose prose-invert text-sm text-t2 leading-relaxed space-y-4">
        {kind === 'terms' && (
          <>
            <p>
              Please read these Terms of Service ("Terms") carefully before using Respondfall
              ("Service," "we," "us," or "our") operated by Respondfall, LLC. By accessing or using
              the Service you agree to be bound by these Terms. If you do not agree, do not use the
              Service.
            </p>

            <h2 className="font-display text-base font-bold mt-6">1. Eligibility</h2>
            <p>
              You must be at least 18 years old and have the legal authority to enter into contracts
              on behalf of yourself or the business you represent. You must also be the owner or
              authorized agent of every phone number you connect to the Service.
            </p>

            <h2 className="font-display text-base font-bold mt-6">2. Description of Service</h2>
            <p>
              Respondfall provides a platform that automatically sends SMS replies to callers who
              reach a connected business phone number when that call goes unanswered. The Service
              uses AI-generated messaging, Twilio for telephony, and Supabase for data storage.
              Features and pricing tiers are described on our website and may change from time to
              time.
            </p>

            <h2 className="font-display text-base font-bold mt-6">3. Account Registration</h2>
            <p>
              You must create an account to use the Service. You agree to provide accurate, current,
              and complete information and to keep your account credentials confidential. You are
              responsible for all activity that occurs under your account. Notify us immediately if
              you believe your account has been compromised.
            </p>

            <h2 className="font-display text-base font-bold mt-6">4. Acceptable Use</h2>
            <p>You agree that you will not use the Service to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Send unsolicited commercial messages (spam) to any person who has not provided prior
                express written consent where required by applicable law
              </li>
              <li>
                Violate the Telephone Consumer Protection Act (TCPA), CAN-SPAM Act, or any other
                applicable telecommunications or privacy law
              </li>
              <li>
                Transmit content that is unlawful, harassing, abusive, threatening, defamatory, or
                obscene
              </li>
              <li>Impersonate any person or entity</li>
              <li>Interfere with or disrupt the Service or its infrastructure</li>
              <li>Attempt to gain unauthorized access to any part of the Service</li>
              <li>Resell or sublicense the Service without our prior written consent</li>
            </ul>
            <p>
              You are solely responsible for ensuring that every recipient of messages sent through
              your account has provided the legally required level of consent.
            </p>

            <h2 className="font-display text-base font-bold mt-6">5. Fees & Billing</h2>
            <p>
              Subscription fees are charged in advance on a monthly or annual basis through Stripe.
              Messaging costs are passed through from Twilio at the rates displayed in your
              dashboard. All fees are non-refundable except as required by law. We reserve the right
              to change pricing with 30 days' notice.
            </p>

            <h2 className="font-display text-base font-bold mt-6">6. Third-Party Services</h2>
            <p>
              The Service relies on Twilio (telephony), Supabase (database and hosting), Stripe
              (payments), and AI providers for message generation. Downtime or changes by these
              providers may affect Service availability and we are not liable for such events.
            </p>

            <h2 className="font-display text-base font-bold mt-6">7. Intellectual Property</h2>
            <p>
              All software, trademarks, logos, and content provided by Respondfall remain our
              exclusive property or the property of our licensors. You retain ownership of all
              content you upload or create using the Service.
            </p>

            <h2 className="font-display text-base font-bold mt-6">8. Termination</h2>
            <p>
              You may cancel your account at any time from your account settings. We may suspend or
              terminate your account immediately, without notice, if you violate these Terms, carrier
              policies, or applicable law.
            </p>

            <h2 className="font-display text-base font-bold mt-6">9. Disclaimers</h2>
            <p>
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND,
              EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY,
              FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
            </p>

            <h2 className="font-display text-base font-bold mt-6">10. Limitation of Liability</h2>
            <p>
              TO THE FULLEST EXTENT PERMITTED BY LAW, RESPONDFALL'S TOTAL LIABILITY TO YOU FOR ANY
              CLAIMS SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE THREE (3) MONTHS IMMEDIATELY
              PRECEDING THE CLAIM. IN NO EVENT SHALL WE BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL,
              CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOST PROFITS OR REVENUE.
            </p>

            <h2 className="font-display text-base font-bold mt-6">11. Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless Respondfall and its officers,
              directors, employees, and agents from and against any claims, liabilities, damages,
              losses, and expenses arising out of your use of the Service or your violation of these
              Terms.
            </p>

            <h2 className="font-display text-base font-bold mt-6">
              12. Governing Law & Disputes
            </h2>
            <p>
              These Terms are governed by the laws of the State of Florida, without regard to
              conflict of law principles. Any dispute shall be resolved by binding arbitration under
              the rules of the American Arbitration Association.
            </p>

            <h2 className="font-display text-base font-bold mt-6">13. Changes to Terms</h2>
            <p>
              We may update these Terms from time to time. We will notify you of material changes
              via email or an in-app notice. Continued use after the effective date constitutes
              acceptance of the updated Terms.
            </p>

            <h2 className="font-display text-base font-bold mt-6">14. Contact</h2>
            <p>Questions about these Terms? Please use the contact form on our website.</p>
          </>
        )}

        {kind === 'privacy' && (
          <>
            <p>
              This Privacy Policy describes how Respondfall, LLC collects, uses, and shares
              information when you use our Service. By using the Service, you agree to the practices
              described in this policy.
            </p>

            <h2 className="font-display text-base font-bold mt-6">1. Information We Collect</h2>
            <p>
              <strong>Account Information:</strong> Email address and hashed password (or OAuth
              token); billing information processed by Stripe — we do not store raw card data.
            </p>
            <p>
              <strong>Business Profile:</strong> Business name, industry, website, and profile
              details you provide; Twilio API credentials you connect; phone numbers you provision;
              custom SMS reply templates and AI prompt configurations you create.
            </p>
            <p>
              <strong>Communications Data:</strong> Caller phone numbers, call timestamps, and call
              disposition; SMS message bodies sent and received through your connected numbers;
              voicemail recordings and AI-generated transcripts (if enabled); opt-out records
              (STOP/START responses) for each number.
            </p>
            <p>
              <strong>Usage & Technical Data:</strong> IP address, browser type, device identifiers,
              and operating system; feature interactions, pages visited, and session duration; error
              logs and performance data.
            </p>

            <h2 className="font-display text-base font-bold mt-6">
              2. How We Use Your Information
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Operate, maintain, and improve the Service</li>
              <li>Send automated SMS replies on your behalf</li>
              <li>
                Generate AI-powered message suggestions based on your business profile
              </li>
              <li>Process payments and manage your subscription</li>
              <li>Send transactional emails</li>
              <li>Provide customer support</li>
              <li>Detect and prevent fraud and security incidents</li>
              <li>Comply with applicable legal obligations</li>
            </ul>
            <p>
              We do not sell your personal data or the personal data of your callers to third
              parties.
            </p>

            <h2 className="font-display text-base font-bold mt-6">
              3. How We Share Your Information
            </h2>
            <p>
              We share data only with service providers who help us operate the Service — Supabase
              (database and hosting), Twilio (telephony and SMS delivery), Stripe (payment
              processing), and AI providers for message generation — each contractually required to
              protect your data. We may also disclose information if required by law or court order,
              or in connection with a merger, acquisition, or sale of assets.
            </p>

            <h2 className="font-display text-base font-bold mt-6">4. Data Retention</h2>
            <p>
              We retain your account data for as long as your account is active. SMS conversation
              history and call records are retained for up to 12 months by default. When you delete
              your account, we delete your personal data within 30 days except where retention is
              required by law.
            </p>

            <h2 className="font-display text-base font-bold mt-6">5. Security</h2>
            <p>
              We implement encryption at rest and in transit (TLS), access controls, and regular
              security reviews. If you believe your account has been compromised, contact us
              immediately via the contact form on our website.
            </p>

            <h2 className="font-display text-base font-bold mt-6">6. Your Rights</h2>
            <p>
              Depending on your location, you may have the right to access, correct, export, or
              delete your personal data. Please use the contact form on our website to make a
              request — we will respond within 30 days. California residents have additional rights
              under the CCPA.
            </p>

            <h2 className="font-display text-base font-bold mt-6">7. Cookies & Tracking</h2>
            <p>
              We use essential cookies to keep you logged in and maintain your session. We may use
              analytics tools that set cookies. You can control cookies through your browser
              settings.
            </p>

            <h2 className="font-display text-base font-bold mt-6">8. Children's Privacy</h2>
            <p>
              The Service is not directed to individuals under 18. We do not knowingly collect
              personal data from children.
            </p>

            <h2 className="font-display text-base font-bold mt-6">9. Changes to This Policy</h2>
            <p>
              We will notify you of material changes via email or an in-app notice. Continued use
              after the effective date constitutes acceptance of the updated policy.
            </p>

            <h2 className="font-display text-base font-bold mt-6">10. Contact</h2>
            <p>For privacy questions, please use the contact form on our website.</p>
          </>
        )}

        {kind === 'consent' && (
          <>
            <p>
              This disclosure applies to text messages sent by business operators ("Businesses")
              using the Respondfall platform. Respondfall facilitates automated SMS replies on
              behalf of Businesses when their phone calls go unanswered.
            </p>

            <h2 className="font-display text-base font-bold mt-6">Who Is Messaging You</h2>
            <p>
              When you receive an SMS reply after calling a business, that message is sent by or on
              behalf of the business you called — not by Respondfall directly. Respondfall provides
              the technology; the Business is the sender of record.
            </p>

            <h2 className="font-display text-base font-bold mt-6">Your Consent</h2>
            <p>
              By calling a Business that uses Respondfall, you may receive one or more automated SMS
              replies related to your inquiry. These are transactional messages sent in direct
              response to your inbound call — not unsolicited marketing. Consent to receive SMS is
              not a condition of purchasing any goods or services from the Business.
            </p>

            <h2 className="font-display text-base font-bold mt-6">Message Frequency</h2>
            <p>
              Message frequency varies depending on your interaction with the Business. You may
              receive an initial automated reply and additional messages if you respond to continue
              the conversation.
            </p>

            <h2 className="font-display text-base font-bold mt-6">Message & Data Rates</h2>
            <p>
              Message and data rates may apply based on your mobile carrier plan. Respondfall and
              the Business are not responsible for charges imposed by your carrier.
            </p>

            <h2 className="font-display text-base font-bold mt-6">How to Opt Out</h2>
            <p>
              Reply <strong>STOP</strong> to any message to opt out. You will receive one final
              confirmation message and then no further messages until you reply{' '}
              <strong>START</strong> to re-subscribe.
            </p>

            <h2 className="font-display text-base font-bold mt-6">How to Get Help</h2>
            <p>
              Reply <strong>HELP</strong> to any message for assistance, or reach us via the contact
              form on our website.
            </p>

            <h2 className="font-display text-base font-bold mt-6">Supported Carriers</h2>
            <p>
              AT&T, T-Mobile, Verizon, Boost Mobile, MetroPCS, U.S. Cellular, and most major U.S.
              carriers. T-Mobile is not liable for delayed or undelivered messages.
            </p>

            <h2 className="font-display text-base font-bold mt-6">Privacy</h2>
            <p>
              Your phone number and message content are handled in accordance with Respondfall's{' '}
              <a href="/privacy" className="text-sky hover:underline">
                Privacy Policy
              </a>
              . We do not sell your phone number or message history to third parties.
            </p>

            <h2 className="font-display text-base font-bold mt-6">For Business Operators</h2>
            <p>If you are a Business using Respondfall, you are responsible for:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Ensuring recipients have provided legally required consent before sending promotional
                or marketing messages
              </li>
              <li>Including required opt-out language in all messages where required by law</li>
              <li>Honoring STOP requests promptly</li>
              <li>
                Complying with the TCPA, CTIA guidelines, carrier codes of conduct, and all
                applicable laws
              </li>
            </ul>
            <p>
              Respondfall automatically processes STOP/START/HELP keywords and maintains opt-out
              records on your behalf, but ultimate legal compliance responsibility rests with you as
              the Business operator.
            </p>

            <h2 className="font-display text-base font-bold mt-6">Contact</h2>
            <p>Questions about this disclosure? Please use the contact form on our website.</p>
          </>
        )}
      </article>
    </main>
  );
}
