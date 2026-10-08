// Bentuk response API FiNote yang seragam.
// Frontend cukup membaca response.data.success, message, dan data.

function sukses(res, statusCode, message, data = null) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

function gagal(res, statusCode, message, data = null) {
  return res.status(statusCode).json({
    success: false,
    message,
    data,
  });
}

module.exports = { sukses, gagal };
