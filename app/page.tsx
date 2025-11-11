import Link from "next/link";

const heroHighlights = [
  { value: "$12M+", label: "Fee-free payments in the US" },
  { value: "92%", label: "Crews who invite friends weekly" },
  { value: "2 mins", label: "Average time to launch a split" },
];

const spendChips = [
  { label: "Night Out", emoji: "🕺" },
  { label: "Brunch", emoji: "🥞" },
  { label: "Founder Retreat", emoji: "🚀" },
  { label: "Rent", emoji: "🏠" },
  { label: "Utilities", emoji: "⚡" },
  { label: "Hotels", emoji: "🏨" },
  { label: "Concerts", emoji: "🎤" },
  { label: "Bachelor Trip", emoji: "🎉" },
  { label: "Weekend Getaway", emoji: "🌴" },
];

const painPoints = [
  {
    title: "Unorganized Sheets",
    subtitle: "Stop duct-taping expenses in Excel.",
  },
  {
    title: "Awkward IOUs",
    subtitle: "No more chasing Venmo or reminding the group chat.",
  },
  {
    title: "Mental Math",
    subtitle: "Rules and splits that auto-calc for every swipe.",
  },
  {
    title: "No Transparency",
    subtitle: "Live card feeds keep every purchase in the light.",
  },
];

const howItWorks = [
  {
    step: "01",
    title: "Launch a Split",
    description:
      "Invite your crew, set the total, decide how everyone contributes. We handle the smart math.",
  },
  {
    step: "02",
    title: "Fund & Issue",
    description:
      "Contribute instantly from any US debit card, then issue a Splitsy virtual card or connect your base card.",
  },
  {
    step: "03",
    title: "Swipe & Track",
    description:
      "Spend in-store or online. Every swipe is split live, with receipts, alerts, and controls in one place.",
  },
];

const bankPartners = [
  "Bank of America",
  "Chase",
  "Capital One",
  "Wells Fargo",
  "American Express",
  "Navy Federal",
];

