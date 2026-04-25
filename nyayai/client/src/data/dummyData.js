export const cases = [
  { id: 1, title: 'Landlord Deposit Dispute', type: 'Property', date: '2026-03-10', verdict: 'Pending', score: 78 },
  { id: 2, title: 'Salary Not Paid', type: 'Labour', date: '2026-03-12', verdict: 'Won', score: 86 },
  { id: 3, title: 'Online Fraud Complaint', type: 'Cyber', date: '2026-03-14', verdict: 'Lost', score: 64 }
];

export const laws = [
  { id: 1, section: 'IPC 420', act: 'Indian Penal Code', title: 'Cheating', penalty: 'Up to 7 years + fine', category: 'IPC', description: 'Cheating and dishonestly inducing delivery of property.' },
  { id: 2, section: 'IPC 506', act: 'Indian Penal Code', title: 'Criminal Intimidation', penalty: 'Up to 2 years', category: 'IPC', description: 'Threatening with injury to person or property.' },
  { id: 3, section: 'IT Act 66', act: 'Information Technology Act', title: 'Computer Related Offences', penalty: 'Imprisonment/Fine', category: 'IT Act', description: 'Unauthorized access, data theft, hacking offences.' }
];

export const schemes = [
  { id: 1, name: 'NALSA Legal Aid', body: 'NALSA', eligibility: 'Women/SC/ST/BPL', benefit: 'Free legal aid' },
  { id: 2, name: 'Victim Compensation', body: 'State Legal Services', eligibility: 'Crime victims', benefit: 'Monetary compensation' },
  { id: 3, name: 'Consumer Helpline', body: 'Dept. Consumer Affairs', eligibility: 'Consumers', benefit: 'Complaint support' }
];

export const messages = [
  { id: 1, role: 'judge', text: 'The Court is now in session.' },
  { id: 2, role: 'opponent', text: 'My Lord, the claim lacks documentary evidence.' },
  { id: 3, role: 'user', text: 'My Lord, I submit the signed rental agreement and bank receipts.' }
];
