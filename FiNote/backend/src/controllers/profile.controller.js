const profileService = require('../services/profile.service');
const { sukses } = require('../utils/response');

// GET /api/profil
function show(req, res, next) {
  try {
    const profile = profileService.getProfil(req.user.user_id);
    sukses(res, 200, 'Data profil berhasil diambil.', { profile });
  } catch (err) {
    next(err);
  }
}

// PUT /api/profil
function update(req, res, next) {
  try {
    const profile = profileService.updateProfil(req.user.user_id, req.body);
    sukses(res, 200, 'Informasi Profile berhasil diubah', { profile });
  } catch (err) {
    next(err);
  }
}

// PUT /api/profil/password
async function changePassword(req, res, next) {
  try {
    await profileService.gantiPassword(req.user.user_id, req.body);
    sukses(res, 200, 'Password berhasil dirubah', null);
  } catch (err) {
    next(err);
  }
}

module.exports = { show, update, changePassword };
