import { motion } from 'framer-motion';
import { Zap, Shield, Image as ImageIcon, Video, Code, ChevronRight, CheckCircle2, Wand2, Edit, CreditCard } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Zap className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">Nexus AI</span>
          </div>
          <div className="flex gap-4 items-center">
            <button 
              onClick={() => navigate('/login')}
              className="text-slate-600 hover:text-indigo-600 font-medium transition"
            >
              Log in
            </button>
            <button 
              onClick={() => navigate('/login')}
              className="bg-slate-900 text-white hover:bg-slate-800 px-6 py-2.5 rounded-full font-bold transition shadow-sm"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative pt-32 pb-20 overflow-hidden">
        {/* Abstract Background Effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm mb-8">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
                <span className="text-sm font-medium text-slate-600">Nexus SaaS v2.0 is now live</span>
              </div>
              
              <h1 className="text-6xl md:text-7xl font-extrabold text-slate-900 leading-[1.1] mb-8 tracking-tight">
                Build AI Products <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">At Warp Speed.</span>
              </h1>
              
              <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                Empower your workflow with a scalable, production-ready AI generative platform. Create stunning images, generate text, and orchestrate complex background jobs instantly.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <button 
                  onClick={() => navigate('/login')}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-full font-bold text-lg transition shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2"
                >
                  <Wand2 className="w-5 h-5" /> Start Generating
                </button>
                <button 
                  onClick={() => document.getElementById('features').scrollIntoView({behavior: 'smooth'})}
                  className="bg-white hover:bg-slate-50 text-slate-900 px-8 py-4 rounded-full font-bold text-lg transition border border-slate-200 shadow-sm"
                >
                  Explore Features
                </button>
              </div>
            </motion.div>
          </div>

          {/* Dashboard Preview Image mock */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-20 mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden relative"
          >
            {/* Window controls mock */}
            <div className="h-10 border-b border-slate-100 flex items-center px-4 gap-2 bg-slate-50">
              <div className="w-3 h-3 rounded-full bg-slate-300"></div>
              <div className="w-3 h-3 rounded-full bg-slate-300"></div>
              <div className="w-3 h-3 rounded-full bg-slate-300"></div>
            </div>
            {/* Fake Dashboard UI */}
            <div className="h-[400px] bg-slate-50 p-8 flex flex-col sm:flex-row gap-6">
               <div className="w-64 h-full bg-white border border-slate-100 rounded-xl hidden sm:block p-4 shadow-sm">
                  <div className="h-8 bg-slate-100 rounded w-full mb-4"></div>
                  <div className="h-4 bg-slate-100 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-slate-100 rounded w-1/2 mb-6"></div>
                  <div className="h-8 bg-indigo-50 border border-indigo-100 rounded w-full mb-2"></div>
                  <div className="h-8 bg-slate-50 rounded w-full mb-2"></div>
               </div>
               <div className="flex-1 h-full flex flex-col gap-6">
                  <div className="h-32 bg-white border border-slate-100 shadow-sm rounded-xl p-6">
                    <div className="h-4 bg-slate-200 rounded w-1/4 mb-4"></div>
                    <div className="h-2 bg-slate-200 rounded w-full mb-2"></div>
                    <div className="h-2 bg-slate-200 rounded w-3/4"></div>
                  </div>
                  <div className="flex-1 grid grid-cols-2 gap-6">
                    <div className="bg-white border border-slate-100 shadow-sm rounded-xl"></div>
                    <div className="bg-white border border-slate-100 shadow-sm rounded-xl"></div>
                  </div>
               </div>
            </div>
            {/* overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-50 via-transparent to-transparent"></div>
          </motion.div>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="py-24 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Engineered for Scale</h2>
            <p className="text-slate-600">Everything you need to deploy AI applications to production.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <ImageIcon className="w-6 h-6 text-indigo-600" />,
                title: 'Text-to-Image AI',
                desc: 'Generate photorealistic images from text prompts using cutting-edge diffusion models.'
              },
              {
                icon: <Zap className="w-6 h-6 text-amber-500" />,
                title: 'High-Performance Backend',
                desc: 'Powered by Python & FastAPI to handle concurrent ML generation requests without breaking a sweat.'
              },
              {
                icon: <CheckCircle2 className="w-6 h-6 text-emerald-500" />,
                title: 'Stripe Billing Ready',
                desc: 'Built-in credit system and subscription management via Stripe Webhooks.'
              },
              {
                icon: <Wand2 className="w-6 h-6 text-purple-500" />,
                title: 'Microservices Architecture',
                desc: 'Decoupled services for UI, API, and background workers using PM2 & Systemd.'
              },
              {
                icon: <Edit className="w-6 h-6 text-blue-500" />,
                title: 'Interactive Dashboard',
                desc: 'Sleek React Frontend with real-time generation preview and prompt history.'
              },
              {
                icon: <CreditCard className="w-6 h-6 text-rose-500" />,
                title: 'Zero-downtime Deploy',
                desc: 'Configured on Ubuntu VPS with Nginx reverse proxy and SSL.'
              }
            ].map((feat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-slate-50 p-8 rounded-2xl border border-slate-200 hover:shadow-md transition"
              >
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-6 border border-slate-200 shadow-sm">
                  {feat.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feat.title}</h3>
                <p className="text-slate-600 leading-relaxed text-sm">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden bg-slate-900">
        <div className="absolute inset-0 bg-indigo-600/20"></div>
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to accelerate your workflow?</h2>
          <p className="text-xl text-slate-300 mb-10">Join the next generation of builders using AI.</p>
          <button 
            onClick={() => navigate('/login')}
            className="bg-white text-slate-900 hover:bg-slate-100 px-10 py-4 rounded-full font-bold text-lg transition shadow-xl"
          >
            Create Your Free Account
          </button>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
             <Zap className="text-indigo-600 w-5 h-5" />
             <span className="font-bold text-slate-900">Nexus AI</span>
          </div>
          <p className="text-slate-500 text-sm">© 2026 Nexus AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
