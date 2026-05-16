const success = (res, data, message = 'Berhasil', statusCode = 200) => {
  return res.status(statusCode).json({ success: true, message, data });
};

const paginate = (res, data, total, page, limit, message = 'Berhasil') => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    },
  });
};

module.exports = { success, paginate };
