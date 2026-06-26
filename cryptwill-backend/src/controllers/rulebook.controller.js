const prisma = require('../config/db');
const { successResponse, errorResponse } = require('../middlewares/errorHandler');

async function getRulebook(req, res) {
  try {
    const rulebook = await prisma.userRulebook.findUnique({ where: { userId: req.user.id } });
    return successResponse(res, 200, { rules: rulebook ? rulebook.rules : [] });
  } catch (err) {
    return errorResponse(res, 500, 'Failed to fetch rulebook');
  }
}

async function saveRules(req, res) {
  try {
    const { rules } = req.body;
    if (!Array.isArray(rules)) return errorResponse(res, 400, 'Rules must be an array');

    const rulebook = await prisma.userRulebook.upsert({
      where: { userId: req.user.id },
      update: { rules },
      create: { userId: req.user.id, rules },
    });

    return successResponse(res, 200, { rules: rulebook.rules });
  } catch (err) {
    return errorResponse(res, 500, 'Failed to save rulebook');
  }
}

async function addRule(req, res) {
  try {
    const { title, description, category, priority } = req.body;
    if (!title) return errorResponse(res, 400, 'Rule title is required');

    const newRule = {
      id: require('crypto').randomUUID(),
      title,
      description: description || '',
      category: category || 'other',
      priority: priority || 'medium',
      createdAt: new Date().toISOString(),
    };

    const rulebook = await prisma.userRulebook.findUnique({ where: { userId: req.user.id } });
    const existingRules = rulebook ? rulebook.rules : [];
    const updatedRules = [...existingRules, newRule];

    await prisma.userRulebook.upsert({
      where: { userId: req.user.id },
      update: { rules: updatedRules },
      create: { userId: req.user.id, rules: updatedRules },
    });

    return successResponse(res, 201, { rule: newRule });
  } catch (err) {
    return errorResponse(res, 500, 'Failed to add rule');
  }
}

async function updateRule(req, res) {
  try {
    const { ruleId } = req.params;
    const { title, description, category, priority } = req.body;

    const rulebook = await prisma.userRulebook.findUnique({ where: { userId: req.user.id } });
    if (!rulebook) return errorResponse(res, 404, 'Rulebook not found');

    const rules = rulebook.rules;
    const idx = rules.findIndex(r => r.id === ruleId);
    if (idx === -1) return errorResponse(res, 404, 'Rule not found');

    rules[idx] = { ...rules[idx], title, description, category, priority };

    await prisma.userRulebook.update({ where: { userId: req.user.id }, data: { rules } });
    return successResponse(res, 200, { rule: rules[idx] });
  } catch (err) {
    return errorResponse(res, 500, 'Failed to update rule');
  }
}

async function deleteRule(req, res) {
  try {
    const { ruleId } = req.params;
    const rulebook = await prisma.userRulebook.findUnique({ where: { userId: req.user.id } });
    if (!rulebook) return errorResponse(res, 404, 'Rulebook not found');

    const updatedRules = rulebook.rules.filter(r => r.id !== ruleId);
    await prisma.userRulebook.update({ where: { userId: req.user.id }, data: { rules: updatedRules } });
    return successResponse(res, 200, { message: 'Rule deleted' });
  } catch (err) {
    return errorResponse(res, 500, 'Failed to delete rule');
  }
}

module.exports = { getRulebook, saveRules, addRule, updateRule, deleteRule };
