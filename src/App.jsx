import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Sliders,
  Smartphone,
  Store,
  RotateCcw,
  Sparkles,
  X,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  Play,
  ArrowRight,
  Wallet,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  BadgeCheck,
  Check,
  ShoppingBag,
  FileText,
  Layers,
  Terminal,
  Activity,
  Info,
  CreditCard
} from 'lucide-react';

export default function App() {
  const [currentPhase, setCurrentPhase] = useState(1);
  const [spendScore, setSpendScore] = useState(8.2);
  const [isWhitelisted, setIsWhitelisted] = useState(true);
  const [isSdkActive, setIsSdkActive] = useState(false);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [showInterviewerNotes, setShowInterviewerNotes] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);

  const [userProfile, setUserProfile] = useState({
    id: 'CUST-88391',
    name: 'Aarav Sharma',
    phone: '+91 98765 43210',
    monthlySpend: 14500,
    shoppingFrequency: 6,
    loyaltyTier: 'Gold Preferred',
    standardWalletBalance: 1250,
    creditLimit: 0,
    availableLimit: 0,
    outstandingDues: 0
  });

  const [posCart] = useState([
    { id: 1, name: 'Organic Cold-Pressed Olive Oil (1L)', price: 850, category: 'Gourmet Staples' },
    { id: 2, name: 'Basmati Rice Premium Aged (5kg)', price: 620, category: 'Food Hall' },
    { id: 3, name: 'Stainless Steel Induction Cookware Set', price: 2150, category: 'Home & Kitchen' }
  ]);
  const [posPaymentMethod, setPosPaymentMethod] = useState('credit_line');
  const [posTxnState, setPosTxnState] = useState('idle');
  const [lastReceipt, setLastReceipt] = useState(null);

  const [repaymentMethod, setRepaymentMethod] = useState('app_in_app');
  const [inAppInstrument, setInAppInstrument] = useState('upi'); // 'upi' | 'debit_card'
  const [repaymentAmount, setRepaymentAmount] = useState(0);
  const [repaymentTxnState, setRepaymentTxnState] = useState('idle');

  const [eventLogs, setEventLogs] = useState([
    {
      id: 1,
      timestamp: '09:30:12',
      service: 'Scoring Engine',
      action: 'SYSTEM_BOOTSTRAP_READY',
      payload: { status: 'INITIALIZED', model: 'Behavioral-Affinity-v3', threshold: 7.0 }
    }
  ]);
  const logsEndRef = useRef(null);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [eventLogs]);

  const showToast = (text, type = 'warning') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const addLog = (service, action, payload, status = 'success') => {
    const newEntry = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toLocaleTimeString(),
      service,
      action,
      payload,
      status
    };
    setEventLogs((prev) => [...prev, newEntry]);
  };

  const isQualified = useMemo(() => spendScore > 7.0, [spendScore]);

  const handleScoreChange = (newScore) => {
    const scoreVal = parseFloat(newScore);
    setSpendScore(scoreVal);
    const qualified = scoreVal > 7.0;
    setIsWhitelisted(qualified);

    if (!qualified) {
      setIsSdkActive(false);
      setIsOnboarded(false);
      setOnboardingStep(1);
    }
  };

  const executeLeadQualification = () => {
    addLog('Scoring Engine', 'ALGORITHMIC_SCORING_EVALUATION', {
      customerId: userProfile.id,
      monthlyAvgSpend: `₹${userProfile.monthlySpend.toLocaleString()}`,
      visitFrequency: `${userProfile.shoppingFrequency}x / month`,
      calculatedRating: spendScore,
      thresholdCondition: '> 7.0',
      qualified: isQualified
    });

    if (isQualified) {
      setTimeout(() => {
        addLog('Orchestrator', 'INGEST_QUALIFIED_LEAD_PAYLOAD', {
          batchId: 'LEAD-BATCH-2026-09A',
          leadsCount: 1,
          eligibleProfile: { id: userProfile.id, name: userProfile.name, score: spendScore }
        });
      }, 350);

      setTimeout(() => {
        addLog('Retail Core', 'STAGE_CUSTOMER_WHITELIST', {
          customerId: userProfile.id,
          sdkFlag: 'ENABLE_CREDIT_LINE_ORIGINATION',
          status: 'PRE_APPROVED_ELIGIBLE'
        });
        setIsWhitelisted(true);
      }, 700);
    } else {
      setTimeout(() => {
        addLog(
          'Retail Core',
          'CUSTOMER_NOT_WHITELISTED',
          {
            customerId: userProfile.id,
            reason: 'Score does not satisfy propensity cutoff of 7.0',
            sdkFlag: 'DORMANT_REMAIN_STANDARD_WALLET'
          },
          'warning'
        );
        setIsWhitelisted(false);
      }, 400);
    }
  };

  const handleLaunchSdk = () => {
    setIsSdkActive(true);
    setOnboardingStep(2);
    addLog('Consumer App', 'MODULAR_SDK_LOADED', {
      sdkVersion: 'v2.4.1-creditline-retail',
      hostApp: 'Retail OmniApp',
      bundleTrigger: 'User in Whitelist Table (Retail Core)'
    });
  };

  const handleKycConsentSubmit = () => {
    setOnboardingStep(2.5);
    addLog('Orchestrator', 'DISPATCH_UNDERWRITING_PAYLOAD', {
      customerId: userProfile.id,
      consentHash: 'SHA256:09fe8134bb',
      bureauPullRequired: true,
      partnerNBFC: 'Licensed NBFC Partner'
    });

    setTimeout(() => {
      addLog('Lending LOS', 'NBFC_CREDIT_POLICY_EVALUATION', {
        applicant: userProfile.name,
        retailScore: spendScore,
        decision: 'AUTO_SANCTION_APPROVED',
        sanctionedLimit: 30000,
        apr: '0% grace 30 days',
        lineType: 'Open Revolving Credit Line'
      });
    }, 600);

    setTimeout(() => {
      addLog('Lending LMS', 'CREATE_REVOLVING_CREDIT_LEDGER', {
        accountId: 'CREDITLINE-LMS-99410',
        customerId: userProfile.id,
        sanctionedBalance: 30000,
        availableBalance: 30000,
        outstandingDues: 0
      });

      addLog('Retail Core', 'SYNC_CLOSED_LOOP_WALLET_CREDIT_LINE', {
        walletId: 'RET-WAL-3001',
        mappedLmsAccount: 'CREDITLINE-LMS-99410',
        availableLimit: 30000
      });

      setIsOnboarded(true);
      setOnboardingStep(3);
      setUserProfile((prev) => ({
        ...prev,
        creditLimit: 30000,
        availableLimit: 30000,
        outstandingDues: 0
      }));
    }, 1200);
  };

  const cartTotal = useMemo(() => posCart.reduce((sum, item) => sum + item.price, 0), [posCart]);

  const handleExecutePosCheckout = () => {
    if (!isOnboarded) {
      showToast('Customer must complete Credit Line Onboarding in Phase 2 before using credit at POS!');
      return;
    }
    if (userProfile.availableLimit < cartTotal) {
      showToast(`Insufficient Credit Line limit! Available: ₹${userProfile.availableLimit.toLocaleString()}`);
      return;
    }

    setPosTxnState('checking');
    addLog('Store POS', 'INITIATE_CREDIT_LINE_CHECKOUT', {
      terminalId: 'POS-MUM-STORE-04',
      cashierId: 'CASHIER-12',
      customerMobile: userProfile.phone,
      itemCount: posCart.length,
      grossTotal: cartTotal,
      selectedMethod: 'Retail Closed-Loop Wallet (Credit Line)'
    });

    setTimeout(() => {
      addLog('Retail Core', 'TRANSACTION_BALANCE_HOLD_REQUEST', {
        storeId: 'RETAIL-SUPERSTORE-01',
        requestedAmount: cartTotal,
        queryEndpoint: 'LendingCore:LMS/v1/ledger/reserve'
      });
    }, 400);

    setTimeout(() => {
      addLog('Lending LMS', 'LEDGER_DEBIT_AND_HOLD_CONFIRMATION', {
        accountId: 'CREDITLINE-LMS-99410',
        debitHold: cartTotal,
        priorAvailable: userProfile.availableLimit,
        newAvailable: userProfile.availableLimit - cartTotal,
        newOutstandingDues: userProfile.outstandingDues + cartTotal,
        authCode: 'AUTH-98319X'
      });
    }, 900);

    setTimeout(() => {
      addLog('NBFC Escrow Bank', 'SCHEDULE_MERCHANT_DISBURSAL_ESCROW', {
        payoutFrom: 'NBFC Disbursal Escrow A/C #892010',
        payoutTo: 'Retail Store Settlement Bank A/C #110294',
        clearingBatch: 'T+1 Automated Nodal Clearing',
        amount: cartTotal
      });

      setPosTxnState('approved');
      const updatedAvail = userProfile.availableLimit - cartTotal;
      const updatedDues = userProfile.outstandingDues + cartTotal;

      setUserProfile((prev) => ({
        ...prev,
        availableLimit: updatedAvail,
        outstandingDues: updatedDues
      }));

      setLastReceipt({
        receiptNo: `REC-${Math.floor(100000 + Math.random() * 900000)}`,
        time: new Date().toLocaleTimeString(),
        items: [...posCart],
        amount: cartTotal,
        auth: 'AUTH-98319X',
        remainingCredit: updatedAvail
      });

      setRepaymentAmount(updatedDues);
    }, 1400);
  };

  const handleExecuteRepayment = () => {
    if (userProfile.outstandingDues <= 0) {
      showToast('No outstanding dues to repay!', 'info');
      return;
    }

    const payAmt = Math.min(repaymentAmount, userProfile.outstandingDues);
    setRepaymentTxnState('processing');

    if (repaymentMethod === 'app_in_app') {
      const isCard = inAppInstrument === 'debit_card';
      addLog('Consumer App', isCard ? 'PATH_A_TRIGGER_IN_APP_DEBIT_CARD' : 'PATH_A_TRIGGER_IN_APP_UPI', {
        repaymentChannel: isCard ? 'Credit Line SDK Debit Card (3DS Secure)' : 'Credit Line SDK Mobile UPI',
        instrument: isCard ? 'RuPay / Visa Platinum Debit (•••• 4821)' : 'UPI VPA (aarav@okaxis)',
        amount: payAmt,
        customerId: userProfile.id,
        targetGateway: 'Gateway Orchestrator'
      });

      setTimeout(() => {
        addLog('Orchestrator', isCard ? 'DEBIT_CARD_GATEWAY_SUCCESS_CAPTURE' : 'UPI_GATEWAY_SUCCESS_CAPTURE', {
          gatewayRef: isCard ? 'CARD-PG-3DS-9912048' : 'UPI-GATEWAY-77192408',
          authVerification: isCard ? 'OTP Verified (Bank ACS Server)' : 'UPI PIN Authenticated',
          amountDebited: payAmt,
          destinationNodal: 'NBFC Repayment Escrow A/C (Regulated Entity)'
        });
      }, 500);
    } else {
      addLog('Store POS', 'PATH_B_IN_STORE_COUNTER_REPAYMENT', {
        terminalId: 'POS-MUM-STORE-04',
        paidAtRegister: true,
        method: 'Cash/Counter Swipe',
        amountCollected: payAmt
      });

      setTimeout(() => {
        addLog('Retail Core', 'FORWARD_POS_REPAYMENT_TO_ORCHESTRATOR', {
          origin: 'POS Terminal #04',
          transactionToken: 'POS-REC-99412',
          routingTarget: 'Gateway Orchestrator'
        });
      }, 400);

      setTimeout(() => {
        addLog('Orchestrator', 'ORCHESTRATE_POS_COLLECTION_TO_ESCROW', {
          amount: payAmt,
          destinationNodal: 'NBFC Repayment Escrow A/C'
        });
      }, 700);
    }

    setTimeout(() => {
      addLog('Lending LMS', 'CREDIT_REPAYMENT_AND_REPLENISH_LIMIT', {
        accountId: 'CREDITLINE-LMS-99410',
        repaidAmount: payAmt,
        priorOutstanding: userProfile.outstandingDues,
        newOutstandingDues: userProfile.outstandingDues - payAmt,
        restoredAvailableLimit: userProfile.availableLimit + payAmt
      });
    }, 1200);

    setTimeout(() => {
      addLog('Retail Core', 'BROADCAST_RESTORED_WALLET_BALANCE', {
        walletId: 'RET-WAL-3001',
        newAvailableLimit: userProfile.availableLimit + payAmt
      });

      setUserProfile((prev) => ({
        ...prev,
        availableLimit: prev.availableLimit + payAmt,
        outstandingDues: prev.outstandingDues - payAmt
      }));
      setRepaymentTxnState('success');
      setRepaymentAmount(0);
    }, 1600);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Toast Notification Container */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 animate-bounce">
          <div
            className={`px-4 py-2.5 rounded-xl shadow-2xl border text-xs font-semibold flex items-center gap-2 ${
              toastMessage.type === 'warning'
                ? 'bg-amber-950/90 border-amber-500/50 text-amber-200'
                : 'bg-indigo-950/90 border-indigo-500/50 text-indigo-200'
            }`}
          >
            <Info className="w-4 h-4" />
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Main Top Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40 px-5 py-3">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-amber-500 p-0.5 shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Wallet className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold tracking-tight text-white">Credit Line Retail Ecosystem</h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-mono">
                  NBFC Escrow Model
                </span>
              </div>
              <p className="text-xs text-slate-400">
                End-to-End Enterprise Simulator: Proprietary Scoring, Modular App SDK, POS Auth &amp; Dual Repayments
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowInterviewerNotes((prev) => !prev)}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{showInterviewerNotes ? 'Hide Product Notes' : 'Interviewer Highlights'}</span>
            </button>
          </div>
        </div>

        {/* 4-Phase Stepper */}
        <div className="max-w-7xl mx-auto mt-3 pt-3 border-t border-slate-800/80">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { id: 1, name: 'Phase 1: Lead Gen & Scoring', sub: 'Behavioral Scoring (> 7.0)', icon: Sliders },
              { id: 2, name: 'Phase 2: Mobile SDK & Origination', sub: 'Modular App & Lending Core', icon: Smartphone },
              { id: 3, name: 'Phase 3: POS Store Checkout', sub: 'Retail Wallet & Credit Hold', icon: Store },
              { id: 4, name: 'Phase 4: Dual-Path Repayment', sub: 'App vs POS & Escrow Settled', icon: RotateCcw }
            ].map((p) => {
              const Icon = p.icon;
              const isActive = currentPhase === p.id;
              const isPassed = currentPhase > p.id;

              return (
                <button
                  key={p.id}
                  onClick={() => setCurrentPhase(p.id)}
                  className={`flex items-center gap-2.5 p-2 rounded-xl text-left transition-all border ${
                    isActive
                      ? 'bg-indigo-600/15 border-indigo-500/60 shadow-lg shadow-indigo-600/10'
                      : isPassed
                      ? 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
                      : 'bg-slate-900/20 border-slate-800/40 text-slate-500 hover:border-slate-700'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                      isActive
                        ? 'bg-indigo-600 text-white'
                        : isPassed
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isPassed ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                  </div>
                  <div className="truncate">
                    <p className={`text-xs font-bold truncate ${isActive ? 'text-white' : 'text-slate-300'}`}>{p.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{p.sub}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {}
      {showInterviewerNotes && (
        <div className="bg-indigo-950/70 border-b border-indigo-800/60 px-5 py-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-indigo-100 uppercase tracking-wider">
                  Product Management &amp; Architectural Highlights for Interviewers
                </h3>
              </div>
              <button onClick={() => setShowInterviewerNotes(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid md:grid-cols-4 gap-3 text-xs text-indigo-200/90">
              <div className="p-3 bg-slate-900/80 rounded-lg border border-indigo-500/20">
                <span className="font-semibold text-white block mb-1">1. Proprietary Behavioral Scoring</span>
                Mines existing high-frequency store basket sizes, visit frequency, and category spend to derive a 1 to 10
                rating (&gt; 7.0 cutoff). Near zero-CAC acquisition!
              </div>
              <div className="p-3 bg-slate-900/80 rounded-lg border border-indigo-500/20">
                <span className="font-semibold text-white block mb-1">2. Dormant Modular SDK Architecture</span>
                The Credit Line flow is packaged as an embedded micro-SDK in the retailer&apos;s mobile app. It remains
                hidden for standard customers (&le; 7.0) and conditionally unhides only for pre-approved users.
              </div>
              <div className="p-3 bg-slate-900/80 rounded-lg border border-indigo-500/20">
                <span className="font-semibold text-white block mb-1">3. Regulatory Escrow Isolation</span>
                The retailer operates as a Lending Service Provider (LSP). Statutory NBFC rules mandate that disbursements
                flow directly from the <strong>NBFC Disbursal Escrow</strong>, and repayments hit the{' '}
                <strong>NBFC Collection Escrow</strong>.
              </div>
              <div className="p-3 bg-slate-900/80 rounded-lg border border-indigo-500/20">
                <span className="font-semibold text-white block mb-1">4. Dual-Path Omni-Channel Repayment</span>
                Supports digital in-app repayment via <strong>UPI &amp; Debit Card</strong> (routed through Gateway Orchestrator) and in-store cash repayment (ingested by Retail POS &rarr; routed to Orchestrator &rarr; settled to NBFC LMS ledger).
              </div>
            </div>
          </div>
        </div>
      )}

      {}
      <main className="max-w-7xl mx-auto px-4 py-6 w-full flex-1 grid lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Simulation Workspace (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Phase 1 View: Lead Gen & Scoring */}
          {currentPhase === 1 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Phase 1: Algorithmic Lead Gen (Behavioral Scoring)</h2>
                    <p className="text-xs text-slate-400">Evaluate customer transaction velocity &amp; score cutoff</p>
                  </div>
                </div>
                <span className="text-xs font-mono bg-slate-800 text-slate-300 px-2.5 py-1 rounded border border-slate-700">
                  Engine: Behavioral-Scoring-v3
                </span>
              </div>

              {/* Behavioral Inputs & Scoring Slider */}
              <div className="grid md:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 block mb-1">Monthly In-Store Spend</span>
                  <p className="text-lg font-bold text-white">₹{userProfile.monthlySpend.toLocaleString()}</p>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1">
                    <ArrowUpRight className="w-3 h-3" /> Top 15% Retail Tier
                  </span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 block mb-1">Monthly Store Visits</span>
                  <p className="text-lg font-bold text-white">{userProfile.shoppingFrequency} visits</p>
                  <span className="text-[10px] text-indigo-400">Regular Weekend Shopper</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 block mb-1">Loyalty Tier</span>
                  <p className="text-lg font-bold text-amber-400">{userProfile.loyaltyTier}</p>
                  <span className="text-[10px] text-slate-400">2.4 Yrs Active Tenure</span>
                </div>
              </div>

              {/* Propensity Rating Slider */}
              <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">
                    Behavioral Spending Affinity Rating (1 to 10):
                  </label>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xl font-mono font-extrabold px-3 py-0.5 rounded-lg ${
                        isQualified
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {spendScore.toFixed(1)}
                    </span>
                    <span className="text-xs text-slate-400">&#47; 10.0</span>
                  </div>
                </div>

                <input
                  type="range"
                  min="1.0"
                  max="10.0"
                  step="0.1"
                  value={spendScore}
                  onChange={(e) => handleScoreChange(e.target.value)}
                  className="w-full accent-indigo-500 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
                />

                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>1.0 (Low Propensity &#47; Discard)</span>
                  <span className="font-semibold text-amber-400">Cut-Off Threshold: 7.0</span>
                  <span>10.0 (Ultra Prime Retail Buyer)</span>
                </div>
              </div>

              {/* Conditional Qualification Status Box */}
              <div
                className={`p-4 rounded-xl border flex items-start gap-3.5 transition-all ${
                  isQualified
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                    : 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                }`}
              >
                {isQualified ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider">
                    {isQualified ? 'Qualification Status: PRE-APPROVED LEAD' : 'Qualification Status: DISCARDED / COLD POOL'}
                  </h4>
                  <p className="text-xs mt-1 leading-relaxed opacity-90">
                    {isQualified
                      ? `Score of ${spendScore} exceeds threshold 7.0! Candidate is added to the Orchestrator payload batch and staged in Retail Core. The mobile SDK will activate for this user.`
                      : `Score of ${spendScore} is below threshold 7.0. Customer will remain on regular wallet experience. Credit Line SDK remains dormant.`}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={executeLeadQualification}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 transition-colors shadow-lg shadow-indigo-600/20"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Execute Scoring &amp; Lead Staging Job</span>
                </button>
                <button
                  onClick={() => setCurrentPhase(2)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5"
                >
                  <span>Next: View Consumer App SDK</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {}
          {currentPhase === 2 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Phase 2: Mobile App &amp; Credit Line SDK Onboarding</h2>
                    <p className="text-xs text-slate-400">Demonstrating dormant vs. active modular SDK execution</p>
                  </div>
                </div>
                <span
                  className={`text-xs px-2.5 py-1 rounded font-medium border ${
                    isWhitelisted
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  Whitelist Flag: {isWhitelisted ? 'TRUE' : 'FALSE'}
                </span>
              </div>

              {/* Smartphone Frame Simulator */}
              <div className="max-w-sm mx-auto w-full bg-slate-950 border-4 border-slate-800 rounded-3xl p-4 shadow-2xl space-y-4">
                {/* Mobile Status Bar */}
                <div className="flex justify-between items-center text-[10px] text-slate-400 px-1 border-b border-slate-800/80 pb-2">
                  <span>9:41 AM</span>
                  <div className="flex items-center gap-1">
                    <span>5G</span>
                    <div className="w-4 h-2 bg-emerald-400 rounded-sm"></div>
                  </div>
                </div>

                {/* Retail Host App Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Retail Hypermarket</span>
                    <h4 className="text-xs font-bold text-white">Hello, {userProfile.name}</h4>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-xs font-bold text-indigo-300">
                    AS
                  </div>
                </div>

                {/* Base Closed-Loop Wallet Card */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-3.5 rounded-2xl border border-slate-700 space-y-2">
                  <div className="flex justify-between items-center text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Wallet className="w-3.5 h-3.5 text-indigo-400" /> Standard Retail Wallet
                    </span>
                    <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">Closed-Loop</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">Prepaid &amp; Loyalty Cash</span>
                    <p className="text-xl font-extrabold text-white">₹{userProfile.standardWalletBalance.toLocaleString()}</p>
                  </div>
                </div>

                {/* SDK Modular Container */}
                {!isWhitelisted ? (
                  <div className="p-4 rounded-xl border border-dashed border-slate-800 bg-slate-900/30 text-center space-y-1">
                    <span className="text-[11px] font-semibold text-slate-500 block">Credit Line SDK Dormant</span>
                    <p className="text-[10px] text-slate-600">
                      Customer score &le; 7.0. No credit offer displayed. App behaves as standard shopping wallet.
                    </p>
                  </div>
                ) : !isOnboarded ? (
                  <div className="bg-gradient-to-r from-indigo-900/70 via-purple-900/60 to-slate-900 p-3.5 rounded-2xl border border-indigo-500/40 space-y-2.5">
                    <div className="flex items-center gap-1.5 text-amber-300">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-wide">Pre-Approved Credit Line</span>
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-white">Get up to ₹30,000 for Store Shopping</h5>
                      <p className="text-[10px] text-indigo-200 mt-0.5">
                        Zero interest 30-day revolving credit line powered by partner NBFC.
                      </p>
                    </div>
                    {onboardingStep === 1 && (
                      <button
                        onClick={handleLaunchSdk}
                        className="w-full py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/30 flex items-center justify-center gap-1"
                      >
                        <span>Activate Credit Line</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {onboardingStep === 2 && (
                      <div className="space-y-2 pt-1 border-t border-indigo-500/20">
                        <p className="text-[10px] text-slate-300">
                          Clicking confirm shares identity token with <strong>Lending LOS</strong> for statutory 1-click
                          sanction.
                        </p>
                        <button
                          onClick={handleKycConsentSubmit}
                          className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Accept &amp; Sanction Limit</span>
                        </button>
                      </div>
                    )}
                    {onboardingStep === 2.5 && (
                      <div className="py-3 text-center text-xs text-indigo-200 flex items-center justify-center gap-2">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                        <span>NBFC LOS underwriting in progress...</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-emerald-950 to-slate-900 p-3.5 rounded-2xl border border-emerald-500/40 space-y-3">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-bold text-emerald-400 flex items-center gap-1">
                        <BadgeCheck className="w-3.5 h-3.5" /> REVOLVING CREDIT LINE
                      </span>
                      <span className="font-mono text-slate-400">Lending LMS</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Available Credit</span>
                        <p className="text-base font-extrabold text-emerald-300">
                          ₹{userProfile.availableLimit.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Total Sanctioned</span>
                        <p className="text-base font-bold text-slate-200">
                          ₹{userProfile.creditLimit.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-400 bg-slate-950/60 p-2 rounded-lg flex justify-between items-center">
                      <span>Current Dues: ₹{userProfile.outstandingDues.toLocaleString()}</span>
                      <span className="text-emerald-400">Ready at POS Billing</span>
                    </div>
                  </div>
                )}

                {/* Quick App Navigation icons */}
                <div className="grid grid-cols-3 gap-2 text-center text-[10px] text-slate-400 pt-1">
                  <div className="p-2 bg-slate-900 rounded-xl">Offers</div>
                  <div className="p-2 bg-slate-900 rounded-xl">Orders</div>
                  <div className="p-2 bg-slate-900 rounded-xl">Scan &amp; Go</div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={() => setCurrentPhase(1)}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
                >
                  &larr; Back to Scoring
                </button>
                <button
                  onClick={() => setCurrentPhase(3)}
                  disabled={!isOnboarded}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 ${
                    isOnboarded
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <span>Proceed to In-Store POS Checkout</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {}
          {currentPhase === 3 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-lg">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Phase 3: In-Store Redemption (POS Billing Counter)</h2>
                    <p className="text-xs text-slate-400">
                      Simulate cashier scan, balance hold against LMS, &amp; merchant escrow settlement
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono bg-slate-800 text-slate-300 px-2 py-1 rounded">
                  POS #04 - Hypermarket
                </span>
              </div>

              <div className="grid md:grid-cols-12 gap-4">
                {/* POS Billing Screen */}
                <div className="md:col-span-7 bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-800">
                    <span className="font-semibold text-slate-300">Customer Cart (Scanned Items)</span>
                    <span className="text-slate-500">{posCart.length} Items</span>
                  </div>

                  <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                    {posCart.map((item) => (
                      <div key={item.id} className="flex justify-between items-center text-xs p-2 bg-slate-900/70 rounded-lg">
                        <div>
                          <p className="font-medium text-slate-200">{item.name}</p>
                          <span className="text-[10px] text-slate-400">{item.category}</span>
                        </div>
                        <span className="font-mono text-slate-100 font-bold">₹{item.price}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                    <span className="text-xs text-slate-400">Total Invoice Due:</span>
                    <span className="text-lg font-bold text-white">₹{cartTotal.toLocaleString()}</span>
                  </div>

                  {/* Payment Selection */}
                  <div className="space-y-1.5 pt-1">
                    <label className="text-[11px] font-semibold text-slate-400 block">Tender &#47; Payment Mode:</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setPosPaymentMethod('credit_line')}
                        className={`p-2 rounded-xl text-left border text-xs flex items-center justify-between ${
                          posPaymentMethod === 'credit_line'
                            ? 'bg-indigo-600/20 border-indigo-500 text-white font-bold'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        <span>Revolving Credit Line</span>
                        {posPaymentMethod === 'credit_line' && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                      </button>
                      <button
                        onClick={() => setPosPaymentMethod('cash')}
                        className={`p-2 rounded-xl text-left border text-xs flex items-center justify-between ${
                          posPaymentMethod === 'cash'
                            ? 'bg-indigo-600/20 border-indigo-500 text-white'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        <span>Regular Cash&#47;Card</span>
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleExecutePosCheckout}
                    disabled={posTxnState === 'checking' || !isOnboarded}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-1.5"
                  >
                    {posTxnState === 'checking' ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Querying LMS Balance Hold...</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Authorize POS Sale (Charge to Credit Line)</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Real-time Generated Terminal Receipt */}
                <div className="md:col-span-5 bg-amber-100 text-slate-900 p-4 rounded-xl font-mono text-[11px] shadow-md flex flex-col justify-between border-t-8 border-amber-300">
                  {lastReceipt ? (
                    <div className="space-y-2">
                      <div className="text-center border-b border-dashed border-slate-400 pb-2">
                        <p className="font-extrabold text-sm">RETAIL HYPERMARKET</p>
                        <p className="text-[10px] text-slate-600">STORE #04 - IN-STORE SALE</p>
                        <p className="text-[10px]">
                          {lastReceipt.time} | {lastReceipt.receiptNo}
                        </p>
                      </div>

                      <div className="space-y-1">
                        {lastReceipt.items.map((it, i) => (
                          <div key={i} className="flex justify-between">
                            <span className="truncate max-w-[120px]">{it.name}</span>
                            <span>₹{it.price}</span>
                          </div>
                        ))}
                      </div>

                      <div className="border-t border-dashed border-slate-400 pt-1 flex justify-between font-bold text-xs">
                        <span>TOTAL PAID:</span>
                        <span>₹{lastReceipt.amount}</span>
                      </div>

                      <div className="bg-amber-200/80 p-2 rounded text-[10px] space-y-0.5 mt-2">
                        <p className="font-bold text-slate-800">Tender: Store Revolving Credit Line</p>
                        <p>Auth Code: {lastReceipt.auth}</p>
                        <p>LMS Account: CREDITLINE-LMS-99410</p>
                        <p className="text-emerald-800 font-semibold">
                          Remaining Limit: ₹{lastReceipt.remainingCredit.toLocaleString()}
                        </p>
                      </div>

                      <p className="text-center text-[9px] text-slate-600 pt-1">
                        Settled via NBFC Disbursal Escrow A/C. Thank you for shopping!
                      </p>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-500">
                      <FileText className="w-8 h-8 mb-2 opacity-50" />
                      <p className="font-semibold text-slate-700">Receipt Printer Idle</p>
                      <p className="text-[10px]">Execute a checkout to generate itemized fiscal invoice &amp; LMS hold token</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={() => setCurrentPhase(2)}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
                >
                  &larr; Back to App View
                </button>
                <button
                  onClick={() => setCurrentPhase(4)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5"
                >
                  <span>Proceed to Repayment Phase</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {}
          {currentPhase === 4 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg">
                    <RotateCcw className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Phase 4: Dual-Path Repayment &amp; Limit Restoration</h2>
                    <p className="text-xs text-slate-400">
                      Comparing In-App (SDK &rarr; Orchestrator) vs. In-Store (POS &rarr; Retail Core &rarr; Orchestrator)
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded border border-emerald-500/30">
                  LMS Real-time Sync
                </span>
              </div>

              {/* Outstanding Dues Status Banner */}
              <div className="grid md:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 block mb-0.5">Current Outstanding Dues</span>
                  <p className="text-xl font-extrabold text-amber-400">₹{userProfile.outstandingDues.toLocaleString()}</p>
                  <span className="text-[10px] text-slate-400">Bill Cycle: 30-Day Grace</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 block mb-0.5">Available Revolving Limit</span>
                  <p className="text-xl font-extrabold text-emerald-400">₹{userProfile.availableLimit.toLocaleString()}</p>
                  <span className="text-[10px] text-slate-400">of ₹{userProfile.creditLimit.toLocaleString()} Total</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 block mb-0.5">NBFC Collection Escrow</span>
                  <p className="text-xs font-bold text-slate-300 mt-1">Escrow A&#47;C #902188</p>
                  <span className="text-[10px] text-emerald-400">Direct Nodal Sweep</span>
                </div>
              </div>

              {/* Path Selection: App vs POS */}
              <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <label className="text-xs font-semibold text-slate-300 block">Select Repayment Routing Pathway:</label>
                <div className="grid md:grid-cols-2 gap-3">
                  <div
                    onClick={() => setRepaymentMethod('app_in_app')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      repaymentMethod === 'app_in_app'
                        ? 'bg-indigo-600/20 border-indigo-500 ring-1 ring-indigo-500'
                        : 'bg-slate-900 border-slate-800 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-indigo-400" /> Path A: In-App (Mobile SDK)
                      </span>
                      {repaymentMethod === 'app_in_app' && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">
                      Consumer pays in the app using <strong>UPI</strong> or <strong>Debit Card</strong>. Request routes directly to Gateway Orchestrator.
                    </p>
                  </div>

                  <div
                    onClick={() => setRepaymentMethod('pos_counter')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      repaymentMethod === 'pos_counter'
                        ? 'bg-amber-600/20 border-amber-500 ring-1 ring-amber-500'
                        : 'bg-slate-900 border-slate-800 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Store className="w-3.5 h-3.5 text-amber-400" /> Path B: In-Store Counter
                      </span>
                      {repaymentMethod === 'pos_counter' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">
                      Shopper pays cash or card at billing counter. Request goes{' '}
                      <strong>Store POS &rarr; Retail Core &rarr; routed to Gateway Orchestrator</strong>.
                    </p>
                  </div>
                </div>

                {/* In-App Instrument Selector: UPI vs Debit Card */}
                {repaymentMethod === 'app_in_app' && (
                  <div className="pt-2 border-t border-slate-800/80 space-y-2">
                    <label className="text-[11px] font-semibold text-slate-400 block">Choose In-App Payment Instrument:</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setInAppInstrument('upi')}
                        className={`p-2.5 rounded-xl border text-xs text-left transition-all flex items-center justify-between ${
                          inAppInstrument === 'upi'
                            ? 'bg-indigo-600/20 border-indigo-500 text-white font-bold'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-extrabold text-[10px]">
                            UPI
                          </div>
                          <div>
                            <span className="block text-xs">Instant UPI</span>
                            <span className="text-[10px] text-slate-400 font-normal">GPay, PhonePe, VPA</span>
                          </div>
                        </div>
                        {inAppInstrument === 'upi' && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => setInAppInstrument('debit_card')}
                        className={`p-2.5 rounded-xl border text-xs text-left transition-all flex items-center justify-between ${
                          inAppInstrument === 'debit_card'
                            ? 'bg-purple-600/20 border-purple-500 text-white font-bold'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-purple-500/20 flex items-center justify-center text-purple-400">
                            <CreditCard className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="block text-xs">Debit Card</span>
                            <span className="text-[10px] text-slate-400 font-normal">Visa, RuPay, Master</span>
                          </div>
                        </div>
                        {inAppInstrument === 'debit_card' && <Check className="w-3.5 h-3.5 text-purple-400" />}
                      </button>
                    </div>

                    {/* Instrument Preview Badge */}
                    {inAppInstrument === 'debit_card' ? (
                      <div className="p-2.5 bg-slate-900/90 rounded-lg border border-purple-500/30 flex items-center justify-between text-xs text-slate-300">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-purple-400" />
                          <span>HDFC Bank Platinum Debit Card •••• 4821</span>
                        </div>
                        <span className="text-[10px] font-semibold text-purple-300 bg-purple-950 px-2 py-0.5 rounded border border-purple-500/30 font-mono">
                          3D Secure
                        </span>
                      </div>
                    ) : (
                      <div className="p-2.5 bg-slate-900/90 rounded-lg border border-indigo-500/30 flex items-center justify-between text-xs text-slate-300">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                          <span>aarav.sharma@okaxis (Default UPI ID)</span>
                        </div>
                        <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30 font-mono">
                          Auto-Collect
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Amount input & action */}
                <div className="flex items-center gap-3 pt-2">
                  <div className="flex-1">
                    <label className="text-[11px] text-slate-400 block mb-1">Repayment Amount (₹):</label>
                    <input
                      type="number"
                      value={repaymentAmount}
                      onChange={(e) => setRepaymentAmount(Number(e.target.value))}
                      max={userProfile.outstandingDues}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono"
                    />
                  </div>
                  <button
                    onClick={handleExecuteRepayment}
                    disabled={repaymentTxnState === 'processing' || userProfile.outstandingDues <= 0}
                    className="mt-5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl text-xs font-bold transition-all shadow-lg flex items-center gap-2"
                  >
                    {repaymentTxnState === 'processing' ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Settling Escrow &amp; LMS...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Settle Dues &amp; Restore Limit</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Real-time sync feedback */}
              {userProfile.outstandingDues === 0 && (
                <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl flex items-center gap-2 text-xs text-emerald-300">
                  <BadgeCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    All dues cleared! Revolving limit fully restored to ₹{userProfile.creditLimit.toLocaleString()} in LMS
                    ledger and app SDK.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Entity Topology Badge Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-400" /> Active System Nodes
              </span>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                5 &#47; 5 Healthy
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px]">
              <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 text-slate-300">
                <span className="font-bold block text-amber-400">Scoring Engine</span>
                Behavioral Analytics
              </div>
              <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 text-slate-300">
                <span className="font-bold block text-indigo-400">Orchestrator</span>
                Gateway Switch
              </div>
              <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 text-slate-300">
                <span className="font-bold block text-blue-400">Retail Core</span>
                Closed-Loop Wallet
              </div>
              <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 text-slate-300">
                <span className="font-bold block text-purple-400">Lending Core</span>
                NBFC LOS &amp; LMS
              </div>
              <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 text-slate-300 col-span-2 sm:col-span-2">
                <span className="font-bold block text-emerald-400">NBFC Escrow Bank</span>
                Disbursal &amp; Collection Nodal
              </div>
            </div>
          </div>

          {/* Live API Inspector Stream */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex-1 flex flex-col min-h-[420px]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Live System &amp; API Inspector</h3>
              </div>
              <button onClick={() => setEventLogs([])} className="text-[10px] text-slate-400 hover:text-slate-200">
                Clear Log
              </button>
            </div>

            {/* Event List */}
            <div className="flex-1 overflow-y-auto mt-3 space-y-2.5 max-h-[500px] pr-1 font-mono text-[11px]">
              {eventLogs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-600 p-8 space-y-2">
                  <Activity className="w-8 h-8 stroke-1 text-slate-700" />
                  <p>Telemetry Stream Awaiting Events...</p>
                  <p className="text-[10px] text-slate-600">
                    Interact with scoring slider, app KYC, or POS checkout to inspect payloads.
                  </p>
                </div>
              ) : (
                eventLogs.map((log) => {
                  let badgeColor = 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30';
                  if (log.service === 'Scoring Engine') badgeColor = 'bg-amber-500/20 text-amber-400 border-amber-500/30';
                  if (log.service.includes('Lending')) badgeColor = 'bg-purple-500/20 text-purple-400 border-purple-500/30';
                  if (log.service.includes('Escrow')) badgeColor = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
                  if (log.service === 'Store POS') badgeColor = 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
                  if (log.service === 'Retail Core') badgeColor = 'bg-blue-500/20 text-blue-400 border-blue-500/30';

                  return (
                    <div key={log.id} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/90 space-y-1.5">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className={`px-2 py-0.5 rounded font-semibold border ${badgeColor}`}>
                          {log.service}
                        </span>
                        <span className="text-slate-500">{log.timestamp}</span>
                      </div>
                      <p className="font-bold text-slate-200 text-[10px]">{log.action}</p>
                      <pre className="p-2 bg-slate-900/90 rounded text-[10px] text-slate-300 overflow-x-auto border border-slate-800">
                        {JSON.stringify(log.payload, null, 2)}
                      </pre>
                    </div>
                  );
                })
              )}
              <div ref={logsEndRef} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