const testimonials = [
  {
    quote:
      "Splitsy finally made our Austin house share drama-free. Every bill hits the card and the crew sees it instantly.",
    name: "Ari, NYC",
    role: "Hosts quarterly group getaways",
  },
  {
    quote:
      "We run creator retreats on Splitsy. The live controls and exportable receipts keep sponsors and friends happy.",
    name: "June, Austin",
    role: "Creative Director & Producer",
  },
  {
    quote:
      "Our startup off-sites are effortless now. Cap budgets, approve swipes, and reconcile in minutes.",
    name: "Felix, Miami",
    role: "Ops at emerging brand collective",
  },
];

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute -top-32 left-1/2 z-[-1] h-[640px] w-[640px] -translate-x-1/2 rounded-full bg-emerald-400/30 blur-[200px]" />
      <div className="pointer-events-none absolute -right-24 top-20 z-[-1] h-[720px] w-[380px] rotate-12 rounded-full bg-blue-500/25 blur-[220px]" />
      <div className="pointer-events-none absolute -left-24 bottom-0 z-[-1] h-[560px] w-[420px] rounded-full bg-emerald-300/20 blur-[220px]" />

      <header className="safe-area-inset sticky top-0 z-50 border-b border-emerald-500/15 bg-slate-950/70 backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-emerald-500/50 px-3 py-1 text-xs uppercase tracking-[0.3em] text-emerald-100/90">
              Splitsy
            </span>
            <span className="hidden text-sm text-white/70 sm:inline">
              The shared card built for US crews.
            </span>
          </div>
          <nav className="hidden items-center gap-8 text-sm text-emerald-100/80 md:flex">
            <a href="#features" className="transition hover:text-white">
              Features
            </a>
            <a href="#how" className="transition hover:text-white">
              How it Works
            </a>
            <a href="#stories" className="transition hover:text-white">
              Stories
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="rounded-full border border-emerald-400/50 px-5 py-2 text-sm font-semibold text-emerald-100 transition hover:border-emerald-200 hover:text-white"
            >
              Sign In
            </Link>
            <Link
              href="/auth/register"
              className="rounded-full bg-gradient-to-r from-emerald-400 via-green-400 to-blue-500 px-5 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/40 transition hover:shadow-emerald-400/60 active:scale-[0.98]"
            >
              Get Splitsy
            </Link>
          </div>
        </div>
      </header>

      <main className="safe-area-inset">
        <section className="bg-gradient-to-br from-emerald-500 via-emerald-400 to-blue-500 py-20 text-slate-950">
          <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 sm:px-6 lg:flex-row lg:items-center lg:px-8">
            <div className="w-full space-y-6 lg:w-1/2">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-1 text-xs uppercase tracking-[0.3em] text-slate-900 shadow-lg">
                Made in the USA
              </div>
              <h1 className="text-4xl font-black tracking-tight sm:text-5xl md:text-6xl">
                PAYING TOGETHER
                <br />
                MADE <span className="text-blue-600">EASY</span>
              </h1>
              <p className="max-w-xl text-lg text-slate-900/80 sm:text-xl">
                Splitsy is the first US shared card that splits and pays at the
                same time. Pool money, tap to spend, and keep every moment
                effortlessly fair.
              </p>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-900/70">
                Replace Splitwise · PayPal · random spreadsheets · awkward
                reminders.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/auth/register"
                  className="inline-flex items-center justify-center rounded-full bg-slate-950 px-8 py-3 text-base font-semibold text-white shadow-xl shadow-slate-950/20 transition hover:bg-slate-900 hover:shadow-slate-900/30 focus:outline-none focus:ring-2 focus:ring-slate-900/40"
                >
                  Start for free
                </Link>
                <Link
                  href="/auth/login"
                  className="inline-flex items-center justify-center rounded-full border border-slate-900/30 px-8 py-3 text-base font-semibold text-slate-950 transition hover:border-slate-900 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                >
                  View dashboard
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-4 pt-4 text-slate-900/80 sm:grid-cols-3">
                {heroHighlights.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl bg-white/70 p-4 shadow-lg shadow-emerald-500/20 backdrop-blur"
                  >
                    <div className="text-2xl font-black text-slate-900">
                      {item.value}
                    </div>
                    <div className="mt-1 text-xs uppercase tracking-[0.3em]">
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="w-full lg:w-1/2">
              <div className="relative mx-auto max-w-lg rounded-[2.5rem] border border-white/60 bg-white p-8 shadow-[0_20px_80px_-20px_rgba(15,118,110,0.35)]">
                <div className="space-y-6 text-slate-900">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600">
                      Splitsy Shared Card
                    </span>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                      Balance $3,420.18
                    </span>
                  </div>
                  <div className="rounded-3xl bg-gradient-to-br from-emerald-500 via-emerald-400 to-blue-500 p-6 text-white shadow-inner">
                    <div className="flex items-center justify-between">
                      <span className="text-sm uppercase tracking-[0.3em]">
                        Palm Springs Escape
                      </span>
                      <span className="text-xs text-white/80">
                        Live split · 6 friends
                      </span>
                    </div>
                    <div className="mt-6 text-4xl font-black">$7,800.00</div>
                    <div className="mt-2 text-xs uppercase tracking-[0.3em] text-white/70">
                      54% spent · $3,510 remaining
                    </div>
                  </div>
                  <div className="space-y-3 text-sm text-slate-900/80">
                    <div className="flex items-center justify-between rounded-2xl bg-slate-900/5 px-4 py-3">
                      <span>🍣 Venice Beach dinner</span>
                      <span className="font-semibold text-slate-900">
                        $214.80
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl bg-slate-900/5 px-4 py-3">
                      <span>🛶 Lake Tahoe surf charter</span>
                      <span className="font-semibold text-slate-900">
                        $1,240.00
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl bg-slate-900/5 px-4 py-3">
                      <span>🏡 Desert A-Frame deposit</span>
                      <span className="font-semibold text-slate-900">
                        $2,100.00
                      </span>
                    </div>
                  </div>
                  <div className="rounded-3xl bg-slate-900/5 p-4">
                    <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-900/60">
                      <span>Contributors</span>
                      <span>Swipe to approve</span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-900">
                      {["Jordan", "Priya", "Leo", "Maya"].map((name) => (
                        <div
                          key={name}
                          className="rounded-2xl bg-white px-3 py-3 shadow-sm shadow-emerald-500/20"
                        >
                          <div className="font-semibold">{name}</div>
                          <div className="text-xs text-slate-900/60">
                            $1,300 paid
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="absolute -top-10 right-0 flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-xl shadow-emerald-500/30">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500" />
                    <div>
                      <div className="text-sm font-semibold text-slate-900">
                        Jordan just tapped
                      </div>
                      <div className="text-xs uppercase tracking-[0.3em] text-slate-900/60">
                        -$68.20 split evenly
                      </div>
                    </div>
                  </div>
                  <div className="absolute -left-8 bottom-8 flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-xl shadow-blue-500/30">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500" />
                    <div>
                      <div className="text-sm font-semibold text-slate-900">
                        Priya approved
                      </div>
                      <div className="text-xs uppercase tracking-[0.3em] text-slate-900/60">
                        Auto-split complete
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-slate-950 py-12">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-8 px-4 text-white/60 sm:px-6 lg:px-8">
            {[
              "Mastercard",
              "Visa",
              "Stripe",
              "TechCrunch",
              "sifted",
              "Built In",
            ].map((brand) => (
              <span key={brand} className="text-sm uppercase tracking-[0.4em]">
                {brand}
              </span>
            ))}
          </div>
        </section>

        <section className="bg-black py-20" id="features">
          <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 sm:px-6 lg:flex-row lg:px-8">
            <div className="space-y-6 lg:w-1/2">
              <h2 className="text-4xl font-black uppercase leading-tight tracking-tight">
                Pay and Split.
                <br />
                Any Bank. Anywhere in the US.
              </h2>
              <p className="text-base text-white/70 sm:text-lg">
                Tap to pay IRL or online. Set recurring bills or one-off
                moments. Splitsy automates the ledger, receipts, and approvals
                so the only thing you&apos;re chasing is the next experience.
              </p>
            </div>
            <div className="flex flex-1 flex-wrap gap-4">
              {spendChips.map((chip) => (
                <span
                  key={chip.label}
                  className="group inline-flex items-center gap-2 rounded-full border border-emerald-400/50 bg-gradient-to-r from-emerald-500/15 via-emerald-400/10 to-blue-500/15 px-5 py-3 text-sm font-semibold text-white/85 shadow-[0_12px_30px_-15px_rgba(16,185,129,0.6)] transition hover:border-emerald-200 hover:from-emerald-400/30 hover:to-blue-500/30 hover:text-white"
                >
                  <span className="text-lg drop-shadow">{chip.emoji}</span>
                  <span>{chip.label}</span>
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-blue-700 py-20">
          <div className="mx-auto max-w-6xl space-y-12 px-4 sm:px-6 lg:px-8">
            <div className="text-center text-white">
              <h2 className="text-4xl font-black uppercase tracking-tight">
                Splitsy was created for you to quit:
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
              {painPoints.map((item) => (
                <div
                  key={item.title}
                  className="rounded-3xl border border-white/20 bg-white/5 p-6 text-center text-white shadow-lg shadow-blue-900/40"
                >
                  <div className="text-xl font-bold uppercase tracking-tight">
                    {item.title}
                  </div>
                  <p className="mt-4 text-sm text-white/80">{item.subtitle}</p>
                </div>
              ))}
            </div>
            <div className="rounded-[2.5rem] bg-white px-8 py-10 text-center text-slate-900 shadow-xl shadow-blue-900/30">
              <h3 className="text-3xl font-black uppercase tracking-tight">
                To make your shared experiences unforgettable, not unpaid.
              </h3>
              <p className="mt-4 text-base text-slate-700 sm:text-lg">
                From bachelor trips to recurring roommate bills, Splitsy keeps
                every swipe fair, funded, and fun.
              </p>
            </div>
          </div>
        </section>

        <section id="how" className="bg-slate-100 py-20 text-slate-900">
          <div className="mx-auto max-w-6xl space-y-12 px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-4xl font-black uppercase tracking-tight">
                Here&apos;s how it works
              </h2>
              <p className="mt-4 text-base text-slate-600 sm:text-lg">
                Connect any major US bank or debit card in seconds. Then create,
                fund, and spend together with total clarity.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 text-xs uppercase tracking-[0.4em] text-slate-600/70">
              {bankPartners.map((bank) => (
                <span
                  key={bank}
                  className="rounded-full border border-slate-300 px-4 py-2"
                >
                  {bank}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {howItWorks.map((item) => (
                <div
                  key={item.step}
                  className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-900/5"
                >
                  <div className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-500">
                    {item.step}
                  </div>
                  <h3 className="mt-4 text-2xl font-bold text-slate-900">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm text-slate-600">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="stories"
          className="bg-gradient-to-br from-slate-950 via-emerald-950/80 to-blue-900/60 py-20"
        >
          <div className="mx-auto max-w-6xl space-y-10 px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <span className="text-xs uppercase tracking-[0.3em] text-emerald-200/80">
                Loved across the US
              </span>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
                When the vibe matters, people pick Splitsy.
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {testimonials.map((testimonial) => (
                <div
                  key={testimonial.name}
                  className="rounded-3xl border border-emerald-400/20 bg-slate-950/80 p-6 shadow-xl shadow-emerald-500/30 transition hover:border-emerald-200/40"
                >
                  <p className="text-sm text-emerald-100/85">
                    “{testimonial.quote}”
                  </p>
                  <div className="mt-6">
                    <div className="text-sm font-semibold text-white">
                      {testimonial.name}
                    </div>
                    <div className="text-xs uppercase tracking-[0.3em] text-emerald-200/70">
                      {testimonial.role}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative mx-auto max-w-5xl overflow-hidden rounded-[2.5rem] border border-emerald-400/20 bg-gradient-to-br from-emerald-500/25 via-slate-950/70 to-blue-600/30 px-6 py-20 text-center shadow-[0_40px_120px_-40px_rgba(16,185,129,0.55)] sm:px-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.35)_0,_transparent_55%)]" />
          <div className="relative space-y-4">
            <span className="text-xs uppercase tracking-[0.3em] text-emerald-200/80">
              Splitsy
            </span>
            <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
              The shared wallet for every unforgettable US moment.
            </h2>
            <p className="text-base text-emerald-100/75 sm:text-lg">
              Launch Splitsy today and bring clarity, control, and celebration
              to the way your friends and teams spend together.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center rounded-full bg-white px-8 py-3 text-base font-semibold text-slate-950 shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-300/50"
              >
                Create your first split
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center rounded-full border border-emerald-200/40 px-8 py-3 text-base font-semibold text-emerald-100/80 transition hover:border-emerald-200/70 hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-200/40"
              >
                I already have an account
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="mt-16 border-t border-emerald-400/20 bg-slate-950/90">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 text-xs uppercase tracking-[0.3em] text-emerald-200/70 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <span>
            © {new Date().getFullYear()} Splitsy. Built in the United States by
            Amenti AI.
          </span>
          <div className="flex gap-6">
            <a href="/auth/login" className="transition hover:text-white/70">
              Sign In
            </a>
            <a href="/auth/register" className="transition hover:text-white/70">
              Get Started
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
