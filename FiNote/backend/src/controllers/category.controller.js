// category.controller.js
const categoryService = require('../services/category.service');

async function listCategories(req, res, next) {
  try {
    const categories = await categoryService.getAllCategories();

    return res.status(200).json({
      success: true,
      message: 'Daftar kategori berhasil diambil.',
      data: { categories },
    });
  } catch (error) {
    next(error);
  }
}

async function createCategory(req, res, next) {
  try {
    const { nama_kategori } = req.body;

    if (!nama_kategori || !String(nama_kategori).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Nama kategori wajib diisi.',
        data: null,
      });
    }

    const category = await categoryService.createCategory(
      String(nama_kategori).trim()
    );

    return res.status(201).json({
      success: true,
      message: 'Kategori berhasil dibuat.',
      data: { category },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listCategories,
  createCategory,
};