const { errorResponse } = require('./errorHandler');

const PLAN_LIMITS = {
  FREE: {
    maxBeneficiaries: 4,
    maxGuardians: 5,
    allowedIntervals: [30],
    vaultStorageBytes: 500 * 1024 * 1024, // 500MB
    smsNotifications: false,
    customTimeline: false,
    pdfWill: false,
  },
  PRO: {
    maxBeneficiaries: 10,
    maxGuardians: 7,
    allowedIntervals: [14, 30, 60, 90],
    vaultStorageBytes: 5 * 1024 * 1024 * 1024, // 5GB
    smsNotifications: true,
    customTimeline: true,
    pdfWill: true,
  },
  ENTERPRISE: {
    maxBeneficiaries: Infinity,
    maxGuardians: Infinity,
    allowedIntervals: [7, 14, 30, 60, 90],
    vaultStorageBytes: Infinity,
    smsNotifications: true,
    customTimeline: true,
    pdfWill: true,
  },
};

function requirePlan(...allowedPlans) {
  return (req, res, next) => {
    if (!allowedPlans.includes(req.user.plan)) {
      return errorResponse(res, 403, `This feature requires one of: ${allowedPlans.join(', ')} plan`);
    }
    next();
  };
}

function checkBeneficiaryLimit(prisma) {
  return async (req, res, next) => {
    const limit = PLAN_LIMITS[req.user.plan].maxBeneficiaries;
    if (limit === Infinity) return next();
    const count = await prisma.beneficiary.count({ where: { userId: req.user.id } });
    if (count >= limit) {
      return errorResponse(res, 403, `Your plan allows a maximum of ${limit} beneficiaries. Upgrade to add more.`);
    }
    next();
  };
}

function checkGuardianLimit(prisma) {
  return async (req, res, next) => {
    const limit = PLAN_LIMITS[req.user.plan].maxGuardians;
    if (limit === Infinity) return next();
    const count = await prisma.guardian.count({ where: { userId: req.user.id } });
    if (count >= limit) {
      return errorResponse(res, 403, `Your plan allows a maximum of ${limit} guardians. Upgrade to add more.`);
    }
    next();
  };
}

function checkInterval(req, res, next) {
  const { checkinIntervalDays } = req.body;
  if (!checkinIntervalDays) return next();
  const allowed = PLAN_LIMITS[req.user.plan].allowedIntervals;
  if (!allowed.includes(Number(checkinIntervalDays))) {
    return errorResponse(res, 403, `Your plan only allows check-in intervals of: ${allowed.join(', ')} days`);
  }
  next();
}

module.exports = { requirePlan, checkBeneficiaryLimit, checkGuardianLimit, checkInterval, PLAN_LIMITS };
