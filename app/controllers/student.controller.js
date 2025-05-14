const db = require("../models");
const { Op } = require('sequelize');
const Student = db.student;
const Class = db.classes;
const response = require("../utils/response");
const XLSX = require("xlsx");

exports.create = async (req, res) => {
  try {
    const data = await Student.create(req.body);
    response.success(res, "Siswa berhasil ditambahkan", data, 201);
  } catch (err) {
    response.error(res, err.message);
  }
};

exports.findAll = async (req, res) => {
  try {

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { search, classId } = req.query;

    // Filter conditions
    const whereClause = {};

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { nis: { [Op.like]: `%${search}%` } }
      ];
    }

    if (classId) {
      whereClause.classId = classId;
    }

    const { count: totalItems, rows: data } = await Student.findAndCountAll({
      where: whereClause,
      include: [Class],
      limit,
      offset,
      order: [['id', 'ASC']],
    });

    const totalPages = Math.ceil(totalItems / limit);

    response.success(res, "Berhasil mengambil data siswa", {
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
    const data = await Student.findByPk(req.params.id, { include: [Class] });
    if (!data) return response.error(res, "Siswa tidak ditemukan", 404);
    response.success(res, "Berhasil mengambil data siswa", data);
  } catch (err) {
    response.error(res, err.message);
  }
};

exports.update = async (req, res) => {
  try {
    const [updated] = await Student.update(req.body, { where: { id: req.params.id } });
    if (!updated) return response.error(res, "Siswa tidak ditemukan", 404);
    const data = await Student.findByPk(req.params.id);
    response.success(res, "Siswa berhasil diupdate", data);
  } catch (err) {
    response.error(res, err.message);
  }
};

exports.delete = async (req, res) => {
  try {
    const deleted = await Student.destroy({ where: { id: req.params.id } });
    if (!deleted) return response.error(res, "Siswa tidak ditemukan", 404);
    response.success(res, "Siswa berhasil dihapus", null);
  } catch (err) {
    response.error(res, err.message);
  }
};

exports.importStudents = async (req, res) => {
  try {
    if (!req.file) {
      return response.error(res, "File tidak ditemukan", 400);
    }

    // Baca file Excel
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(sheet);

    
    // Format data dan insert ke DB
    const students = jsonData.map((row) => {
      let birthDate = null;

      if (typeof row.birth_date === "number") {
        const parsed = XLSX.SSF.parse_date_code(row.birth_date);
        birthDate = new Date(parsed.y, parsed.m - 1, parsed.d);
      } else if (typeof row.birth_date === "string") {
        const parts = row.birth_date.split(/[-\/]/);
        if (parts.length === 3) {
          birthDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        }
      }


      return {
        name: row.name,
        nis: row.nis,
        gender: row.gender,
        classId: row.classId,
        birth_date: birthDate,
      };
    });

    const result = await Student.bulkCreate(students, { ignoreDuplicates: true });

    response.success(res, "Import data siswa berhasil", result);
  } catch (err) {
    response.error(res, err.message);
  }
};
