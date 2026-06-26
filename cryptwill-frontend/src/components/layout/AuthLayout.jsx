import { Outlet, Link } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-background text-text-primary">
      <div className="mx-auto grid min-h-screen max-w-7xl lg:grid-cols-[1.1fr_0.9fr]">
        <section className="relative hidden overflow-hidden border-r border-border bg-[radial-gradient(circle_at_top_left,_rgba(79,110,247,0.18),_transparent_38%),linear-gradient(180deg,_#0A0A0F,_#0E1018)] p-10 lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-text-secondary">
              <span className="h-2 w-2 rounded-full bg-brand" />
              CryptWill
            </div>
            <h1 className="mt-10 max-w-xl text-5xl font-semibold tracking-tight text-white">
              Your crypto should not die with you.
            </h1>
            <p className="mt-4 max-w-lg text-lg text-text-secondary">
              A premium inheritance flow for owners, guardians, and beneficiaries built on Stellar.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm text-text-secondary">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">OTP verified onboarding</div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">One-click check-ins</div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Guardian voting</div>
          </div>
        </section>
        <main className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md">
            <div className="mb-6 flex items-center justify-between lg:hidden">
              <Link to="/" className="text-sm font-medium text-brand">CryptWill</Link>
              <Link to="/login" className="text-sm text-text-secondary">Login</Link>
            </div>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}