const db = require("../models");
const Class = db.classes;
const Prayer = db.prayer;
const Attendance = db.attendance;
const Student = db.student;
const { Op } = require("sequelize");
const { success, error } = require("../utils/response");
const ExcelJS = require("exceljs");

exports.getAttendanceByDateAndPrayer = async (req, res) => {
    try {
        const { date, prayerName, classId, page = 1, limit = 10 } = req.query;
    
        if (!date || !prayerName) {
          return error(res, "Harap sertakan 'date' dan 'prayerName'.", 400);
        }
    
        const prayer = await Prayer.findOne({ where: { name: prayerName } });
        if (!prayer) return error(res, "Jenis salat tidak ditemukan.", 404);
    
        const classFilter = classId ? { id: classId } : {};
    
        // Pagination for students, not classes
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const students = await Student.findAll({
          where: { classId: classFilter.id || { [Op.ne]: null } },
          include: [
            {
              model: Attendance,
              where: {
                date,
                prayerId: prayer.id
              },
              required: false
            },
            {
              model: Class,
              attributes: ['id', 'name'] // Menampilkan data kelas pada setiap siswa
            }
          ],
          offset,
          limit: parseInt(limit)
        });
    
        const result = students.map(student => ({
          id: student.id,
          name: student.name,
          nis: student.nis,
          hadir: student.attendances.length > 0,
          class: student.class ? { // Ensure it's 'classes' (plural) for the association
            id: student.class.id,
            name: student.class.name
        } : null
        }));
    
        const totalStudents = await Student.count({
          where: { classId: classFilter.id || { [Op.ne]: null } }
        });
    
        success(res, "Data absensi berhasil diambil.", {
          totalPages: Math.ceil(totalStudents / limit),
          currentPage: parseInt(page),
          totalItems: totalStudents,
          data: result
        });
    } catch (err) {
        console.error(err);
        error(res, "Gagal mengambil data absensi.");
    }
};

exports.markAttendance = async (req, res) => {
    try {
      const { studentId, prayerName, date } = req.body;
  
      if (!studentId || !prayerName || !date) {
        return error(res, "Data tidak lengkap.", 400);
      }
  
      const student = await Student.findByPk(studentId);
      if (!student) return error(res, "Siswa tidak ditemukan.", 404);
  
      const prayer = await Prayer.findOne({ where: { name: prayerName } });
      if (!prayer) return error(res, "Salat tidak ditemukan.", 404);
  
      const existing = await Attendance.findOne({
        where: { studentId, prayerId: prayer.id, date }
      });
  
      if (existing) {
        // Jika sudah hadir → hapus (jadi tidak hadir)
        await existing.destroy();
        return success(res, "Absensi dihapus (status: Tidak Hadir).", null, 200);
      } else {
        // Jika belum hadir → catat hadir
        await Attendance.create({ studentId, prayerId: prayer.id, date });
        return success(res, "Absensi berhasil dicatat (status: Hadir).", null, 201);
      }
    } catch (err) {
      console.error(err);
      return error(res, "Gagal memproses absensi.");
    }
};

exports.exportAttendanceToExcel = async (req, res) => {
  try {
    const { date, prayerName, classId } = req.query;

    if (!date || !prayerName) {
      return error(res, "Harap sertakan 'date' dan 'prayerName'.", 400);
    }

    const prayer = await Prayer.findOne({ where: { name: prayerName } });
    if (!prayer) return error(res, "Jenis salat tidak ditemukan.", 404);

    const classFilter = classId ? { id: classId } : {};

    const students = await Student.findAll({
      where: { classId: classFilter.id || { [Op.ne]: null } },
      include: [
        {
          model: Attendance,
          where: { date, prayerId: prayer.id },
          required: false
        },
        {
          model: Class,
          attributes: ['id', 'name']
        }
      ]
    });

    // Buat workbook Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Attendance");

    // Header dengan tambahan tanggal dan prayer name
    worksheet.columns = [
      { header: "No", key: "no", width: 5 },
      { header: "Nama", key: "name", width: 25 },
      { header: "NIS", key: "nis", width: 15 },
      { header: "Kelas", key: "className", width: 15 },
      { header: "Tanggal", key: "date", width: 15 },
      { header: "Salat", key: "prayerName", width: 15 },
      { header: "Status", key: "status", width: 15 }
    ];

    // Isi data
    students.forEach((student, index) => {
      worksheet.addRow({
        no: index + 1,
        name: student.name,
        nis: student.nis,
        className: student.class ? student.class.name : "-",
        date,
        prayerName,
        status: student.attendances.length > 0 ? "Hadir" : "Tidak Hadir"
      });
    });

    // Set response header
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=attendance-${prayerName}-${date}.xlsx`
    );
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    // Kirim Excel file sebagai stream
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error(err);
    error(res, "Gagal mengekspor data absensi.");
  }
};
