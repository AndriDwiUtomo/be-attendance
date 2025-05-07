const db = require("../models");
const { Op } = require('sequelize');
const User = db.user;
const Class = db.classes;
const response = require("../utils/response");
const bcrypt = require("bcryptjs");

exports.allAccess = (req, res) => {
  res.status(200).send("Public Content.");
};

exports.userBoard = (req, res) => {
  res.status(200).send("User Content.");
};

exports.adminBoard = (req, res) => {
  res.status(200).send("Admin Content.");
};

exports.moderatorBoard = (req, res) => {
  res.status(200).send("Moderator Content.");
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId, {
      attributes: { exclude: ["password"] }, // sembunyikan password
    });

    if (!user) {
      return response.error(res, "User not found.", 404);
    }
    
    response.success(res, "Data Profile", user, 200);
  } catch (err) {
    return response.error(res, "Gagal mengambil data user.", 500);

  }
}

exports.changePassword = async (req, res) => {
  const { newPassword, confirmPassword } = req.body;

  if (!newPassword || !confirmPassword) {
    return response.error(res, "Password baru dan konfirmasi wajib diisi.", 400);
  }

  if (newPassword !== confirmPassword) {
    return response.error(res, "Konfirmasi password tidak cocok.", 400);
  }

  try {
    const user = await User.findByPk(req.userId);

    if (!user) {
      return response.error(res, "User tidak ditemukan.", 404);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    return response.success(res, "Password berhasil diubah.", null, 200);
  } catch (error) {
    console.error(error);
    return response.error(res, "Gagal mengubah password.", 500);
  }
};
