/**
 * Sentinel Credit Engine - Guardrails & Compliance Engine
 * Enterprise FinTech verification engine for Tier-1 retail revolving credit line.
 */

export const GUARDRAILS_SPEC = [
  {
    id: 'G1_REGULATORY_ESCROW',
    name: 'Regulatory & Escrow Compliance',
    regulation: 'RBI Digital Lending Guidelines (2022/2026)',
    description: 'Statutory mandate: 100% of disbursals flow from NBFC Disbursal Escrow (#892010), and repayments settle directly to NBFC Collection Escrow (#902188). Retailer fund pooling or parking is strictly forbidden.',
    severity: 'CRITICAL',
    enforcedAt: ['Lending Core', 'Gateway Orchestrator', 'NBFC Escrow']
  },
  {
    id: 'G2_LEDGER_ARITHMETIC',
    name: 'Arithmetic & Ledger Invariant Integrity',
    regulation: 'Core LMS Ledger Balance Rule',
    description: 'Revolving line invariant: Available Limit + Outstanding Dues === Total Sanctioned Limit. Dues cannot be negative; overdraws beyond available limit trigger INSUFFICIENT_LIMIT rejection.',
    severity: 'CRITICAL',
    enforcedAt: ['Lending Core', 'Retail Core']
  },
  {
    id: 'G3_SCORE_CUTOFF',
    name: 'Propensity Cutoff Threshold (> 7.0)',
    regulation: 'NBFC Credit Underwriting Policy',
    description: 'Customers qualify for pre-approved revolving line IF AND ONLY IF behavioral affinity score > 7.0. Scores <= 7.0 trigger DORMANT SDK status with zero bureau draw or ledger provisioning.',
    severity: 'HIGH',
    enforcedAt: ['Scoring Engine', 'Retail Core']
  },
  {
    id: 'G4_PII_SANITIZATION',
    name: 'PII & Financial Data Masking',
    regulation: 'DPDP Act & PCI-DSS Compliance',
    description: 'All identity tokens, mobile phone numbers, card PANs, and national IDs must be masked in inspector logs, telemetry, and payload exchanges (e.g., +91 XXXXX XX210, •••• 4821).',
    severity: 'HIGH',
    enforcedAt: ['Gateway Orchestrator', 'Retail Core', 'Consumer App']
  },
  {
    id: 'G5_SECURITY_INJECTION',
    name: 'Prompt Injection & Adversarial Defense',
    regulation: 'OWASP LLM & API Security Top 10',
    description: 'Intercepts unauthorized override directives (e.g., "Ignore previous rules", "Force approve score 4.5", "Bypass KYC"). Flags with SECURITY_VIOLATION and halts execution.',
    severity: 'CRITICAL',
    enforcedAt: ['Gateway Orchestrator', 'Sentinel AI']
  }
];

export function maskPhone(phone) {
  if (!phone || typeof phone !== 'string') return phone;
  // Format +91 XXXXX XX210
  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 10) {
    const last3 = digits.slice(-3);
    const prefix = phone.includes('+91') ? '+91 ' : '';
    return `${prefix}XXXXX XX${last3}`;
  }
  return phone;
}

export function maskCardPan(pan) {
  if (!pan || typeof pan !== 'string') return pan;
  const digits = pan.replace(/\D/g, '');
  if (digits.length >= 4) {
    const last4 = digits.slice(-4);
    return `•••• •••• •••• ${last4}`;
  }
  return '•••• •••• •••• ••••';
}

export function maskAadhaar(id) {
  if (!id || typeof id !== 'string') return id;
  const digits = id.replace(/\D/g, '');
  if (digits.length >= 4) {
    return `XXXX-XXXX-${digits.slice(-4)}`;
  }
  return 'XXXX-XXXX-XXXX';
}

export function sanitizePayload(payload) {
  if (!payload || typeof payload !== 'object') return payload;
  const sanitized = Array.isArray(payload) ? [...payload] : { ...payload };

  for (const key of Object.keys(sanitized)) {
    const lowerKey = key.toLowerCase();
    const val = sanitized[key];

    if (typeof val === 'string') {
      if (lowerKey.includes('phone') || lowerKey.includes('mobile')) {
        sanitized[key] = maskPhone(val);
      } else if (lowerKey.includes('card') || lowerKey.includes('pan')) {
        sanitized[key] = maskCardPan(val);
      } else if (lowerKey.includes('aadhaar') || lowerKey.includes('nationalid')) {
        sanitized[key] = maskAadhaar(val);
      } else if (lowerKey.includes('cvv') || lowerKey.includes('pin') || lowerKey.includes('password')) {
        sanitized[key] = '••• [REDACTED]';
      }
    } else if (typeof val === 'object' && val !== null) {
      sanitized[key] = sanitizePayload(val);
    }
  }

  return sanitized;
}

