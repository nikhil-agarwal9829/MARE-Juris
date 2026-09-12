export interface LegalSource {
  title: string;
  act: string;
  section: string;
  authority: string;
  jurisdiction: string;
  url: string;
  sourceType: string;
  verifiedAt: string;
}

export interface Right {
  id: string;
  category: 'Tenant Rights' | 'Consumer Rights' | 'Cyber Rights' | 'Employment Rights' | 'Women & Family' | 'Business Rights';
  title: string;
  summary: string;
  explanation: string;
  practicalExample: string;
  whatToCheck: string[];
  source: LegalSource;
  relatedRights?: string[];
}

export const rightsData: Right[] = [
  {
    id: 'tenant-proper-notice',
    category: 'Tenant Rights',
    title: 'Notice Before Termination',
    summary: 'Depending on the tenancy agreement and local law, a tenant usually has protections against abrupt eviction and is entitled to a proper notice period.',
    explanation: 'A landlord cannot arbitrarily evict a tenant overnight. Under the Transfer of Property Act and various State Rent Control Acts, a minimum notice period (often 15 days or 1 month, depending on the lease) must be given in writing before terminating a month-to-month tenancy.',
    practicalExample: 'Your landlord verbally tells you to vacate the apartment by tomorrow because they want to sell it. You do not have to leave immediately. The landlord must provide you with a formal, written notice adhering to the timeframe specified in your rental agreement or state law.',
    whatToCheck: [
      'Your signed rental agreement (Notice Clause)',
      'Applicable State Rent Control Act',
      'Whether the notice was given in writing',
      'The exact notice period provided'
    ],
    source: {
      title: 'Transfer of Property Act, 1882',
      act: 'Transfer of Property Act, 1882',
      section: 'Section 106',
      authority: 'Government of India',
      jurisdiction: 'India',
      url: 'https://www.indiacode.nic.in/handle/123456789/2338',
      sourceType: 'Official Government Source',
      verifiedAt: '2026-09-12'
    },
    relatedRights: ['tenant-security-deposit', 'tenant-essential-services']
  },
  {
    id: 'tenant-security-deposit',
    category: 'Tenant Rights',
    title: 'Return of Security Deposit',
    summary: 'Landlords must return the security deposit after deducting legitimate expenses (like unpaid rent or damages) when a tenancy ends.',
    explanation: 'While the Model Tenancy Act caps security deposits at 2 months for residential properties, individual state laws govern the exact rules. A landlord cannot arbitrarily withhold the deposit for normal "wear and tear". Valid deductions must be itemized.',
    practicalExample: 'You move out after 2 years. The landlord refuses to return your deposit, claiming the paint has faded. Paint fading is "normal wear and tear" and cannot be deducted from your deposit.',
    whatToCheck: [
      'The deposit clause in your lease agreement',
      'Photos of the property taken during move-in and move-out',
      'State-specific rules on deposit caps and return timelines'
    ],
    source: {
      title: 'Model Tenancy Act, 2021',
      act: 'Model Tenancy Act, 2021',
      section: 'Section 11',
      authority: 'Ministry of Housing and Urban Affairs',
      jurisdiction: 'Select Indian States',
      url: 'https://mohua.gov.in/upload/uploadfiles/files/Model-Tenancy-Act-English-02_06_2021.pdf',
      sourceType: 'Official Government Source',
      verifiedAt: '2026-09-12'
    },
    relatedRights: ['tenant-proper-notice', 'tenant-essential-services']
  },
  {
    id: 'consumer-hidden-charges',
    category: 'Consumer Rights',
    title: 'Protection from Hidden Charges',
    summary: 'E-commerce platforms and sellers must display all mandatory charges upfront. Concealing fees until checkout is an unfair trade practice.',
    explanation: 'Under the Consumer Protection (E-Commerce) Rules, sellers and platforms cannot mislead consumers. "Dark patterns" such as drip pricing (revealing hidden fees at the final payment page) are explicitly prohibited.',
    practicalExample: 'You are booking a flight for ₹5,000. On the final payment screen, an unremovable "convenience fee" of ₹800 is suddenly added. This is a prohibited dark pattern.',
    whatToCheck: [
      'The final breakdown of charges vs initial displayed price',
      'Whether the extra charge is mandatory or optional',
      'Screenshots of the pricing pages'
    ],
    source: {
      title: 'Guidelines for Prevention and Regulation of Dark Patterns, 2023',
      act: 'Consumer Protection Act, 2019',
      section: 'Annexure 1 (Drip Pricing)',
      authority: 'Central Consumer Protection Authority',
      jurisdiction: 'India',
      url: 'https://consumeraffairs.nic.in/sites/default/files/file-uploads/latestnews/Guidelines%20for%20Prevention%20and%20Regulation%20of%20Dark%20Patterns%2C%202023.pdf',
      sourceType: 'Official Government Source',
      verifiedAt: '2026-09-12'
    },
    relatedRights: ['consumer-defective-goods']
  },
  {
    id: 'cyber-data-access',
    category: 'Cyber Rights',
    title: 'Right to Access Personal Data',
    summary: 'Individuals have the right to know what personal data a company has collected about them and how it is being used.',
    explanation: 'Under the Digital Personal Data Protection (DPDP) Act, a Data Principal (you) has the right to obtain a summary of the personal data processed by a Data Fiduciary (the company) and the identities of all other entities with whom the data has been shared.',
    practicalExample: 'You use a fitness app. You can legally request the app developer to provide you with a summary of all health data they have collected about you, and a list of any third-party advertisers they sold it to.',
    whatToCheck: [
      'The company\'s Privacy Policy',
      'The grievance officer\'s contact details',
      'Whether the data is strictly necessary for the service provided'
    ],
    source: {
      title: 'Digital Personal Data Protection Act, 2023',
      act: 'Digital Personal Data Protection Act, 2023',
      section: 'Section 11',
      authority: 'Government of India',
      jurisdiction: 'India',
      url: 'https://www.indiacode.nic.in/handle/123456789/19088',
      sourceType: 'Official Government Source',
      verifiedAt: '2026-09-12'
    }
  },
  {
    id: 'employment-wages',
    category: 'Employment Rights',
    title: 'Right to Minimum Wage',
    summary: 'Employers are legally obligated to pay workers at least the minimum wage set by the state or central government for their specific sector.',
    explanation: 'The Minimum Wages Act mandates that workers in scheduled employments must receive basic minimum wages. Deductions from these wages are strictly regulated, and employers cannot pay less than the notified rate, regardless of any private contract.',
    practicalExample: 'You are hired as a security guard. Your employer makes you sign a contract agreeing to ₹5,000 per month, which is below the state minimum wage. That contract clause is illegal; you are entitled to the legal minimum wage.',
    whatToCheck: [
      'The current minimum wage notification for your state and skill level (unskilled, semi-skilled, skilled)',
      'Your pay slips and bank statements',
      'Any unauthorized deductions made by the employer'
    ],
    source: {
      title: 'Minimum Wages Act, 1948',
      act: 'Minimum Wages Act, 1948',
      section: 'Section 12',
      authority: 'Government of India',
      jurisdiction: 'India',
      url: 'https://www.indiacode.nic.in/handle/123456789/1891',
      sourceType: 'Official Government Source',
      verifiedAt: '2026-09-12'
    }
  }
];

// Helper to get unique categories
export const getCategories = () => {
  const categories = Array.from(new Set(rightsData.map(right => right.category)));
  return ['All Rights', ...categories];
};
