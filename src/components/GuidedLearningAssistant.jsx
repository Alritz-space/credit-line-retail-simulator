import React, { useState } from 'react';
import {
  Sparkles,
  HelpCircle,
  ArrowRight,
  CheckCircle2,
  X,
  Info,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  BookOpen,
  Lightbulb,
  ShieldCheck,
  CreditCard,
  Store,
  Wallet
} from 'lucide-react';

export default function GuidedLearningAssistant({
  activeScreen,
  setActiveScreen,
  isOnboarded,
  userProfile,
  spendScore,
  lastPaymentMethod,
  cartTotal,
  cartCount,
  onSelectScenario
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeFaq, setActiveFaq] = useState(null);

  // Screen-specific guided learning details
  const GUIDED_STEPS = {
    shop: {
      step: 1,
      totalSteps: 4,
      title: 'Phase 1: Discover & Fill Shopping Basket',
      concept: 'Retail Aisle & Spend Affinity',
      shortTip: 'Add gourmet items to your basket and explore how retail purchases connect to credit eligibility.',
      explanation: 'Retail customers build a behavioral propensity score through store visits. A score > 7.0 pre-approves an instant revolving credit line capped at ₹5,000.',
      nextAction: {
        label: isOnboarded ? 'Go to Store Checkout Counter' : 'Activate ₹5,000 Pay Later Limit',
        screen: isOnboarded ? 'pos_checkout' : 'credit_hub'
      },
      faqs: [
        {
          q: 'How does retail spend qualify a shopper?',
          a: 'The scoring engine analyzes customer visit frequency and average monthly basket size. Once the propensity score exceeds 7.0, an automated pre-approved limit of ₹5,000 is sanctioned.'
        },
        {
          q: 'Can customers buy items exceeding ₹5,000?',
          a: 'Yes, with Regular Cash / Card. However, if using UrbanMart Pay Later, transactions requesting more than the available credit limit are flagged as INSUFFICIENT_LIMIT and rejected by LMS invariants.'
        }
      ]
    },
    credit_hub: {
      step: 2,
      totalSteps: 4,
      title: 'Phase 2: Pay Later Onboarding & Sanction',
      concept: '1-Click Statutory Consent & ₹5,000 Cap',
      shortTip: 'Review your pre-approved ₹5,000 credit limit and activate with simulated statutory bureau consent.',
      explanation: 'Under RBI Digital Lending Guidelines, lending contracts must be transparent with 0% interest grace (30 days) and explicit borrower consent hash recorded in the ledger.',
      nextAction: {
        label: 'Take Basket to Store Billing Counter',
        screen: 'pos_checkout'
      },
      faqs: [
        {
          q: 'Why is the credit limit strictly ₹5,000?',
          a: 'To prevent consumer debt traps in everyday grocery shopping, the underwriting model enforces a ₹5,000 revolving ceiling for retail store credit.'
        },
        {
          q: 'What if a shopper has a score ≤ 7.0 (like persona Riya)?',
          a: 'Credit activation remains DORMANT. However, the customer is never blocked: they proceed smoothly to checkout where they can pay using Regular Cash, UPI, or Card.'
        }
      ]
    },
    pos_checkout: {
      step: 3,
      totalSteps: 4,
      title: 'Phase 3: Store Checkout & Billing Counter',
      concept: 'POS Switch & NBFC Escrow Disbursal',
      shortTip: 'Choose between Pay Later (₹0 today) and Regular Cash/Card to see the difference in settlement.',
      explanation: 'When paying with Pay Later, funds disburse directly from the NBFC Disbursal Escrow (#892010) to the merchant store account. Paying with Cash bypasses lending core entirely.',
      nextAction: {
        label: lastPaymentMethod === 'credit_line' ? 'Manage Dues & Test Part Repayment' : 'Explore Bills & Repayment',
        screen: 'repayment',
        disabled: lastPaymentMethod === 'cash' || userProfile.outstandingDues <= 0
      },
      faqs: [
        {
          q: 'Why is the Repayment button disabled after paying with Cash/Card?',
          a: 'When a customer settles with Cash or Card, no loan is drawn from the lending ledger. Because zero credit dues were incurred, the bill repayment phase is disabled with an explanatory notice.'
        },
        {
          q: 'How does the receipt prove compliance?',
          a: 'The thermal POS receipt prints the LMS authorization code, remaining available credit, and confirms statutory escrow settlement.'
        }
      ]
    },
    repayment: {
      step: 4,
      totalSteps: 4,
      title: 'Phase 4: Bills & Real-Time Part Payment',
      concept: 'Ledger Restoration & Collection Escrow',
      shortTip: 'Test a part payment (e.g. ₹500 or 50%) to watch available credit restore immediately.',
      explanation: 'Borrowers can clear full dues or make partial payments. Every rupee repaid sweeps directly into the NBFC Collection Escrow (#902188) and instantly restores available credit balance.',
      nextAction: {
        label: 'View Behind-the-Scenes Architecture & Evals',
        screen: 'architecture'
      },
      faqs: [
        {
          q: 'How does Part Payment replenish my credit limit?',
          a: 'Strict ledger invariant: Available Limit + Outstanding Dues === Total Sanctioned Limit (₹5,000). Paying ₹500 reduces dues from ₹1,450 to ₹950 and immediately increases available limit from ₹3,550 to ₹4,050.'
        },
        {
          q: 'Which repayment channels are supported?',
          a: 'Digital In-App UPI (Google Pay, PhonePe), Debit Card (Visa, RuPay), or Cash handed directly to the store register cashier.'
        }
      ]
    },
    architecture: {
      step: 5,
      totalSteps: 5,
      title: 'Deep Dive: Sentinel Guardrails & Compliance Evals',
      concept: 'Statutory FinTech Integrity',
      shortTip: 'Run automated regression test suites verifying all 5 mandatory compliance guardrails.',
      explanation: 'Monitors the 5 core guardrails: RBI Escrow Routing, Arithmetic Invariant Integrity, > 7.0 Cutoff, PII Masking, and Prompt Injection Defense.',
      nextAction: {
        label: 'Return to Shopper Experience',
        screen: 'shop'
      },
      faqs: [
        {
          q: 'What are the 5 Sentinel Guardrails?',
          a: 'G1: Escrow Routing (no retailer fund parking), G2: Arithmetic Ledger Invariant, G3: Cutoff Threshold > 7.0, G4: PII Redaction, G5: Prompt Injection Interception.'
        }
      ]
    }
  };

  const current = GUIDED_STEPS[activeScreen] || GUIDED_STEPS.shop;

  return (
    <div className="mb-4 bg-gradient-to-r from-indigo-900/90 via-slate-900 to-indigo-950 text-white rounded-2xl p-3.5 sm:p-4 shadow-md border border-indigo-700/40">
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-amber-300">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-300">
                Guided Flow · Step {current.step} of 4
              </span>
              <span className="text-[10px] text-indigo-300 hidden sm:inline">({current.concept})</span>
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-white leading-tight">
              {current.title}
            </h4>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 rounded-lg hover:bg-white/10 text-indigo-200 hover:text-white transition-colors"
          title={isExpanded ? 'Minimize Guide' : 'Expand Guide'}
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Expanded Coaching Content */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-indigo-800/60 space-y-3 text-xs">
          <p className="text-indigo-100/90 leading-relaxed text-[11px] sm:text-xs">
            {current.explanation}
          </p>

          {/* Quick FAQ / Micro-Learning Accordion */}
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase tracking-wider font-bold text-indigo-300 block">
              💡 Key Learning Concepts:
            </span>
            {current.faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div key={idx} className="rounded-xl bg-indigo-950/60 border border-indigo-800/40 overflow-hidden text-[11px]">
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full p-2.5 flex justify-between items-center text-left hover:bg-indigo-900/40 transition-colors"
                  >
                    <span className="font-semibold text-indigo-200">{faq.q}</span>
                    <span className="text-indigo-400 text-xs ml-2">{isOpen ? '−' : '+'}</span>
                  </button>
                  {isOpen && (
                    <div className="p-2.5 pt-0 text-slate-300 text-[10px] sm:text-[11px] leading-relaxed border-t border-indigo-900/40">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Next Recommended Step Action Bar */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 border-t border-indigo-800/40">
            <div className="flex items-center gap-1.5 text-[11px] text-amber-200">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Recommended Next Action:</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveScreen(current.nextAction.screen)}
                disabled={current.nextAction.disabled}
                className={`w-full sm:w-auto px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow transition-all ${
                  current.nextAction.disabled
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                }`}
              >
                <span>{current.nextAction.label}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
