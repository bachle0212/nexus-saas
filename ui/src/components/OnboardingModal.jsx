import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wand2, Zap, CreditCard, ChevronRight, X } from 'lucide-react';

const STEPS = [
  {
    icon: <Zap className="w-8 h-8 text-amber-500" />,
    title: 'Welcome to Nexus AI!',
    desc: "You've received 100 free credits to explore all AI generation features.",
    cta: 'Get Started',
  },
  {
    icon: <Wand2 className="w-8 h-8 text-brand-500" />,
    title: 'Generate Your First Image',
    desc: 'Head to the Studio tab, type a prompt, and watch AI bring your vision to life. Each image costs 5 credits.',
    cta: 'Next',
  },
  {
    icon: <CreditCard className="w-8 h-8 text-emerald-500" />,
    title: 'Upgrade for More Power',
    desc: 'When credits run low, visit the Billing tab to subscribe to Pro or Enterprise plans for unlimited creation.',
    cta: "Let's Go!",
  },
];

export default function OnboardingModal({ onClose }) {
  const [step, setStep] = useState(0);

  const next = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
    else onClose();
  };

  const current = STEPS[step];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl w-full max-w-sm p-8 shadow-2xl relative"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
        >
          <X className="w-5 h-5" />
        </button>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="text-center"
          >
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-slate-100">
              {current.icon}
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">{current.title}</h2>
            <p className="text-slate-500 text-sm leading-relaxed mb-8">{current.desc}</p>
          </motion.div>
        </AnimatePresence>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-6">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all ${i === step ? 'bg-brand-500 w-6' : 'bg-slate-200'}`}
            />
          ))}
        </div>

        <button
          onClick={next}
          className="w-full bg-brand-600 hover:bg-brand-500 text-white py-3 rounded-xl font-bold transition flex items-center justify-center gap-2"
        >
          {current.cta} <ChevronRight className="w-4 h-4" />
        </button>
      </motion.div>
    </div>
  );
}
