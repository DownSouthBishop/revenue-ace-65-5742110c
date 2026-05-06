export default function LegalPage({ kind }: { kind: 'terms' | 'privacy' | 'consent' }) {
  const titles = {
    terms: 'Terms of Service',
    privacy: 'Privacy Policy',
    consent: 'SMS Consent & Messaging Disclosure',
  };
  return (
    <main className="min-h-[100dvh] bg-background text-foreground px-5 py-10 max-w-2xl mx-auto">
      <a href="/" className="text-xs font-mono text-t3 hover:text-sky">← Back</a>
      <h1 className="font-display text-2xl font-bold tracking-[.05em] mt-4 mb-6">{titles[kind]}</h1>
      <article className="prose prose-invert text-sm text-t2 leading-relaxed space-y-4">
        {kind === 'terms' && (<>
          <p>By using Respondfall ("Service") you agree to these Terms. The Service provides automated SMS responses to missed phone calls on behalf of your business.</p>
          <h2 className="font-display text-base font-bold mt-6">1. Eligibility</h2>
          <p>You must be 18+ and the owner or authorized agent of the phone number(s) you connect.</p>
          <h2 className="font-display text-base font-bold mt-6">2. Acceptable Use</h2>
          <p>You will not use the Service to send unsolicited marketing, spam, or any content prohibited by carrier or TCPA regulations. You are responsible for the consent status of every recipient.</p>
          <h2 className="font-display text-base font-bold mt-6">3. Twilio &amp; Carrier Fees</h2>
          <p>Messaging costs are passed through from Twilio. Numbers and messages are subject to Twilio's terms.</p>
          <h2 className="font-display text-base font-bold mt-6">4. Termination</h2>
          <p>You may delete your account at any time. We may suspend accounts that violate these Terms or carrier policy.</p>
          <h2 className="font-display text-base font-bold mt-6">5. Disclaimer</h2>
          <p>Service is provided "as is" without warranty. We are not liable for missed messages, carrier outages, or lost revenue.</p>
        </>)}
        {kind === 'privacy' && (<>
          <p>Respondfall stores the minimum data needed to operate: your account email, business profile, phone numbers you provision, missed-call records, and SMS conversation history.</p>
          <h2 className="font-display text-base font-bold mt-6">Data we collect</h2>
          <ul className="list-disc pl-5"><li>Account: email, hashed password</li><li>Business: name, industry, phone numbers, links</li><li>Communications: caller numbers, SMS bodies, voicemail recordings &amp; transcripts</li></ul>
          <h2 className="font-display text-base font-bold mt-6">How we use it</h2>
          <p>To deliver the Service, generate AI replies, and provide analytics back to you. We do not sell personal data.</p>
          <h2 className="font-display text-base font-bold mt-6">Sub-processors</h2>
          <p>Supabase (hosting/database), Twilio (telephony), Google/OpenAI (AI generation via Lovable AI Gateway).</p>
          <h2 className="font-display text-base font-bold mt-6">Your rights</h2>
          <p>Email <strong>support@respondfall.com</strong> to request access, export, or deletion of your data.</p>
        </>)}
        {kind === 'consent' && (<>
          <p>Respondfall sends automated SMS replies on behalf of business operators. By providing your phone number to a business that uses Respondfall (e.g. by calling them) you consent to receive transactional SMS related to your inquiry.</p>
          <ul className="list-disc pl-5"><li>Message frequency varies based on the conversation.</li><li>Message and data rates may apply.</li><li>Reply <strong>STOP</strong> to opt out at any time. Reply <strong>HELP</strong> for help.</li><li>We honor STOP within seconds and store no further messages until you reply START.</li></ul>
          <p>Consent to receive SMS is not a condition of any purchase.</p>
        </>)}
      </article>
    </main>
  );
}
