const prisma = require('../config/db');

const DEMO_LAWYER_TEAM = [
  {
    fullName: 'Adv. Priya Sharma',
    email: 'priya.sharma@cryptwill-legal.demo',
    role: 'Lead Estate Attorney',
    firmName: 'CryptWill Legal Partners',
    phone: '+91 98765 43210',
    barNumber: 'BAR/MH/2012/4521',
    experience: '18 years specializing in digital estate planning, crypto asset succession, and cross-border inheritance law.',
    notes: 'Your dedicated lead counsel for smart contract wills and regulatory compliance.',
    status: 'ACTIVE',
  },
  {
    fullName: 'Adv. Rahul Mehta',
    email: 'rahul.mehta@cryptwill-legal.demo',
    role: 'Tax & Crypto Advisor',
    firmName: 'CryptWill Legal Partners',
    phone: '+91 98765 43211',
    barNumber: 'BAR/DL/2015/8834',
    experience: '12 years advising on capital gains, estate tax, and digital asset reporting for high-net-worth clients.',
    notes: 'Handles tax implications of inherited crypto portfolios and token transfers.',
    status: 'ACTIVE',
  },
  {
    fullName: 'Adv. Ananya Reddy',
    email: 'ananya.reddy@cryptwill-legal.demo',
    role: 'Notary & Compliance Counsel',
    firmName: 'CryptWill Legal Partners',
    phone: '+91 98765 43212',
    barNumber: 'BAR/KA/2010/2219',
    experience: '15 years in legal documentation, notarization, and jurisdictional compliance for digital wills.',
    notes: 'Ensures your estate documents meet local legal requirements and audit standards.',
    status: 'ACTIVE',
  },
];

async function seedDemoLawyerTeam(userId) {
  const existing = await prisma.lawyerTeamMember.count({ where: { userId } });
  if (existing > 0) return { seeded: false, count: existing };

  for (const member of DEMO_LAWYER_TEAM) {
    await prisma.lawyerTeamMember.create({
      data: { userId, ...member },
    });
  }

  return { seeded: true, count: DEMO_LAWYER_TEAM.length };
}

module.exports = { seedDemoLawyerTeam, DEMO_LAWYER_TEAM };
