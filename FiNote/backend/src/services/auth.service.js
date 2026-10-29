const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../models/user.model');
const AppError = require('../utils/appError');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/env');

const SALT_ROUNDS = 10;

function buatToken(user) {
  return jwt.sign(
    {
      user_id: user.user_id,
      email: user.email,
    },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN,
    },
  );
}

function dataUserAman(user) {
  return {
    user_id: user.user_id,
    nama: user.nama,
    email: user.email,
    created_at: user.created_at,
  };
}

async function register({ nama, email, password }) {
  nama = nama.trim();
  email = email.trim().toLowerCase();

  if (userModel.findByEmail(email)) {
    throw new AppError('Email sudah terdaftar.', 409);
  }

  if (userModel.findByNama(nama)) {
    throw new AppError('Nama sudah dipakai.', 409);
  }

  try {
    const hashedPassword = await bcrypt.hash(
      password,
      SALT_ROUNDS,
    );

    const userBaru = userModel.create({
      nama,
      email,
      hashedPassword,
    });

    return {
      user: dataUserAman(userBaru),
      token: buatToken(userBaru),
    };
  } catch (err) {
    const pesan = String(err.message || '');

    if (pesan.includes('UNIQUE constraint failed: User.nama')) {
      throw new AppError('Nama sudah dipakai.', 409);
    }

    if (pesan.includes('UNIQUE constraint failed: User.email')) {
      throw new AppError('Email sudah terdaftar.', 409);
    }

    throw err;
  }
}

async function login({ identifier, email, password }) {
  const loginIdentifier = String(
    identifier ?? email ?? '',
  ).trim();

  const user = userModel.findByIdentifier(loginIdentifier);

  // Akun tidak ditemukan: pesan khusus untuk TC-LOGIN-008.
  if (!user) {
    throw new AppError(
      'Username/email tidak terdaftar.',
      401,
    );
  }

  // Akun ditemukan, tetapi password tidak sesuai.
  if (!(await bcrypt.compare(password, user.password))) {
    throw new AppError(
      'Username/email atau password salah.',
      401,
    );
  }

  return {
    user: dataUserAman(user),
    token: buatToken(user),
  };
}

async function getCurrentUser(userId) {
  const user = userModel.findById(userId);

  if (!user) {
    throw new AppError(
      'Pengguna tidak ditemukan.',
      404,
    );
  }

  return dataUserAman(user);
}

module.exports = {
  register,
  login,
  getCurrentUser,
};