import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  ShoppingBag,
  Store,
  CreditCard,
  RotateCcw,
  Sparkles,
  X,
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
  FileText,
  Layers,
  Terminal,
  Activity,
  Info,
  Sliders,
  Plus,
  Minus,
  Trash2,
  Lock,
  Smartphone,
  Eye,
  Settings2,
  QrCode,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  ShieldAlert,
  Laptop
} from 'lucide-react';
import GuardrailsAndEvalsView from './components/GuardrailsAndEvalsView';
import { sanitizePayload, evaluateSentinelGuardrails } from './evals/guardrailsEngine';

// Retail catalog tailored for realistic baskets with ₹5,000 max limit
const RETAIL_CATALOG = [
  {
    id: 1,
    name: 'Organic Cold-Pressed Olive Oil',
    pack: '1 Litre Glass Bottle',
    price: 680,
    mrp: 890,
    category: 'Gourmet Staples',
    badge: 'Artisanal Cold-Pressed'
  },
  {
    id: 2,
    name: 'Royal Heritage Aged Basmati Rice',
    pack: '5kg Heritage Cotton Sack',
    price: 580,
    mrp: 720,
    category: 'Rice & Pantry',
    badge: 'Aged 2 Years'
  },
  {
    id: 3,
    name: 'Single Estate Darjeeling Leaf Tea',
    pack: '250g Handcrafted Tin',
    price: 340,
    mrp: 450,
    category: 'Beverages',
    badge: 'First Flush'
  },
  {
    id: 4,
    name: 'Cold-Pressed Raw Coconut Oil',
    pack: '500ml Virgin Glass Jar',
    price: 220,
    mrp: 290,
    category: 'Gourmet Staples',
    badge: '100% Pure'
  },
  {
    id: 5,
    name: 'Tri-Ply Stainless Steel Cooking Kadai',
    pack: '2.5 Litre with Glass Lid',
    price: 1450,
    mrp: 1999,
    category: 'Kitchen Essentials',
    badge: 'Induction Ready'
  },
  {
    id: 6,
    name: 'Gourmet Roasted Almonds & Cashews',
    pack: '400g Premium Vacuum Tin',
    price: 420,
    mrp: 550,
    category: 'Snacks & Dry Fruits',
    badge: 'Slow Roasted'
  },
  {
    id: 7,
    name: 'Kashmiri Saffron & Raw Forest Honey',
    pack: '350g Sealed Honey Jar',
    price: 490,
    mrp: 620,
    category: 'Gourmet Staples',
    badge: 'Unprocessed'
  }
];

const MAX_CREDIT_LIMIT = 5000;

