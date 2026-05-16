const prisma = require('../config/database');
const { success } = require('../utils/response');

const getStats = async (req, res, next) => {
  try {
    const [totalUsers, activeUsers, totalMedia, recentActivity] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.media.count(),
      prisma.activityLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: { role: true },
    });

    const mediaByMonth = await prisma.$queryRaw`
      SELECT
        TO_CHAR("createdAt", 'YYYY-MM') as month,
        COUNT(*) as count
      FROM media
      WHERE "createdAt" >= NOW() - INTERVAL '6 months'
      GROUP BY month
      ORDER BY month ASC
    `;

    success(res, {
      summary: { totalUsers, activeUsers, totalMedia },
      usersByRole: usersByRole.map(r => ({ role: r.role, count: r._count.role })),
      mediaByMonth,
      recentActivity,
    }, 'Statistik dashboard berhasil diambil');
  } catch (err) {
    next(err);
  }
};

const getActivityLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.activityLog.count(),
    ]);

    res.json({
      success: true,
      message: 'Log aktivitas berhasil diambil',
      data: logs,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getStats, getActivityLogs };
