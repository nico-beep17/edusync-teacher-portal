import Link from "next/link"
import Image from "next/image"
import { ArrowRight, BookOpen, Calendar, LineChart, Sparkles, Files, Bot, ShieldCheck, Calculator } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 overflow-hidden selection:bg-[#003876] selection:text-white">
      {/* Navbar Minimal */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg overflow-hidden border border-slate-200 shadow-sm">
              <img src="/depaid-logo.png" alt="DepAid" className="h-full w-full object-cover" />
            </div>
            <span className="text-xl font-black tracking-tight text-[#111A24]">DepAid</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-semibold text-slate-600 hover:text-[#003876] transition-colors">
              Log in
            </Link>
            <Link 
              href="/dashboard" 
              className="text-sm font-bold bg-[#E3001B] hover:bg-[#C00017] text-white px-5 py-2 rounded-full shadow-lg shadow-red-500/20 transition-all active:scale-95"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6">
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: "linear-gradient(rgba(0,56,118,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,56,118,0.03) 1px, transparent 1px)",
          backgroundSize: "64px 64px"
        }} />
        
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-8 items-center relative z-10">
          <div className="max-w-2xl text-center lg:text-left mx-auto lg:mx-0">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <Sparkles size={14} className="text-[#003876]" />
              <span className="text-xs font-bold text-[#003876] tracking-wide uppercase">The Future of EdTech</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-black text-[#111A24] leading-[1.1] tracking-tight mb-6 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
              Your Complete <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#003876] to-[#E3001B]">
                Teacher Portal.
              </span>
            </h1>
            <p className="text-lg text-slate-600 mb-8 leading-relaxed max-w-xl mx-auto lg:mx-0 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
              Stop fighting with Excel spreadsheets. DepAid automates your SF1, SF2, SF3, and SF5. Enjoy absolute offline readiness, smart AI grading, and DepEd-compliant structural forms in one beautiful Progressive Web App.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
              <Link 
                href="/login" 
                className="w-full sm:w-auto flex items-center justify-center gap-2 h-14 px-8 rounded-full bg-[#003876] hover:bg-blue-900 text-white font-bold text-lg shadow-xl shadow-blue-900/20 transition-all active:scale-95"
              >
                Access Portal <ArrowRight size={18} />
              </Link>
              <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                <ShieldCheck size={18} className="text-emerald-500" />
                No credit card required
              </div>
            </div>
          </div>

          <div className="relative mx-auto lg:ml-auto w-full max-w-[600px] aspect-[4/3] animate-in fade-in zoom-in-95 duration-1000 delay-300">
            {/* The Generated Mockup Image */}
            <div className="absolute inset-0 rounded-3xl overflow-hidden shadow-2xl shadow-blue-900/10 border border-slate-200">
              <Image 
                src="/mockup.png" 
                alt="DepAid Dashboard on Laptop and Phone" 
                fill
                className="object-cover"
                priority
              />
            </div>
            
            {/* Decorative Floating Badges */}
            <div className="absolute -top-6 -right-6 flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-xl shadow-slate-200/50 border border-slate-100 animate-bounce" style={{ animationDuration: '3s' }}>
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-slate-700">Cloud Synced</span>
            </div>
            <div className="absolute -bottom-6 -left-6 flex items-center gap-3 bg-white px-4 py-3 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>
              <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                <Files size={16} className="text-[#E3001B]" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Auto-Export</p>
                <p className="text-xs font-black text-slate-800">SF1, SF2, SF5</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-black text-[#111A24] mb-4">Everything you need to run your class</h2>
            <p className="text-slate-600">DepAid handles the tedious paperwork and mathematical transcriptions so you can focus strictly on teaching.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Calendar className="text-[#003876]" />}
              title="SF2 Smart Attendance"
              desc="Drop the pencil. Track daily attendance with offline support, visual calendars, and one-click 'Mark All Present'."
              bg="bg-blue-50"
            />
            <FeatureCard 
              icon={<Calculator className="text-[#E3001B]" />}
              title="Automated EC Records"
              desc="Plug in raw scores for Written Works, Performance Tasks, and QA. We transmute the final grades directly to DepEd standard."
              bg="bg-red-50"
            />
            <FeatureCard 
              icon={<LineChart className="text-amber-600" />}
              title="Composite Dashboard"
              desc="Class Advisers get real-time aggregations of 8 distinct subjects. Instantly download the official Promotion SF5 spreadsheets."
              bg="bg-amber-50"
            />
            <FeatureCard 
              icon={<BookOpen className="text-emerald-600" />}
              title="SF3 Book Issuance"
              desc="Track every Learner's Material dynamically. Never lose accountability over textbooks distributed to your sections."
              bg="bg-emerald-50"
            />
            <FeatureCard 
              icon={<Bot className="text-purple-600" />}
              title="Offline AI Assistant"
              desc="Say goodbye to the rulebook. Interrogate your app's built-in AI Assistant to ask who is failing or analyze truancy in seconds."
              bg="bg-purple-50"
            />
            <FeatureCard 
              icon={<Sparkles className="text-pink-600" />}
              title="Premium PWA Experience"
              desc="Install on Android seamlessly. Launch locally without internet, grade on the commute, and sync when you hit WiFi."
              bg="bg-pink-50"
            />
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-24 bg-[#003876] relative overflow-hidden text-center">
        <div className="absolute inset-0 bg-[url('/depaid-logo.png')] opacity-5 bg-center bg-no-repeat bg-cover grayscale" />
        <div className="max-w-2xl mx-auto px-6 relative z-10">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-6">Ready to digitize your classroom?</h2>
          <p className="text-blue-200 mb-10 text-lg">Join forward-thinking educators embracing modern technology and zero paperwork.</p>
          <Link 
            href="/login" 
            className="inline-flex items-center justify-center h-14 px-10 rounded-full bg-white text-[#003876] font-bold text-lg hover:bg-slate-50 transition-all active:scale-95 shadow-2xl"
          >
            Open Teacher Portal
          </Link>
        </div>
      </section>
    </div>
  )
}

function FeatureCard({ icon, title, desc, bg }: { icon: any, title: string, desc: string, bg: string }) {
  return (
    <div className="p-8 rounded-3xl border border-slate-100 bg-white shadow-xl shadow-slate-200/20 hover:shadow-2xl hover:shadow-slate-200/40 transition-all hover:-translate-y-1">
      <div className={`h-14 w-14 rounded-2xl flex items-center justify-center mb-6 \${bg}`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
      <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
    </div>
  )
}
