const db = require("../models");
const Class = db.classes;
const response = require("../utils/response");

exports.create = async (req, res) => {
  try {
    const data = await Class.create({ name: req.body.name });
    response.success(res, "Kelas berhasil dibuat", data, 201);
  } catch (err) {
    response.error(res, err.message);
  }
};

exports.findAll = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || "";

    const { count: totalItems, rows: data } = await Class.findAndCountAll({
        where: {
            name: {
                [db.Sequelize.Op.like]: `%${search}%`,
            },
        },
        limit,
        offset,
        order: [['id', 'ASC']],
    });

    const totalPages = Math.ceil(totalItems / limit);

    response.success(res, "Berhasil mengambil semua kelas", {
      currentPage: page,
      totalPages,
      totalItems,
      data,
    });
  } catch (err) {
    response.error(res, err.message);
  }
};

exports.findOne = async (req, res) => {
  try {
    const data = await Class.findByPk(req.params.id);
    if (!data) return response.error(res, "Kelas tidak ditemukan", 404);
    response.success(res, "Berhasil mengambil data kelas", data);
  } catch (err) {
    response.error(res, err.message);
  }
};

exports.update = async (req, res) => {
  try {
    const [updated] = await Class.update(req.body, { where: { id: req.params.id } });
    if (!updated) return response.error(res, "Kelas tidak ditemukan", 404);
    const data = await Class.findByPk(req.params.id);
    response.success(res, "Kelas berhasil diupdate", data);
  } catch (err) {
    response.error(res, err.message);
  }
};

exports.delete = async (req, res) => {
  try {
    const deleted = await Class.destroy({ where: { id: req.params.id } });
    if (!deleted) return response.error(res, "Kelas tidak ditemukan", 404);
    response.success(res, "Kelas berhasil dihapus", null);
  } catch (err) {
    response.error(res, err.message);
  }
};
