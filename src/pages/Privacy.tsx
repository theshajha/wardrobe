import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Database, Lock, Mail, Shield, Users } from 'lucide-react'
import { useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function Privacy() {
  useEffect(() => {
    document.title = 'Privacy Policy | Fitso.me'
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Fitso.me
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-amber-500/10 via-pink-500/10 to-violet-500/10 mb-4">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We built Fitso.me with privacy at its core. Your data is yours, always.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Last updated: December 4, 2025
          </p>
        </div>

        {/* Key Principles */}
        <Card className="mb-8 border-2 border-primary/20">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Lock className="h-6 w-6 text-primary" />
              Our Privacy Promise
            </h2>
            <div className="space-y-3 text-muted-foreground">
              <p className="flex items-start gap-2">
                <span className="text-primary mt-1">✓</span>
                <span><strong className="text-foreground">Local-First:</strong> Your data lives on your device. You can use Fitso.me without ever syncing to the cloud.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-primary mt-1">✓</span>
                <span><strong className="text-foreground">No Selling:</strong> We will never sell your data. Ever.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-primary mt-1">✓</span>
                <span><strong className="text-foreground">You Control:</strong> Export, delete, or keep everything local - it's your choice.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-primary mt-1">✓</span>
                <span><strong className="text-foreground">Transparent:</strong> We tell you exactly what we collect and why.</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-8">
          {/* What We Collect */}
          <section>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Database className="h-6 w-6" />
              What Information We Collect
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Information You Provide</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                  <li><strong>Wardrobe Data:</strong> Items, outfits, trips, and wishlists you create</li>
                  <li><strong>Account Information:</strong> Email address (for cloud sync), display name</li>
                  <li><strong>Images:</strong> Photos you upload of your items (stored locally by default)</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Automatically Collected</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                  <li><strong>Analytics:</strong> Anonymous usage patterns to improve the app (via PostHog)</li>
                  <li><strong>Device Storage:</strong> All data stored in your browser's local database (IndexedDB)</li>
                </ul>
              </div>
            </div>
          </section>

          {/* How We Use Data */}
          <section>
            <h2 className="text-2xl font-bold mb-4">How We Use Your Information</h2>
            <div className="space-y-3 text-muted-foreground">
              <p><strong className="text-foreground">To Provide the Service:</strong> Store and organize your wardrobe data locally on your device.</p>
              <p><strong className="text-foreground">Cloud Sync (Optional):</strong> If you enable sync, we securely store your data in Cloudflare R2 to access it across devices.</p>
              <p><strong className="text-foreground">Public Profiles (Optional):</strong> If you enable your public profile, only items you mark as "Featured" are visible to others.</p>
              <p><strong className="text-foreground">Analytics:</strong> Understand how people use the app to make it better. All analytics are anonymized.</p>
              <p><strong className="text-foreground">Communication:</strong> Send magic link emails for authentication (via Resend).</p>
            </div>
          </section>

          {/* Third-Party Services */}
          <section>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Users className="h-6 w-6" />
              Third-Party Services We Use
            </h2>
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-1">Cloudflare R2</h3>
                  <p className="text-sm text-muted-foreground mb-2">Secure cloud storage for your synced data and images.</p>
                  <p className="text-xs text-muted-foreground">
                    <strong>What they store:</strong> Your wardrobe data, photos (only if you enable sync)<br />
                    <strong>Privacy policy:</strong> <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">cloudflare.com/privacypolicy</a>
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-1">Resend</h3>
                  <p className="text-sm text-muted-foreground mb-2">Email service for magic link authentication.</p>
                  <p className="text-xs text-muted-foreground">
                    <strong>What they process:</strong> Your email address (only when you request to sign in)<br />
                    <strong>Privacy policy:</strong> <a href="https://resend.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">resend.com/legal/privacy-policy</a>
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-1">PostHog</h3>
                  <p className="text-sm text-muted-foreground mb-2">Privacy-friendly analytics to understand how the app is used.</p>
                  <p className="text-xs text-muted-foreground">
                    <strong>What they track:</strong> Anonymous usage events, page views, feature usage<br />
                    <strong>Privacy policy:</strong> <a href="https://posthog.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">posthog.com/privacy</a><br />
                    <strong>Note:</strong> You can opt out of analytics in Settings
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Data Storage */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Where Your Data Lives</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Local Storage (Default)</h3>
                <p className="text-muted-foreground">
                  All your wardrobe data is stored in your browser's IndexedDB. This means:
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4 mt-2">
                  <li>Data never leaves your device unless you enable sync</li>
                  <li>Works offline</li>
                  <li>You're in complete control</li>
                  <li>We never see your data</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Cloud Sync (Optional)</h3>
                <p className="text-muted-foreground">
                  When you enable sync, your data is encrypted and stored in Cloudflare R2:
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4 mt-2">
                  <li>Stored in secure, encrypted buckets</li>
                  <li>Each user's data is isolated</li>
                  <li>Images are deduplicated using cryptographic hashes</li>
                  <li>You can disable sync or delete your account anytime</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Your Rights */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Your Rights & Controls</h2>
            <div className="space-y-3 text-muted-foreground">
              <p><strong className="text-foreground">Access:</strong> Export all your data anytime from Settings → Storage & Backup.</p>
              <p><strong className="text-foreground">Delete:</strong> Clear all local data or delete your cloud account from Settings.</p>
              <p><strong className="text-foreground">Opt-Out:</strong> Disable analytics tracking in Settings → General.</p>
              <p><strong className="text-foreground">Control Sharing:</strong> Choose which items to feature publicly, disable your public profile anytime.</p>
              <p><strong className="text-foreground">Data Portability:</strong> Export your data in JSON format to move to another service.</p>
            </div>
          </section>

          {/* Security */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Security</h2>
            <p className="text-muted-foreground mb-4">
              We take security seriously:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
              <li><strong>Magic Link Authentication:</strong> No passwords to leak or forget</li>
              <li><strong>Encrypted Storage:</strong> Data in transit and at rest is encrypted</li>
              <li><strong>Image Hashing:</strong> SHA-256 hashes ensure data integrity</li>
              <li><strong>Isolated Storage:</strong> Each user's data is completely separate</li>
              <li><strong>Regular Updates:</strong> We keep dependencies updated for security</li>
            </ul>
          </section>

          {/* Children's Privacy */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Children's Privacy</h2>
            <p className="text-muted-foreground">
              Fitso.me is not intended for children under 13. We do not knowingly collect information from children. If you're a parent and believe your child has provided us information, please contact us at{' '}
              <a href="mailto:shashank@fitso.me" className="text-primary hover:underline">shashank@fitso.me</a>.
            </p>
          </section>

          {/* Changes to Policy */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Changes to This Policy</h2>
            <p className="text-muted-foreground">
              We may update this privacy policy from time to time. We'll notify you of significant changes by updating the "Last updated" date at the top of this page. Your continued use of Fitso.me after changes means you accept the updated policy.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Mail className="h-6 w-6" />
              Questions or Concerns?
            </h2>
            <p className="text-muted-foreground mb-4">
              We're here to help. If you have any questions about this privacy policy or how we handle your data:
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a href="mailto:shashank@fitso.me">
                <Button variant="default">
                  <Mail className="h-4 w-4 mr-2" />
                  Email Us
                </Button>
              </a>
              <Link to="/">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to App
                </Button>
              </Link>
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>
            © 2025 Fitso.me · Built with privacy first 🔒
          </p>
        </footer>
      </main>
    </div>
  )
}
