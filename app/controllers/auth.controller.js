const db = require("../models");
const config = require("../config/auth.config");
const User = db.user;
const Role = db.role;
const response = require("../utils/response");

const Op = db.Sequelize.Op;

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

exports.signup = async (req, res) => {
  // Save User to Database
  try {
    const user = await User.create({
      username: req.body.username,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 8),
    });

    if (req.body.roles) {
      const roles = await Role.findAll({
        where: {
          name: {
            [Op.or]: req.body.roles,
          },
        },
      });

      const result = user.setRoles(roles);
      if (result) res.send({ message: "User registered successfully!" });
    } else {
      // user has role = 1
      const result = user.setRoles([1]);
      if (result) res.send({ message: "User registered successfully!" });
    }
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

exports.signin = async (req, res) => {
  try {
    const user = await User.findOne({
      where: {
        username: req.body.username,
      },
    });

    if (!user) {
      return response.error(res, "User tidak ditemukan", 404);
    }

    const passwordIsValid = bcrypt.compareSync(
      req.body.password,
      user.password
    );

    if (!passwordIsValid) {
      return response.error(res, "Password tidak sesuai", 401);

    }

    const token = jwt.sign({ id: user.id },
                           config.secret,
                           {
                            algorithm: 'HS256',
                            allowInsecureKeySizes: true,
                            expiresIn: 86400, // 24 hours
                           });

    let authorities = [];
    const roles = await user.getRoles();
    for (let i = 0; i < roles.length; i++) {
      authorities.push("ROLE_" + roles[i].name.toUpperCase());
    }

    req.session.token = token;

    const data = {
      id: user.id,
      username: user.username,
      email: user.email,
      roles: authorities,
      token: token
    };
    return response.success(res, "Berhasil login", data, 200);
    
  } catch (error) {
    return response.error(res, error.message, 500);
  }
};

exports.signout = async (req, res) => {
  try {
    req.session = null;
    return res.status(200).send({
      message: "You've been signed out!"
    });
  } catch (err) {
    this.next(err);
  }
};

exports.changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return response.error(res, "Password lama dan baru harus diisi", 400);
  }

  try {
    const userId = req.userId; // dari middleware verifikasi token

    const user = await User.findByPk(userId);
    if (!user) {
      return response.error(res, "User tidak ditemukan", 404);
    }

    const passwordIsValid = bcrypt.compareSync(oldPassword, user.password);
    if (!passwordIsValid) {
      return response.error(res, "Password lama tidak sesuai", 401);
    }

    user.password = bcrypt.hashSync(newPassword, 8);
    await user.save();

    return response.success(res, "Password berhasil diubah", null, 200);
  } catch (err) {
    console.error(err);
    return response.error(res, "Gagal mengubah password", 500);
  }
};