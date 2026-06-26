const prisma = require('../config/db');
const { successResponse, errorResponse } = require('../middlewares/errorHandler');

async function getNotificationHistory(req, res) {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
        skip, take: parseInt(limit),
      }),
      prisma.notification.count({ where: { userId: req.user.id } }),
    ]);

    return successResponse(res, 200, { notifications, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    return errorResponse(res, 500, 'Failed to fetch notifications');
  }
}

module.exports = { getNotificationHistory };
