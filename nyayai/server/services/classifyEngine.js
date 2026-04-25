const rules = {
  PROPERTY_DISPUTE: {
    keywords: ['rent', 'landlord', 'eviction', 'property', 'tenant', 'deposit', 'trespass', 'possession', 'encroachment'],
    laws: ['IPC 441', 'IPC 447', 'Transfer of Property Act', 'Rent Control Act'],
    jurisdiction: 'Civil Court / Rent Control Tribunal',
    timeLimit: '3 years — Limitation Act',
    severity: 'medium'
  },
  LABOUR_DISPUTE: {
    keywords: ['salary', 'wages', 'employer', 'fired', 'terminated', 'employment', 'pf', 'gratuity', 'overtime'],
    laws: ['Payment of Wages Act §3', 'Industrial Disputes Act §25', 'Minimum Wages Act'],
    jurisdiction: 'Labour Commissioner / Industrial Tribunal',
    timeLimit: '1 year from date of cause',
    severity: 'medium'
  },
  CONSUMER_DISPUTE: {
    keywords: ['cheated', 'refund', 'defective', 'product', 'warranty', 'overcharged', 'ecommerce', 'billing'],
    laws: ['Consumer Protection Act §35', 'COPRA §2', 'IT Act §66'],
    jurisdiction: 'Consumer Disputes Redressal Commission',
    timeLimit: '2 years from cause',
    severity: 'low'
  },
  CRIMINAL_ASSAULT: {
    keywords: ['beat', 'attacked', 'assault', 'hurt', 'injury', 'weapon', 'stabbed', 'acid'],
    laws: ['IPC 323', 'IPC 324', 'IPC 326', 'IPC 506', 'IPC 307'],
    jurisdiction: 'Magistrate Court / Sessions Court',
    timeLimit: 'No limitation for serious offences',
    severity: 'high'
  },
  DOMESTIC_VIOLENCE: {
    keywords: ['husband', 'domestic', 'abuse', 'dowry', 'beaten', 'matrimonial', 'in-laws', 'cruelty'],
    laws: ['IPC 498A', 'IPC 304B', 'Domestic Violence Act 2005', 'Dowry Prohibition Act'],
    jurisdiction: 'Magistrate Court / Family Court',
    timeLimit: 'File immediately',
    severity: 'high'
  },
  CYBER_CRIME: {
    keywords: ['hacked', 'online fraud', 'phishing', 'morphed', 'cyberbullying', 'upi fraud', 'data stolen', 'fake profile'],
    laws: ['IT Act §66', 'IT Act §66C', 'IT Act §67', 'IPC 420'],
    jurisdiction: 'Cyber Crime Cell / Magistrate Court',
    timeLimit: 'File immediately',
    severity: 'high'
  },
  CHEATING_FRAUD: {
    keywords: ['cheated', 'money taken', 'deceived', 'fraud', 'misrepresentation', 'investment fraud', 'money not returned'],
    laws: ['IPC 415', 'IPC 420', 'IPC 405', 'IPC 406', 'IPC 120B'],
    jurisdiction: 'Police / Magistrate Court',
    timeLimit: '3 years',
    severity: 'medium'
  },
  POLICE_MISCONDUCT: {
    keywords: ['police', 'false case', 'wrongful arrest', 'bribe', 'illegal detention', 'fake fir', 'police harassment'],
    laws: ['IPC 166', 'IPC 167', 'CrPC 41', 'Article 21 Constitution'],
    jurisdiction: 'High Court / Human Rights Commission',
    timeLimit: 'File immediately',
    severity: 'high'
  },
  MOTOR_ACCIDENT: {
    keywords: ['accident', 'car crash', 'bike accident', 'hit and run', 'road accident', 'insurance', 'rash driving'],
    laws: ['Motor Vehicles Act §183', 'Motor Vehicles Act §163A', 'IPC 279', 'IPC 304A'],
    jurisdiction: 'Motor Accident Claims Tribunal',
    timeLimit: '6 months for MACT claim',
    severity: 'medium'
  },
  SEXUAL_HARASSMENT: {
    keywords: ['eve teasing', 'stalking', 'inappropriate touching', 'workplace harassment', 'posh', 'obscene messages'],
    laws: ['IPC 354', 'IPC 354A', 'IPC 354D', 'IPC 509', 'POSH Act 2013'],
    jurisdiction: 'Internal Complaints Committee / Magistrate Court',
    timeLimit: 'File immediately',
    severity: 'high'
  }
};

function classifyCase(text) {
  const lower = String(text || '').toLowerCase();
  let bestMatch = null;
  let bestScore = 0;

  for (const [caseType, rule] of Object.entries(rules)) {
    const score = rule.keywords.filter((keyword) => lower.includes(keyword)).length;
    if (score > bestScore) {
      bestScore = score;
      bestMatch = { caseType, ...rule };
    }
  }

  return bestMatch || {
    caseType: 'GENERAL_DISPUTE',
    laws: ['IPC 420'],
    jurisdiction: 'Civil Court',
    timeLimit: '3 years',
    severity: 'low'
  };
}

module.exports = { classifyCase };
