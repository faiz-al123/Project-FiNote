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
    if (
      err.code === 'SQLITE_CONSTRAINT_UNIQUE' ||
      err.code === 'SQLITE_CONSTRAINT'
    ) {
      throw new AppError(
        'Email sudah terdaftar.',
        409,
      );
    }

    throw err;
  }
}

async function login({ identifier, email, password }) {
  // identifier adalah input login yang bisa berupa:
  // 1. email
  // 2. nama / username
  //
  // "email" tetap diterima agar kompatibel dengan
  // pemanggilan login versi lama.

  const loginIdentifier = String(
    identifier ?? email ?? '',
  )
    .trim();

  const user = userModel.findByIdentifier(
    loginIdentifier,
  );

  // Pesan dibuat sama untuk:
  // - akun tidak ditemukan
  // - password salah
  if (
    !user ||
    !(await bcrypt.compare(password, user.password))
  ) {
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