export default function App() {
  // Consumer screen navigation: 'shop' | 'credit_hub' | 'pos_checkout' | 'repayment' | 'architecture'
  const [activeScreen, setActiveScreen] = useState('shop');
  
  // Researcher facilitator bar state & view mode
  const [showResearcherBar, setShowResearcherBar] = useState(false); // Collapsed by default for clean UI
  const [deviceView, setDeviceView] = useState('mobile'); // 'mobile' | 'desktop'
  const [toastMessage, setToastMessage] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isCartAccordionOpen, setIsCartAccordionOpen] = useState(false);

  // Behavioral score & credit line state
  const [spendScore, setSpendScore] = useState(8.2);
  const [isWhitelisted, setIsWhitelisted] = useState(true);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [isActivatingCredit, setIsActivatingCredit] = useState(false);

  // Customer Profile (Strict max limit of ₹5,000)
  const [userProfile, setUserProfile] = useState({
    id: 'CUST-88391',
    name: 'Aarav Sharma',
    phone: '+91 98765 43210',
    monthlySpend: 14500,
    shoppingFrequency: 6,
    loyaltyTier: 'Gold Preferred Member',
    loyaltyPoints: 1420,
    standardWalletBalance: 850,
    creditLimit: 0,
    availableLimit: 0,
    outstandingDues: 0
  });

  // Shopping Cart state
  const [cartItems, setCartItems] = useState([
    { ...RETAIL_CATALOG[0], quantity: 1 },
    { ...RETAIL_CATALOG[1], quantity: 1 }
  ]);

  // POS Billing Tender
  const [posPaymentMethod, setPosPaymentMethod] = useState('credit_line'); // 'credit_line' | 'cash'
  const [posTxnState, setPosTxnState] = useState('idle'); // 'idle' | 'checking' | 'approved'
  const [lastReceipt, setLastReceipt] = useState(null);
  const [lastPaymentMethod, setLastPaymentMethod] = useState(null);

  // Repayment & Part Payment State
  const [repaymentMethod, setRepaymentMethod] = useState('app_in_app'); // 'app_in_app' | 'pos_counter'
  const [inAppInstrument, setInAppInstrument] = useState('upi'); // 'upi' | 'debit_card'
  const [repaymentAmount, setRepaymentAmount] = useState(0);
  const [repayPreset, setRepayPreset] = useState('full'); // 'full' | 'half' | '500' | 'custom'
  const [repaymentTxnState, setRepaymentTxnState] = useState('idle'); // 'idle' | 'processing' | 'success'
  const [lastRepaymentRecord, setLastRepaymentRecord] = useState(null);

  // Telemetry Audit Logs (sanitized for Guardrail 4)
  const [eventLogs, setEventLogs] = useState([
    {
      id: 1,
      timestamp: '09:30:12',
      service: 'Scoring Engine',
      action: 'SYSTEM_BOOTSTRAP_READY',
      payload: { status: 'INITIALIZED', model: 'Behavioral-Affinity-v3', threshold: 7.0, maxCreditLimit: 5000, guardrails: 'ARMED' }
    }
  ]);
  const logsEndRef = useRef(null);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [eventLogs]);

  const showToast = (text, type = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3800);
  };

  const addLog = (service, action, payload, status = 'success') => {
    const sanitized = sanitizePayload(payload);
    const newEntry = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toLocaleTimeString(),
      service,
      action,
      payload: sanitized,
      status
    };
    setEventLogs((prev) => [...prev, newEntry]);
  };

  const isQualified = useMemo(() => spendScore > 7.0, [spendScore]);

  // Enforce cash-only tender when user is not onboarded
  useEffect(() => {
    if (!isOnboarded) {
      setPosPaymentMethod('cash');
    }
  }, [isOnboarded]);

  const handleScoreChange = (newScore) => {
    const scoreVal = parseFloat(newScore);
    setSpendScore(scoreVal);
    const qualified = scoreVal > 7.0;
    setIsWhitelisted(qualified);

    if (!qualified) {
      setIsOnboarded(false);
      setPosPaymentMethod('cash');
      setUserProfile((prev) => ({
        ...prev,
        creditLimit: 0,
        availableLimit: 0
      }));
    }
  };

  // Switch persona preset for research testing
  const handleSelectPersona = (type) => {
    if (type === 'aarav') {
      setUserProfile((prev) => ({
        ...prev,
        id: 'CUST-88391',
        name: 'Aarav Sharma',
        phone: '+91 98765 43210',
        monthlySpend: 14500,
        shoppingFrequency: 6,
        loyaltyTier: 'Gold Preferred Member',
        loyaltyPoints: 1420
      }));
      setSpendScore(8.2);
      setIsWhitelisted(true);
      showToast('Loaded: Aarav Sharma (Score 8.2 · Pre-approved for ₹5,000)', 'success');
    } else if (type === 'riya') {
      setUserProfile((prev) => ({
        ...prev,
        id: 'CUST-21044',
        name: 'Riya Kapoor',
        phone: '+91 98220 11984',
        monthlySpend: 4200,
        shoppingFrequency: 2,
        loyaltyTier: 'Silver Member',
        creditLimit: 0,
        availableLimit: 0,
        outstandingDues: 0
      }));
      setSpendScore(5.4);
      setIsWhitelisted(false);
      setIsOnboarded(false);
      setPosPaymentMethod('cash');
      showToast('Loaded: Riya Kapoor (Score 5.4 · Below 7.0 Cutoff, Cash/Card only)', 'warning');
    }
  };

  const handleResetSimulator = () => {
    setUserProfile({
      id: 'CUST-88391',
      name: 'Aarav Sharma',
      phone: '+91 98765 43210',
      monthlySpend: 14500,
      shoppingFrequency: 6,
      loyaltyTier: 'Gold Preferred Member',
      loyaltyPoints: 1420,
      standardWalletBalance: 850,
      creditLimit: 0,
      availableLimit: 0,
      outstandingDues: 0
    });
    setSpendScore(8.2);
    setIsWhitelisted(true);
    setIsOnboarded(false);
    setCartItems([
      { ...RETAIL_CATALOG[0], quantity: 1 },
      { ...RETAIL_CATALOG[1], quantity: 1 }
    ]);
    setPosPaymentMethod('cash');
    setPosTxnState('idle');
    setLastReceipt(null);
    setLastPaymentMethod(null);
    setRepaymentTxnState('idle');
    setLastRepaymentRecord(null);
    setActiveScreen('shop');
    showToast('Prototype reset to fresh state', 'info');
  };

  // Cart operations
  const addToCart = (product) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    showToast(`Added ${product.name} to basket`, 'info');
  };

  const updateQuantity = (id, delta) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const cartTotal = useMemo(() => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0), [cartItems]);
  const cartSavings = useMemo(() => cartItems.reduce((sum, item) => sum + (item.mrp - item.price) * item.quantity, 0), [cartItems]);
  const cartCount = useMemo(() => cartItems.reduce((sum, item) => sum + item.quantity, 0), [cartItems]);

  const filteredCatalog = useMemo(() => {
    if (selectedCategory === 'All') return RETAIL_CATALOG;
    return RETAIL_CATALOG.filter((item) => item.category.toLowerCase().includes(selectedCategory.toLowerCase()));
  }, [selectedCategory]);

  // Activate Pay Later Credit Line (Consumer Onboarding with max limit ₹5,000)
  const handleActivatePayLater = () => {
    if (!isQualified) {
      showToast('Score does not qualify for credit line (> 7.0 cutoff)', 'warning');
      return;
    }
    setIsActivatingCredit(true);
    addLog('Orchestrator', 'INGEST_QUALIFIED_LEAD_PAYLOAD', {
      customerId: userProfile.id,
      monthlyAvgSpend: `₹${userProfile.monthlySpend.toLocaleString()}`,
      calculatedRating: spendScore,
      thresholdCondition: '> 7.0',
      maxCapSanction: MAX_CREDIT_LIMIT
    });

    setTimeout(() => {
      addLog('Lending LOS', 'NBFC_INSTANT_CREDIT_UNDERWRITING', {
        applicant: userProfile.name,
        sanctionedLimit: MAX_CREDIT_LIMIT,
        apr: '0% grace 30 days',
        lineType: 'Retail Revolving Credit Line',
        consentHash: 'SHA256:consent-ok-9941'
      });
    }, 450);

    setTimeout(() => {
      addLog('Lending LMS', 'PROVISION_REVOLVING_LEDGER', {
        accountId: 'CREDITLINE-LMS-99410',
        sanctionedBalance: MAX_CREDIT_LIMIT,
        availableBalance: MAX_CREDIT_LIMIT,
        outstandingDues: 0
      });

      setIsOnboarded(true);
      setIsActivatingCredit(false);
      setPosPaymentMethod('credit_line');
      setUserProfile((prev) => ({
        ...prev,
        creditLimit: MAX_CREDIT_LIMIT,
        availableLimit: MAX_CREDIT_LIMIT,
        outstandingDues: 0
      }));
      showToast(`🎉 Pay Later activated! ₹${MAX_CREDIT_LIMIT.toLocaleString()} limit approved.`, 'success');
    }, 1000);
  };

  // Execute POS Checkout
  const handleExecutePosCheckout = () => {
    if (cartItems.length === 0) {
      showToast('Shopping basket is empty!', 'warning');
      return;
    }

    if (posPaymentMethod === 'cash') {
      setPosTxnState('checking');
      addLog('Store POS', 'INITIATE_REGULAR_CASH_CARD_CHECKOUT', {
        terminalId: 'POS-MUM-STORE-04',
        customerMobile: userProfile.phone,
        itemCount: cartItems.length,
        grossTotal: cartTotal,
        selectedMethod: 'Regular Cash / Card'
      });

      setTimeout(() => {
        addLog('Retail Core', 'MERCHANT_CASH_CARD_DIRECT_SETTLEMENT', {
          storeId: 'RETAIL-SUPERSTORE-01',
          tender: 'Cash / Standard Card Terminal',
          amount: cartTotal,
          creditLineImpact: 'NONE - Bypassed LMS & Disbursal Escrow',
          status: 'PAID_IN_FULL'
        });
        setPosTxnState('approved');
        setLastPaymentMethod('cash');
        setLastReceipt({
          receiptNo: `REC-${Math.floor(100000 + Math.random() * 900000)}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          items: [...cartItems],
          amount: cartTotal,
          auth: 'CASH-TXN-OK',
          tender: 'Regular Cash / Card',
          remainingCredit: userProfile.availableLimit
        });
        showToast('Payment successful via Cash / Card at register!', 'success');
      }, 800);
      return;
    }

    // Credit line payment path
    if (!isOnboarded) {
      showToast('Please activate UrbanMart Pay Later before selecting credit checkout!', 'warning');
      return;
    }
    if (userProfile.availableLimit < cartTotal) {
      showToast(`Insufficient Pay Later limit! Available: ₹${userProfile.availableLimit.toLocaleString()}`, 'warning');
      return;
    }

    setPosTxnState('checking');
    addLog('Store POS', 'INITIATE_CREDIT_LINE_CHECKOUT', {
      terminalId: 'POS-MUM-STORE-04',
      customerMobile: userProfile.phone,
      itemCount: cartItems.length,
      grossTotal: cartTotal,
      selectedMethod: 'UrbanMart Pay Later'
    });

    setTimeout(() => {
      addLog('Lending LMS', 'LEDGER_DEBIT_AND_HOLD_CONFIRMATION', {
        accountId: 'CREDITLINE-LMS-99410',
        debitHold: cartTotal,
        priorAvailable: userProfile.availableLimit,
        newAvailable: userProfile.availableLimit - cartTotal,
        newOutstandingDues: userProfile.outstandingDues + cartTotal,
        authCode: 'AUTH-98319X'
      });
    }, 450);

    setTimeout(() => {
      addLog('NBFC Escrow Bank', 'SCHEDULE_MERCHANT_DISBURSAL_ESCROW', {
        payoutFrom: 'NBFC Disbursal Escrow A/C #892010',
        payoutTo: 'Retail Store Settlement Bank A/C #110294',
        amount: cartTotal
      });

      setPosTxnState('approved');
      setLastPaymentMethod('credit_line');
      const updatedAvail = userProfile.availableLimit - cartTotal;
      const updatedDues = userProfile.outstandingDues + cartTotal;

      setUserProfile((prev) => ({
        ...prev,
        availableLimit: updatedAvail,
        outstandingDues: updatedDues
      }));

      setLastReceipt({
        receiptNo: `REC-${Math.floor(100000 + Math.random() * 900000)}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        items: [...cartItems],
        amount: cartTotal,
        auth: 'AUTH-98319X',
        tender: 'UrbanMart Pay Later',
        remainingCredit: updatedAvail
      });

      setRepaymentAmount(updatedDues);
      setRepayPreset('full');
      showToast('Order confirmed! ₹0 paid today charged to Pay Later.', 'success');
    }, 1000);
  };

  // Helper to handle part payment presets
  const handleSelectRepayPreset = (preset) => {
    setRepayPreset(preset);
    const totalDues = userProfile.outstandingDues;
    if (totalDues <= 0) return;

    if (preset === 'full') {
      setRepaymentAmount(totalDues);
    } else if (preset === 'half') {
      setRepaymentAmount(Math.round(totalDues / 2));
    } else if (preset === '500') {
      setRepaymentAmount(Math.min(500, totalDues));
    }
  };

  // Execute Bill Repayment (Full or Part Payment)
  const handleExecuteRepayment = () => {
    if (userProfile.outstandingDues <= 0) {
      showToast('No outstanding bill dues to repay!', 'info');
      return;
    }

    const payAmt = Math.min(Math.max(1, repaymentAmount), userProfile.outstandingDues);
    const isPartPayment = payAmt < userProfile.outstandingDues;
    const remainingDues = userProfile.outstandingDues - payAmt;
    const restoredAvailable = userProfile.availableLimit + payAmt;

    setRepaymentTxnState('processing');

    if (repaymentMethod === 'app_in_app') {
      const isCard = inAppInstrument === 'debit_card';
      addLog('Consumer App', isCard ? 'TRIGGER_IN_APP_DEBIT_CARD' : 'TRIGGER_IN_APP_UPI', {
        repaymentType: isPartPayment ? 'PARTIAL_BILL_REPAYMENT' : 'FULL_BILL_CLEARANCE',
        instrument: isCard ? 'Visa Platinum (•••• 4821)' : 'UPI (aarav@okaxis)',
        amount: payAmt,
        targetGateway: 'Gateway Orchestrator'
      });

      setTimeout(() => {
        addLog('Orchestrator', isCard ? 'DEBIT_CARD_GATEWAY_SUCCESS' : 'UPI_GATEWAY_SUCCESS', {
          amountDebited: payAmt,
          destinationNodal: 'NBFC Collection Escrow A/C #902188'
        });
      }, 400);
    } else {
      addLog('Store POS', 'IN_STORE_COUNTER_CASH_REPAYMENT', {
        terminalId: 'POS-MUM-STORE-04',
        repaymentType: isPartPayment ? 'PARTIAL_BILL_REPAYMENT' : 'FULL_BILL_CLEARANCE',
        amountCollected: payAmt
      });

      setTimeout(() => {
        addLog('Orchestrator', 'ORCHESTRATE_POS_COLLECTION_TO_ESCROW', {
          amount: payAmt,
          destinationNodal: 'NBFC Collection Escrow A/C #902188'
        });
      }, 400);
    }

    setTimeout(() => {
      addLog('Lending LMS', 'RESTORE_REVOLVING_LIMIT_LEDGER', {
        accountId: 'CREDITLINE-LMS-99410',
        repaymentType: isPartPayment ? 'PART_PAYMENT' : 'FULL_PAYMENT',
        repaidAmount: payAmt,
        newOutstandingDues: remainingDues,
        restoredAvailableLimit: restoredAvailable,
        ledgerInvariant: `${restoredAvailable} + ${remainingDues} === ${MAX_CREDIT_LIMIT}`
      });

      setUserProfile((prev) => ({
        ...prev,
        availableLimit: restoredAvailable,
        outstandingDues: remainingDues
      }));

      setLastRepaymentRecord({
        paidAmount: payAmt,
        isPart: isPartPayment,
        remainingDues: remainingDues,
        restoredAvailable: restoredAvailable,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        channel: repaymentMethod === 'app_in_app' ? (inAppInstrument === 'upi' ? 'UPI' : 'Debit Card') : 'Store Cash Counter'
      });

      setRepaymentTxnState('success');
      setRepaymentAmount(remainingDues);
      setRepayPreset('full');

      if (isPartPayment) {
        showToast(`Part payment of ₹${payAmt.toLocaleString()} successful! Limit restored by ₹${payAmt.toLocaleString()}.`, 'success');
      } else {
        showToast('All bill dues cleared! Full ₹5,000 credit limit is available.', 'success');
      }
    }, 950);
  };

  const isRepaymentDisabled = lastPaymentMethod === 'cash' || userProfile.outstandingDues <= 0;

  // Render Screen Content
  const renderScreen = () => {
    switch (activeScreen) {
      case 'shop':
        return (
          <div className="space-y-4 pb-20">
            {/* Consumer Pay Later Nudge Banner */}
            <div className="rounded-2xl bg-gradient-to-br from-emerald-800 via-teal-900 to-slate-900 text-white p-4 sm:p-5 shadow-sm relative overflow-hidden">
              <div className="relative z-10 space-y-2">
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[11px] font-semibold">
                  <Sparkles className="w-3 h-3" />
                  <span>UrbanMart Pay Later · 0% Interest</span>
                </div>
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-white leading-snug">
                  Shop Today. Pay Next Month with ₹0 Extra Fees.
                </h1>
                <p className="text-xs text-emerald-100/90 leading-relaxed">
                  {isWhitelisted
                    ? `Pre-approved for ₹5,000 credit limit with instant 1-tap activation.`
                    : 'Shop with Cash or Card. Frequent shoppers unlock up to ₹5,000 credit.'}
                </p>

                <div className="pt-1 flex items-center gap-2 flex-wrap">
                  {isWhitelisted && !isOnboarded ? (
                    <button
                      onClick={() => setActiveScreen('credit_hub')}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs shadow flex items-center gap-1 transition-all"
                    >
                      <span>Activate ₹5,000 Limit</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : isOnboarded ? (
                    <div className="px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[11px] font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Available Credit: ₹{userProfile.availableLimit.toLocaleString()}</span>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Category Pills (Horizontal scrolling) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
              {['All', 'Gourmet Staples', 'Rice & Pantry', 'Beverages', 'Kitchen Essentials'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-full whitespace-nowrap transition-all font-medium text-xs shrink-0 ${
                    selectedCategory === cat
                      ? 'bg-emerald-600 text-white font-bold shadow-sm'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Product Catalog Grid */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {filteredCatalog.map((item) => {
                const inCart = cartItems.find((c) => c.id === item.id);
                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all"
                  >
                    <div className="space-y-1.5">
                      <div className="h-24 rounded-lg bg-slate-50 border border-slate-100 flex flex-col items-center justify-center p-2 text-center relative">
                        <span className="text-[9px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-full absolute top-1.5 right-1.5">
                          {item.badge}
                        </span>
                        <ShoppingBag className="w-6 h-6 text-slate-400 mb-1" />
                        <span className="text-[10px] text-slate-500 line-clamp-1">{item.pack}</span>
                      </div>

                      <h3 className="text-xs font-bold text-slate-800 line-clamp-2 leading-tight min-h-[32px]">
                        {item.name}
                      </h3>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between mt-2">
                      <div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-sm font-bold text-slate-900 font-mono">₹{item.price}</span>
                          <span className="text-[10px] text-slate-400 line-through font-mono">₹{item.mrp}</span>
                        </div>
                      </div>

                      {inCart ? (
                        <div className="flex items-center gap-1.5 bg-slate-100 px-1.5 py-0.5 rounded-lg border border-slate-200 text-xs font-bold">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="p-1 rounded hover:bg-slate-200 text-slate-700"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-3.5 text-center font-mono text-[11px]">{inCart.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="p-1 rounded hover:bg-slate-200 text-slate-700"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(item)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-0.5 shadow-sm transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Floating Mobile Cart Bar */}
            {cartCount > 0 && (
              <div className="fixed bottom-16 left-0 right-0 max-w-md mx-auto px-4 z-30">
                <button
                  onClick={() => setActiveScreen('pos_checkout')}
                  className="w-full py-3 px-4 rounded-xl bg-slate-950 text-white shadow-xl flex items-center justify-between hover:bg-slate-900 transition-all border border-slate-800"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950 font-bold text-xs">
                      {cartCount}
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold leading-none">Basket Total: ₹{cartTotal.toLocaleString()}</p>
                      <p className="text-[10px] text-emerald-400 font-medium">Saved ₹{cartSavings.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold text-emerald-400">
                    <span>Checkout</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </button>
              </div>
            )}
          </div>
        );

      case 'credit_hub':
        return (
          <div className="space-y-4 pb-20">
            <div className="flex items-center justify-between pb-1">
              <div>
                <h2 className="text-lg font-bold text-slate-900">UrbanMart Pay Later</h2>
                <p className="text-xs text-slate-500">Revolving store credit line · Max ₹5,000</p>
              </div>
              <button
                onClick={() => setActiveScreen('shop')}
                className="text-xs text-slate-600 hover:text-slate-900 font-semibold"
              >
                &larr; Shop
              </button>
            </div>

            {/* Digital Store Credit Card */}
            <div className="rounded-2xl bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 text-white p-5 shadow-lg border border-emerald-900/40 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 block mb-0.5">
                    Store Revolving Line
                  </span>
                  <h3 className="text-base font-extrabold tracking-tight">UrbanMart Pay Later</h3>
                </div>
                <div className="w-8 h-6 rounded bg-amber-400/90 border border-amber-300 flex items-center justify-center shadow-inner">
                  <div className="w-5 h-3.5 border border-amber-600/60 rounded-[2px]"></div>
                </div>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 block mb-0.5">Available Credit Balance</span>
                <p className="text-2xl font-extrabold font-mono text-emerald-400">
                  ₹{userProfile.availableLimit.toLocaleString()}
                </p>
                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                  <div
                    className="bg-emerald-400 h-full transition-all duration-500"
                    style={{
                      width: userProfile.creditLimit > 0 ? `${(userProfile.availableLimit / userProfile.creditLimit) * 100}%` : '0%'
                    }}
                  ></div>
                </div>
              </div>

              <div className="flex justify-between items-end text-[11px] pt-2 border-t border-slate-800">
                <div>
                  <span className="text-[9px] text-slate-400 block">CARDHOLDER</span>
                  <span className="font-semibold text-slate-200">{userProfile.name}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 block">TOTAL SANCTIONED</span>
                  <span className="font-mono font-semibold text-slate-300">₹{userProfile.creditLimit.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 block">RATE</span>
                  <span className="font-semibold text-emerald-400">0% (30-Day)</span>
                </div>
              </div>
            </div>

            {/* Account Status Card */}
            {!isOnboarded ? (
              <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                      {isWhitelisted ? 'Instant 1-Click Pay Later Activation' : 'Pay Later Status: Invite-Only'}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      {isWhitelisted
                        ? 'Based on your store visits, our RBI-regulated NBFC partner has pre-approved an instant ₹5,000 credit limit.'
                        : 'Your behavioral score (≤ 7.0 cutoff) is not currently eligible for Pay Later. You can proceed with Cash or Card checkout.'}
                    </p>
                  </div>
                </div>

                {isWhitelisted ? (
                  <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
                    <div className="text-[10px] text-slate-500 flex items-center gap-2">
                      <span>✓ Statutory Bureau Consent</span> · <span>✓ Zero paperwork</span>
                    </div>
                    <button
                      onClick={handleActivatePayLater}
                      disabled={isActivatingCredit}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow flex items-center justify-center gap-1.5 transition-all"
                    >
                      {isActivatingCredit ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Sanctioning ₹5,000 Limit...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Accept &amp; Activate ₹5,000 Limit</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-[11px] text-amber-900 flex items-center justify-between">
                    <span>Credit line locked for this account.</span>
                    <button
                      onClick={() => setActiveScreen('pos_checkout')}
                      className="font-bold underline text-amber-950"
                    >
                      Checkout with Cash &rarr;
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs">
                    <BadgeCheck className="w-4 h-4" />
                    <span>Pay Later Limit Active</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">#LMS-99410</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-snug">
                  Use your ₹{userProfile.availableLimit.toLocaleString()} available credit at checkout with 1 tap.
                </p>
                <div className="pt-1 flex items-center gap-2">
                  <button
                    onClick={() => setActiveScreen('pos_checkout')}
                    className="flex-1 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow flex items-center justify-center gap-1 transition-colors"
                  >
                    <Store className="w-3.5 h-3.5" />
                    <span>Go to Checkout</span>
                  </button>
                  {userProfile.outstandingDues > 0 && (
                    <button
                      onClick={() => setActiveScreen('repayment')}
                      className="px-3 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold text-xs transition-colors"
                    >
                      <span>Pay Bill (₹{userProfile.outstandingDues.toLocaleString()})</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Value Props */}
            <div className="grid grid-cols-3 gap-2 text-center text-[10px] text-slate-600">
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <span className="font-bold text-slate-900 block mb-0.5">₹5,000 Cap</span>
                Safe grocery limit
              </div>
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <span className="font-bold text-slate-900 block mb-0.5">Part Payments</span>
                Pay what you want
              </div>
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <span className="font-bold text-slate-900 block mb-0.5">RBI Escrow</span>
                100% compliant
              </div>
            </div>
          </div>
        );

      case 'pos_checkout':
        return (
          <div className="space-y-4 pb-20">
            <div className="flex items-center justify-between pb-1">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Store Checkout Counter</h2>
                <p className="text-xs text-slate-500">Scan &amp; Pay Register #04 · Mumbai Store</p>
              </div>
              <button
                onClick={() => setActiveScreen('shop')}
                className="text-xs text-slate-600 hover:text-slate-900 font-semibold"
              >
                &larr; Basket ({cartCount})
              </button>
            </div>

            {/* Accordion Basket Summary */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-xs">
              <button
                onClick={() => setIsCartAccordionOpen(!isCartAccordionOpen)}
                className="w-full p-3 flex justify-between items-center text-left hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-slate-800">Scanned Items ({cartCount})</span>
                </div>
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <span>₹{cartTotal.toLocaleString()}</span>
                  {isCartAccordionOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </div>
              </button>

              {isCartAccordionOpen && (
                <div className="p-3 pt-0 border-t border-slate-100 space-y-1.5 max-h-40 overflow-y-auto">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-center py-1 border-b border-slate-50 last:border-none">
                      <span className="text-slate-700 truncate max-w-[180px]">{item.name} × {item.quantity}</span>
                      <span className="font-mono font-bold text-slate-900">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Total Invoice Banner */}
            <div className="p-3.5 rounded-xl bg-slate-900 text-white flex justify-between items-center shadow-sm">
              <span className="text-xs text-slate-300">Total Invoice Due:</span>
              <span className="text-xl font-extrabold font-mono text-emerald-400">₹{cartTotal.toLocaleString()}</span>
            </div>

            {/* Payment Method Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 block">Select Payment Mode:</label>

              {/* Pay Later Tender */}
              <button
                type="button"
                disabled={!isOnboarded || cartTotal > userProfile.availableLimit}
                onClick={() => {
                  if (isOnboarded && cartTotal <= userProfile.availableLimit) {
                    setPosPaymentMethod('credit_line');
                  }
                }}
                className={`w-full p-3 rounded-xl border text-left transition-all flex items-start justify-between ${
                  !isOnboarded || cartTotal > userProfile.availableLimit
                    ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                    : posPaymentMethod === 'credit_line'
                    ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900">UrbanMart Pay Later</span>
                    {isOnboarded && cartTotal <= userProfile.availableLimit && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold">
                        0% Interest
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {isOnboarded
                      ? cartTotal > userProfile.availableLimit
                        ? `Exceeds available limit! (Available: ₹${userProfile.availableLimit.toLocaleString()})`
                        : `Pay ₹0 today · Available credit: ₹${userProfile.availableLimit.toLocaleString()}`
                      : 'Unavailable (Score ≤ 7.0 or not activated)'}
                  </p>
                </div>
                {posPaymentMethod === 'credit_line' && <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
              </button>

              {/* Regular Cash / Card Tender */}
              <button
                type="button"
                onClick={() => setPosPaymentMethod('cash')}
                className={`w-full p-3 rounded-xl border text-left transition-all flex items-start justify-between ${
                  posPaymentMethod === 'cash'
                    ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900">Regular Cash / Debit Card</span>
                    {!isOnboarded && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-bold">
                        Active Tender
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Pay ₹{cartTotal.toLocaleString()} now at the register with cash or card.
                  </p>
                </div>
                {posPaymentMethod === 'cash' && <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
              </button>

              {!isOnboarded && (
                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>Customer score is below 7.0 cutoff. Only Cash/Card checkout is available.</span>
                </div>
              )}
            </div>

            {/* Authorize Button */}
            <button
              onClick={handleExecutePosCheckout}
              disabled={posTxnState === 'checking' || (posPaymentMethod === 'credit_line' && (!isOnboarded || cartTotal > userProfile.availableLimit))}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-xs font-bold transition-all shadow flex items-center justify-center gap-1.5"
            >
              {posTxnState === 'checking' ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Authorizing Checkout...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {posPaymentMethod === 'cash'
                      ? `Pay ₹${cartTotal.toLocaleString()} at Counter (Cash/Card)`
                      : `Confirm ₹${cartTotal.toLocaleString()} with Pay Later`}
                  </span>
                </>
              )}
            </button>

            {/* Printed Store Receipt Display */}
            {lastReceipt && (
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2.5 font-mono text-[11px]">
                <div className="text-center pb-2 border-b border-dashed border-slate-200">
                  <span className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold block">Store POS #04</span>
                  <h4 className="text-xs font-extrabold text-slate-900">URBANMART HYPERSTORE</h4>
                  <p className="text-[9px] text-slate-500">{lastReceipt.receiptNo} · {lastReceipt.time}</p>
                </div>

                <div className="space-y-1 py-1 border-b border-dashed border-slate-200 text-[10px]">
                  {lastReceipt.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span className="truncate max-w-[150px]">{it.name} ×{it.quantity}</span>
                      <span>₹{it.price * it.quantity}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-bold text-xs pt-1 border-t border-slate-100">
                    <span>TOTAL:</span>
                    <span>₹{lastReceipt.amount.toLocaleString()}</span>
                  </div>
                </div>

                <div className="p-2 rounded bg-slate-50 border border-slate-150 text-[10px] space-y-0.5">
                  <p className="font-bold text-slate-800">Tender: {lastReceipt.tender}</p>
                  {lastReceipt.tender === 'Regular Cash / Card' ? (
                    <p className="text-emerald-700 font-semibold">Credit Dues Incurred: ₹0</p>
                  ) : (
                    <p className="text-emerald-700 font-semibold">Remaining Limit: ₹{lastReceipt.remainingCredit.toLocaleString()}</p>
                  )}
                </div>

                {/* Repayment Navigation State */}
                <div className="pt-2 border-t border-slate-100">
                  {lastPaymentMethod === 'cash' ? (
                    <div className="p-2 rounded bg-amber-50 border border-amber-200 text-amber-900 text-[10px] flex items-center gap-1.5 mb-2">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                      <span>Repayment disabled: Paid with Cash/Card (Credit Line was not used).</span>
                    </div>
                  ) : null}

                  <button
                    onClick={() => setActiveScreen('repayment')}
                    disabled={isRepaymentDisabled}
                    className={`w-full py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      isRepaymentDisabled
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                        : 'bg-slate-900 hover:bg-slate-800 text-white shadow'
                    }`}
                  >
                    <span>Proceed to Bill Repayment Phase</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      case 'repayment':
        return (
          <div className="space-y-4 pb-20">
            <div className="flex items-center justify-between pb-1">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Manage Dues &amp; Repay</h2>
                <p className="text-xs text-slate-500">Pay full or partial amount to restore your limit</p>
              </div>
              <button
                onClick={() => setActiveScreen('pos_checkout')}
                className="text-xs text-slate-600 hover:text-slate-900 font-semibold"
              >
                &larr; Checkout
              </button>
            </div>

            {/* Bill Summary Banner */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-[10px] text-slate-500 block mb-0.5">Outstanding Bill</span>
                <p className="text-xl font-extrabold text-amber-600 font-mono">
                  ₹{userProfile.outstandingDues.toLocaleString()}
                </p>
                <span className="text-[9px] text-emerald-600 font-medium">30-Day Zero Interest</span>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-[10px] text-slate-500 block mb-0.5">Available Credit</span>
                <p className="text-xl font-extrabold text-emerald-600 font-mono">
                  ₹{userProfile.availableLimit.toLocaleString()}
                </p>
                <span className="text-[9px] text-slate-400">Total Limit: ₹{MAX_CREDIT_LIMIT.toLocaleString()}</span>
              </div>
            </div>

            {/* Part Payment Form Card */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900">How much to pay today?</label>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    Part Payments Allowed
                  </span>
                </div>

                {/* Preset Chips */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectRepayPreset('full')}
                    className={`p-2 rounded-lg border text-xs font-bold text-left transition-all ${
                      repayPreset === 'full'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-2 ring-emerald-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <span className="block text-[9px] font-normal text-slate-500">Full Bill</span>
                    <span>₹{userProfile.outstandingDues.toLocaleString()}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectRepayPreset('half')}
                    className={`p-2 rounded-lg border text-xs font-bold text-left transition-all ${
                      repayPreset === 'half'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-2 ring-emerald-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <span className="block text-[9px] font-normal text-slate-500">50% Part</span>
                    <span>₹{Math.round(userProfile.outstandingDues / 2).toLocaleString()}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectRepayPreset('500')}
                    className={`p-2 rounded-lg border text-xs font-bold text-left transition-all ${
                      repayPreset === '500'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-2 ring-emerald-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <span className="block text-[9px] font-normal text-slate-500">Quick Pay</span>
                    <span>₹500</span>
                  </button>
                </div>

                {/* Amount Input */}
                <div className="relative pt-1">
                  <span className="absolute left-3 top-3.5 text-xs font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    min="1"
                    max={userProfile.outstandingDues}
                    value={repaymentAmount || ''}
                    onChange={(e) => {
                      setRepaymentAmount(Number(e.target.value));
                      setRepayPreset('custom');
                    }}
                    placeholder="Enter repayment amount"
                    className="w-full pl-7 pr-16 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleSelectRepayPreset('full')}
                    className="absolute right-2 top-2.5 text-[10px] bg-slate-200 hover:bg-slate-300 text-slate-700 px-2 py-0.5 rounded font-semibold"
                  >
                    Max
                  </button>
                </div>

                {/* Dynamic Preview */}
                {userProfile.outstandingDues > 0 && repaymentAmount > 0 && (
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] space-y-1">
                    <div className="flex justify-between text-slate-600">
                      <span>Paying Now:</span>
                      <span className="font-mono font-bold text-emerald-700">₹{Math.min(repaymentAmount, userProfile.outstandingDues).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Remaining Bill After:</span>
                      <span className="font-mono font-bold text-amber-700">
                        ₹{Math.max(0, userProfile.outstandingDues - repaymentAmount).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600 border-t border-slate-200 pt-1">
                      <span>Restored Limit:</span>
                      <span className="font-mono font-bold text-emerald-700">
                        ₹{Math.min(MAX_CREDIT_LIMIT, userProfile.availableLimit + repaymentAmount).toLocaleString()} / ₹{MAX_CREDIT_LIMIT.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Channel Choice */}
              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                <span className="font-bold text-slate-800 block">Payment Mode:</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRepaymentMethod('app_in_app');
                      setInAppInstrument('upi');
                    }}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      repaymentMethod === 'app_in_app' && inAppInstrument === 'upi'
                        ? 'bg-emerald-50 border-emerald-500 font-bold text-slate-900'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    <span className="block text-[11px]">Instant UPI</span>
                    <span className="text-[9px] text-slate-400">GPay / PhonePe</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRepaymentMethod('app_in_app');
                      setInAppInstrument('debit_card');
                    }}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      repaymentMethod === 'app_in_app' && inAppInstrument === 'debit_card'
                        ? 'bg-emerald-50 border-emerald-500 font-bold text-slate-900'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    <span className="block text-[11px]">Debit Card</span>
                    <span className="text-[9px] text-slate-400">Visa / RuPay</span>
                  </button>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={handleExecuteRepayment}
                disabled={repaymentTxnState === 'processing' || userProfile.outstandingDues <= 0 || repaymentAmount <= 0}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-xs font-bold transition-all shadow flex items-center justify-center gap-1.5"
              >
                {repaymentTxnState === 'processing' ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing Settlement...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>
                      {repaymentAmount < userProfile.outstandingDues
                        ? `Make Part Payment of ₹${repaymentAmount.toLocaleString()}`
                        : `Pay Full Bill of ₹${userProfile.outstandingDues.toLocaleString()}`}
                    </span>
                  </>
                )}
              </button>

              {/* Feedback Record */}
              {lastRepaymentRecord && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] text-emerald-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                    <BadgeCheck className="w-4 h-4 text-emerald-600" />
                    <span>{lastRepaymentRecord.isPart ? 'Part Payment Confirmed!' : 'Bill Cleared!'}</span>
                  </div>
                  <p>
                    Paid ₹{lastRepaymentRecord.paidAmount.toLocaleString()} via {lastRepaymentRecord.channel}.
                    Available limit restored to <strong>₹{lastRepaymentRecord.restoredAvailable.toLocaleString()}</strong>.
                    {lastRepaymentRecord.remainingDues > 0
                      ? ` Remaining dues: ₹${lastRepaymentRecord.remainingDues.toLocaleString()}.`
                      : ' Full ₹5,000 credit limit is now available.'}
                  </p>
                </div>
              )}

              {userProfile.outstandingDues === 0 && !lastRepaymentRecord && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-1.5 text-xs text-emerald-800">
                  <BadgeCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>All dues cleared! Your ₹5,000 credit limit is fully restored.</span>
                </div>
              )}
            </div>
          </div>
        );

      case 'architecture':
        return (
          <div className="space-y-4 pb-12">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">Sentinel Evals &amp; Architecture</h2>
                <p className="text-xs text-slate-500">Compliance engine, LMS ledger invariants, and regression tests</p>
              </div>
              <button
                onClick={() => setActiveScreen('shop')}
                className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
              >
                &larr; Shopper App
              </button>
            </div>

            <GuardrailsAndEvalsView userProfile={userProfile} />

            {/* Live Telemetry Inspector */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-white space-y-2.5">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <div className="flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider">Live System Audit Stream</h3>
                </div>
                <button onClick={() => setEventLogs([])} className="text-[10px] text-slate-400 hover:text-white">
                  Clear
                </button>
              </div>

              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center text-[11px] font-mono">
                <span className="text-slate-400">
                  Invariant: ₹{userProfile.availableLimit.toLocaleString()} + ₹{userProfile.outstandingDues.toLocaleString()} = ₹{userProfile.creditLimit.toLocaleString()}
                </span>
                <span className="text-emerald-400 font-bold">✓ Balanced</span>
              </div>

              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1 font-mono text-[10px]">
                {eventLogs.map((log) => (
                  <div key={log.id} className="p-2 rounded-lg bg-slate-950 border border-slate-800 space-y-0.5">
                    <div className="flex justify-between items-center text-[9px]">
                      <span className="text-emerald-400 font-semibold">{log.service}</span>
                      <span className="text-slate-500">{log.timestamp}</span>
                    </div>
                    <p className="font-bold text-slate-300">{log.action}</p>
                    <pre className="p-1.5 bg-slate-900 rounded text-[9px] text-slate-400 overflow-x-auto">
                      {JSON.stringify(log.payload, null, 2)}
                    </pre>
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Toast Notification Container */}
      {toastMessage && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-sm animate-bounce">
          <div
            className={`px-3.5 py-2 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-2 ${
              toastMessage.type === 'warning'
                ? 'bg-amber-50 border-amber-300 text-amber-900'
                : toastMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-indigo-50 border-indigo-300 text-indigo-900'
            }`}
          >
            <Info className="w-4 h-4 shrink-0" />
            <span className="truncate">{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* COMPACT & COLLAPSIBLE RESEARCH FACILITATOR BAR */}
      <div className="bg-slate-900 text-slate-200 border-b border-slate-800 text-xs px-3 py-1.5 z-40 sticky top-0 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          {/* Left: Facilitator Status & Persona Quick Toggle */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowResearcherBar(!showResearcherBar)}
              className="flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:text-amber-300"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>Research Controls</span>
              {showResearcherBar ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {/* Quick Persona Pills */}
            <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-lg border border-slate-700">
              <button
                onClick={() => handleSelectPersona('aarav')}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                  spendScore > 7.0 ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Aarav (8.2 ✓)
              </button>
              <button
                onClick={() => handleSelectPersona('riya')}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                  spendScore <= 7.0 ? 'bg-amber-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Riya (5.4 ✗)
              </button>
            </div>
          </div>

          {/* Right: View Toggle & Behind-the-Scenes */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5 bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-[10px]">
              <button
                onClick={() => setDeviceView('mobile')}
                className={`px-2 py-0.5 rounded flex items-center gap-1 ${
                  deviceView === 'mobile' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400'
                }`}
              >
                <Smartphone className="w-3 h-3" />
                <span>Mobile</span>
              </button>
              <button
                onClick={() => setDeviceView('desktop')}
                className={`px-2 py-0.5 rounded flex items-center gap-1 ${
                  deviceView === 'desktop' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400'
                }`}
              >
                <Laptop className="w-3 h-3" />
                <span>Desktop</span>
              </button>
            </div>

            <button
              onClick={() => setActiveScreen('architecture')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors flex items-center gap-1 ${
                activeScreen === 'architecture'
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : 'bg-slate-800 text-indigo-300 border-indigo-500/40 hover:bg-slate-700'
              }`}
            >
              <ShieldCheck className="w-3 h-3 text-indigo-400" />
              <span className="hidden sm:inline">Evals</span>
            </button>
          </div>
        </div>

        {/* Collapsible Detail Drawer for Facilitator */}
        {showResearcherBar && (
          <div className="pt-2 mt-1.5 border-t border-slate-800 flex items-center justify-between gap-4 flex-wrap text-[11px] animate-fadeIn">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Score:</span>
              <input
                type="range"
                min="1.0"
                max="10.0"
                step="0.1"
                value={spendScore}
                onChange={(e) => handleScoreChange(e.target.value)}
                className="w-24 accent-emerald-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg appearance-none"
              />
              <span className={`px-1.5 py-0.2 rounded font-mono font-bold ${isQualified ? 'text-emerald-400' : 'text-rose-400'}`}>
                {spendScore.toFixed(1)} {isQualified ? '(Eligible)' : '(Ineligible)'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleResetSimulator}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3 text-slate-400" />
                <span>Reset Prototype</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* APP WORKSPACE CONTAINER (RESPONSIVE OR CLEAN MOBILE PREVIEW) */}
      <div className={`flex-1 w-full mx-auto flex flex-col ${deviceView === 'mobile' ? 'max-w-md bg-white border-x border-slate-200 shadow-xl' : 'max-w-6xl'}`}>
        {/* RETAIL CONSUMER HEADER */}
        <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-[37px] z-30 shadow-xs">
          {/* Logo & Brand */}
          <div
            onClick={() => setActiveScreen('shop')}
            className="flex items-center gap-2 cursor-pointer select-none"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-sm">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900 block leading-none">
                UrbanMart
              </span>
              <span className="text-[10px] text-slate-500 leading-none">HyperStore</span>
            </div>
          </div>

          {/* Desktop Nav Links (Hidden in Mobile View) */}
          {deviceView === 'desktop' && (
            <nav className="hidden md:flex items-center gap-5 text-xs font-semibold text-slate-600">
              <button
                onClick={() => setActiveScreen('shop')}
                className={`hover:text-slate-900 transition-colors flex items-center gap-1 ${activeScreen === 'shop' ? 'text-emerald-600 font-bold' : ''}`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Shop Aisle</span>
              </button>
              <button
                onClick={() => setActiveScreen('credit_hub')}
                className={`hover:text-slate-900 transition-colors flex items-center gap-1 ${activeScreen === 'credit_hub' ? 'text-emerald-600 font-bold' : ''}`}
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>Pay Later</span>
              </button>
              <button
                onClick={() => setActiveScreen('pos_checkout')}
                className={`hover:text-slate-900 transition-colors flex items-center gap-1 ${activeScreen === 'pos_checkout' ? 'text-emerald-600 font-bold' : ''}`}
              >
                <Store className="w-3.5 h-3.5" />
                <span>Billing Counter</span>
              </button>
              <button
                onClick={() => setActiveScreen('repayment')}
                className={`hover:text-slate-900 transition-colors flex items-center gap-1 ${activeScreen === 'repayment' ? 'text-emerald-600 font-bold' : ''}`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Bills &amp; Repay</span>
                {userProfile.outstandingDues > 0 && (
                  <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 rounded-full">
                    ₹{userProfile.outstandingDues.toLocaleString()}
                  </span>
                )}
              </button>
            </nav>
          )}

          {/* Header Right: Basket Pill & Avatar */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveScreen('pos_checkout')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors text-xs font-semibold"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
              <span>₹{cartTotal.toLocaleString()}</span>
              {cartCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>

            <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[11px]">
              {userProfile.name.split(' ').map((n) => n[0]).join('')}
            </div>
          </div>
        </header>

        {/* SCREEN BODY */}
        <main className="flex-1 p-4 sm:p-6 bg-slate-50">
          {renderScreen()}
        </main>

        {/* THUMB-FRIENDLY BOTTOM NAVIGATION BAR */}
        <nav className="sticky bottom-0 z-40 bg-white/95 backdrop-blur border-t border-slate-200 px-3 py-2 flex items-center justify-around text-[10px] font-semibold text-slate-500 shadow-md">
          <button
            onClick={() => setActiveScreen('shop')}
            className={`flex flex-col items-center gap-0.5 transition-colors ${
              activeScreen === 'shop' ? 'text-emerald-600 font-bold' : 'hover:text-slate-900'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Aisles</span>
          </button>

          <button
            onClick={() => setActiveScreen('credit_hub')}
            className={`flex flex-col items-center gap-0.5 transition-colors relative ${
              activeScreen === 'credit_hub' ? 'text-emerald-600 font-bold' : 'hover:text-slate-900'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>Pay Later</span>
            {isOnboarded && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 absolute top-0 right-1"></span>}
          </button>

          <button
            onClick={() => setActiveScreen('pos_checkout')}
            className={`flex flex-col items-center gap-0.5 transition-colors ${
              activeScreen === 'pos_checkout' ? 'text-emerald-600 font-bold' : 'hover:text-slate-900'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Checkout</span>
          </button>

          <button
            onClick={() => setActiveScreen('repayment')}
            className={`flex flex-col items-center gap-0.5 transition-colors relative ${
              activeScreen === 'repayment' ? 'text-emerald-600 font-bold' : 'hover:text-slate-900'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Bills</span>
            {userProfile.outstandingDues > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 absolute top-0 right-0"></span>
            )}
          </button>
        </nav>
      </div>

      {/* RETAIL FOOTER */}
      <footer className="bg-white border-t border-slate-200 py-3 px-4 text-[11px] text-slate-500 text-center">
        <div className="max-w-md mx-auto flex items-center justify-between gap-2">
          <span>UrbanMart HyperStore</span>
          <button
            onClick={() => setActiveScreen('architecture')}
            className="text-emerald-700 hover:underline font-semibold"
          >
            Auditor / Evals
          </button>
        </div>
      </footer>
    </div>
  );
}