export function detectAdversarialInjection(input) {
  if (!input) return { isInjection: false, reason: null };
  const str = typeof input === 'string' ? input : JSON.stringify(input);
  const patterns = [
    /ignore (all )?(previous|prior) (instructions|rules|prompts)/i,
    /override (the )?(score|cutoff|threshold|rules)/i,
    /bypass (kyc|bureau|escrow|underwriting)/i,
    /force (approve|sanction|disburse)/i,
    /act as an? uncensored/i,
    /drop table|1=1|--/i,
    /eval\(|<script>/i,
    /score\s*:\s*[0-6](\.\d+)?\s*,\s*qualified\s*:\s*true/i
  ];

  for (const pattern of patterns) {
    if (pattern.test(str)) {
      return {
        isInjection: true,
        reason: `Adversarial pattern matched: "${pattern.source}" attempting illegal boundary breach.`
      };
    }
  }
  return { isInjection: false, reason: null };
}

/**
 * Evaluates any action or transaction against the 5 Sentinel Guardrails.
 * Returns the structured Sentinel compliance output.
 */
export function evaluateSentinelGuardrails(request) {
  const violations = [];
  let isPiiMasked = true;
  let isRegulatoryCompliant = true;
  let isArithmeticValid = true;

  const {
    type, // 'SCORING' | 'KYC_SANCTION' | 'POS_DRAW' | 'REPAYMENT' | 'CUSTOM'
    score,
    applicant,
    amount,
    sanctionedLimit = 30000,
    availableLimit = 30000,
    outstandingDues = 0,
    destinationAccount,
    sourceAccount,
    consentHash,
    tenderMethod,
    rawPayload
  } = request;

  // 1. Guardrail 5: Adversarial & Injection Check
  const injectionCheck = detectAdversarialInjection(rawPayload || request);
  if (injectionCheck.isInjection) {
    violations.push(`G5_SECURITY_VIOLATION: ${injectionCheck.reason}`);
    return {
      status: 'REJECTED',
      guardrail_check: {
        passed: false,
        pii_masked: true,
        regulatory_compliant: false,
        arithmetic_valid: false,
        violations
      },
      action: 'SECURITY_VIOLATION_INTERCEPTED',
      system_node: 'Gateway Orchestrator',
      data_payload: {
        attemptedType: type,
        severity: 'CRITICAL',
        mitigation: 'Execution terminated; incident logged to security audit stream'
      },
      explanation: `Security Boundary Violated: ${injectionCheck.reason} The request violates Guardrail 5 (Prompt Injection & Jailbreak Defense) and has been halted.`
    };
  }

  // 2. Guardrail 3: Cutoff Score Rule (> 7.0)
  if (type === 'SCORING' || type === 'KYC_SANCTION') {
    if (typeof score === 'number') {
      if (score <= 7.0) {
        if (type === 'KYC_SANCTION') {
          violations.push(`G3_SCORE_CUTOFF: Score ${score} is <= 7.0 cutoff threshold. Lending sanction forbidden.`);
        }
      }
    }
  }

  // 3. Guardrail 1: Regulatory & Escrow Compliance
  if (type === 'POS_DRAW' && tenderMethod === 'credit_line') {
    // Disbursements must flow from NBFC Disbursal Escrow
    if (sourceAccount && !sourceAccount.includes('NBFC Disbursal Escrow')) {
      violations.push(`G1_REGULATORY_VIOLATION: Loan disbursal attempted from non-escrow account "${sourceAccount}". Statutory RBI rules require disbursement strictly from NBFC Disbursal Escrow.`);
      isRegulatoryCompliant = false;
    }
    if (destinationAccount && destinationAccount.toLowerCase().includes('pool')) {
      violations.push(`G1_REGULATORY_VIOLATION: Disbursement attempted into Retailer Pooling Account. Statutory rules forbid merchant fund parking.`);
      isRegulatoryCompliant = false;
    }
  }

  if (type === 'KYC_SANCTION') {
    if (!consentHash) {
      violations.push(`G1_REGULATORY_VIOLATION: Mandatory applicant bureau & identity consent hash missing. Cannot disburse credit line.`);
      isRegulatoryCompliant = false;
    }
  }

  if (type === 'REPAYMENT') {
    if (destinationAccount && !destinationAccount.includes('NBFC') && !destinationAccount.includes('Escrow')) {
      violations.push(`G1_REGULATORY_VIOLATION: Borrower repayment routed to "${destinationAccount}". Collections must sweep directly into NBFC Collection Escrow.`);
      isRegulatoryCompliant = false;
    }
  }

  // 4. Guardrail 2: Arithmetic & Ledger Invariants
  if (type === 'POS_DRAW' && tenderMethod === 'credit_line') {
    if (typeof amount === 'number') {
      if (amount > availableLimit) {
        violations.push(`G2_INSUFFICIENT_LIMIT: Requested draw ₹${amount} exceeds current available limit ₹${availableLimit}.`);
        isArithmeticValid = false;
      }
      if (amount <= 0) {
        violations.push(`G2_INVALID_AMOUNT: Transaction amount must be greater than ₹0.`);
        isArithmeticValid = false;
      }
    }
  }

  if (type === 'REPAYMENT') {
    if (typeof amount === 'number') {
      if (amount > outstandingDues) {
        violations.push(`G2_OVERPAYMENT_DRIFT: Repayment ₹${amount} exceeds current outstanding dues ₹${outstandingDues}.`);
        isArithmeticValid = false;
      }
      if (amount <= 0) {
        violations.push(`G2_INVALID_AMOUNT: Repayment amount must be positive.`);
        isArithmeticValid = false;
      }
    }
  }

  // Check ledger invariant equation
  const projectedAvailable = type === 'POS_DRAW' && tenderMethod === 'credit_line'
    ? availableLimit - (amount || 0)
    : type === 'REPAYMENT'
    ? availableLimit + (amount || 0)
    : availableLimit;

  const projectedDues = type === 'POS_DRAW' && tenderMethod === 'credit_line'
    ? outstandingDues + (amount || 0)
    : type === 'REPAYMENT'
    ? outstandingDues - (amount || 0)
    : outstandingDues;

  if (sanctionedLimit > 0 && Math.abs((projectedAvailable + projectedDues) - sanctionedLimit) > 0.01) {
    violations.push(`G2_LEDGER_INVARIANT_BROKEN: Projected Available (₹${projectedAvailable}) + Projected Dues (₹${projectedDues}) !== Sanctioned Limit (₹${sanctionedLimit}).`);
    isArithmeticValid = false;
  }

  if (projectedDues < 0) {
    violations.push(`G2_NEGATIVE_DUES: Outstanding dues cannot fall below ₹0.`);
    isArithmeticValid = false;
  }

  // 5. Guardrail 4: PII Masking
  if (applicant && applicant.phone) {
    if (applicant.phone.replace(/\D/g, '').length >= 10 && !applicant.phone.includes('X')) {
      isPiiMasked = false;
      violations.push(`G4_PII_LEAKAGE: Unmasked phone number detected in raw applicant payload.`);
    }
  }

  const passed = violations.length === 0;
  const status = passed ? 'APPROVED' : violations.some(v => v.includes('SECURITY') || v.includes('INSUFFICIENT') || v.includes('REGULATORY')) ? 'REJECTED' : 'FLAGGED_FOR_REVIEW';

  // Determine system node
  let systemNode = 'Gateway Orchestrator';
  if (type === 'SCORING') systemNode = 'Scoring Engine';
  else if (type === 'KYC_SANCTION') systemNode = 'Lending Core';
  else if (type === 'POS_DRAW') systemNode = 'Retail Core';
  else if (type === 'REPAYMENT') systemNode = 'NBFC Escrow';

  const sanitizedData = sanitizePayload(request);

  return {
    status,
    guardrail_check: {
      passed,
      pii_masked: isPiiMasked,
      regulatory_compliant: isRegulatoryCompliant,
      arithmetic_valid: isArithmeticValid,
      violations
    },
    action: `EVALUATE_${type || 'TRANSACTION'}_COMPLIANCE`,
    system_node: systemNode,
    data_payload: {
      ...sanitizedData,
      auditTimestamp: new Date().toISOString(),
      ledgerSnapshot: {
        sanctioned: sanctionedLimit,
        available: projectedAvailable,
        dues: projectedDues,
        invariantBalanced: Math.abs((projectedAvailable + projectedDues) - sanctionedLimit) < 0.01
      }
    },
    explanation: passed
      ? `All 5 Sentinel Guardrails passed. Regulatory escrow path verified, ledger invariants balanced, cutoff compliant, and PII sanitized.`
      : `Guardrail check failed with ${violations.length} violation(s): ${violations.join('; ')}`
  };
}
