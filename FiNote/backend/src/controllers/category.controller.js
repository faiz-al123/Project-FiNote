// category.controller.js
const categoryService = require('../services/category.service');

function listCategories(req, res, next) {
  try {
    const categories = categoryService.getAllCategories();

    return res.status(200).json({
      success: true,
      message: 'Daftar kategori berhasil diambil.',
      data: { categories },
    });
  } catch (error) {
    return next(error);
  }
}

function createCategory(req, res, next) {
  try {
    const nama_kategori = req.body?.nama_kategori;

    if (
      typeof nama_kategori !== 'string' ||
      nama_kategori.trim().length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'Nama kategori wajib diisi.',
        data: null,
      });
    }

    const category = categoryService.createCategory(nama_kategori);

    return res.status(201).json({
      success: true,
      message: 'Kategori berhasil dibuat.',
      data: { category },
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listCategories,
  createCategory,
};