const db = require("../models");
const { Op, fn, col, literal } = require('sequelize');
const Student = db.student;
const Class = db.classes;
const Prayer = db.prayer;
const Attendance = db.attendance;
const moment = require('moment');
const { success, error } = require("../utils/response");

exports.getDashboardSummary = async (req, res) => {
    try {
      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];
  
      const last30Days = new Date();
      last30Days.setDate(today.getDate() - 30);
      const last30DaysStr = last30Days.toISOString().split("T")[0];
  
      // Total Kelas
      const totalClasses = await Class.count();
  
      // Kelas baru 30 hari terakhir
      const newClasses = await Class.count({
        where: {
          createdAt: {
            [Op.gte]: last30Days
          }
        }
      });
  
      // Total Siswa
      const totalStudents = await Student.count();
  
      // Siswa baru 30 hari terakhir
      const newStudents = await Student.count({
        where: {
          createdAt: {
            [Op.gte]: last30Days
          }
        }
      });
  
      // Ambil ID Dhuhur & Ashar
      const prayers = await Prayer.findAll({
        where: {
          name: ['dhuhur', 'ashar']
        }
      });
  
      const prayerIds = prayers.map(p => p.id);
  
      // Total Kehadiran Hari Ini
      const totalAttendancesToday = await Attendance.count({
        where: {
          date: todayStr,
          prayerId: prayerIds
        }
      });
  
      // Total Kehadiran 30 hari terakhir
      const totalAttendances30Days = await Attendance.count({
        where: {
          date: {
            [Op.gte]: last30DaysStr
          },
          prayerId: prayerIds
        }
      });
  
      return success(res, "Dashboard summary retrieved", {
        totalClasses,
        newClasses,
        totalStudents,
        newStudents,
        totalAttendancesToday,
        totalAttendances30Days
      });
    } catch (err) {
      console.error(err);
      return error(res, "Gagal mengambil ringkasan dashboard");
    }
  };


  exports.getAttendanceStatistics = async (req, res) => {
    try {
      const { range } = req.query;
  
      let groupFormat = "";
      let rangeCondition = {};
  
      const today = new Date();
  
      if (range === "Yearly") {
        groupFormat = "%Y";
        const startYear = new Date(today.getFullYear(), 0, 1);
        rangeCondition.date = { [Op.gte]: startYear };
      } else if (range === "Monthly") {
        groupFormat = "%Y-%m";
        const startMonth = new Date(today.getFullYear(), today.getMonth() - 5, 1); // Last 6 months
        rangeCondition.date = { [Op.gte]: startMonth };
      } else if (range === "Weekly") {
        groupFormat = "%Y-%u"; // %u = ISO week number
        const startWeek = new Date();
        startWeek.setDate(today.getDate() - 6 * 7); // Last 6 weeks
        rangeCondition.date = { [Op.gte]: startWeek };
      } else {
        // Default: Daily (last 7 days)
        groupFormat = "%Y-%m-%d";
        const startDate = new Date();
        startDate.setDate(today.getDate() - 6);
        rangeCondition.date = { [Op.gte]: startDate };
      }
  
      const attendances = await Attendance.findAll({
        attributes: [
          [fn("DATE_FORMAT", col("date"), groupFormat), "period"],
          [fn("COUNT", col("id")), "total"]
        ],
        where: rangeCondition,
        group: [literal("period")],
        order: [[literal("period"), "ASC"]]
      });
  
      const data = attendances.map(item => ({
        period: item.get("period"),
        total: parseInt(item.get("total"), 10)
      }));
  
      const total = data.reduce((sum, item) => sum + item.total, 0);
  
      let percentChange = 0;
      if (data.length >= 2) {
        const lastTotal = data[data.length - 2].total;
        const currentTotal = data[data.length - 1].total;
        if (lastTotal > 0) {
          percentChange = (((currentTotal - lastTotal) / lastTotal) * 100).toFixed(2);
        }
      }
  
      const perDay = (total / data.length).toFixed(0);
  
      return success(res, "Attendance statistics retrieved", {
        chartData: data,
        summary: {
          total: Number(total),
          percentChange: Number(percentChange),
          perDay: Number(perDay)
        }
      });
  
    } catch (err) {
      console.error(err);
      return error(res, "Gagal mengambil statistik kehadiran");
    }
  };


  exports.getAttendanceBarWeekly = async (req, res) => {
    try {
      const today = new Date();
      const startDate = new Date();
      startDate.setDate(today.getDate() - 6); // 7 hari terakhir (termasuk hari ini)
  
      // Ambil data kehadiran per hari
      const attendanceData = await Attendance.findAll({
        attributes: [
          [fn("DATE_FORMAT", col("date"), "%Y-%m-%d"), "date"],
          [fn("COUNT", col("id")), "total"]
        ],
        where: {
          date: { [Op.between]: [startDate, today] }
        },
        group: [literal("date")],
        order: [[literal("date"), "ASC"]]
      });
  
      // Bentuk objek berdasarkan tanggal
      const resultMap = {};
      for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        const key = date.toISOString().slice(0, 10); // yyyy-mm-dd
        resultMap[key] = 0;
      }
  
      attendanceData.forEach((item) => {
        const { date, total } = item.dataValues;
        resultMap[date] = parseInt(total, 10);
      });
  
      const labels = Object.keys(resultMap);
      const values = Object.values(resultMap);
      const total = values.reduce((sum, val) => sum + val, 0);
      const perDay = Math.round(total / 7);
  
      // Hitung persen perubahan dibanding 7 hari sebelumnya
      const prevStartDate = new Date(startDate);
      prevStartDate.setDate(prevStartDate.getDate() - 7);
  
      const prevTotal = await Attendance.count({
        where: {
          date: {
            [Op.between]: [prevStartDate, new Date(startDate.getTime() - 1)]
          }
        }
      });
  
      const percentChange = prevTotal > 0
        ? Math.round(((total - prevTotal) / prevTotal) * 100)
        : 0;
  
      return success(res, "Weekly bar chart attendance", {
        chartData: {
          categories: labels,
          data: values
        },
        summary: {
          total,
          percentChange,
          perDay
        }
      });
    } catch (err) {
      console.error(err);
      return error(res, "Gagal mengambil data bar chart mingguan");
    }
  };

  exports.getAttendanceDonut = async (req, res) => {
    try {
      const { range } = req.query; // Get range (Today, Weekly, Monthly, Yearly) from query params
      
      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];
  
      // Get Prayer IDs for Dhuhur and Ashar
      const prayers = await Prayer.findAll({
        where: {
          name: ['dhuhur', 'ashar'],
        },
      });
      
      const prayerIds = prayers.map((p) => p.id);
      
      // Total Siswa yang Terdaftar
      const totalStudents = await Student.count();
      
      let startDate = todayStr;
      let endDate = todayStr;
  
      // Adjust date range based on the selected range
      if (range === 'Weekly') {
        startDate = moment().startOf('week').format('YYYY-MM-DD'); // Start of the current week
        endDate = moment().endOf('week').format('YYYY-MM-DD'); // End of the current week
      } else if (range === 'Monthly') {
        startDate = moment().startOf('month').format('YYYY-MM-DD'); // Start of the current month
        endDate = moment().endOf('month').format('YYYY-MM-DD'); // End of the current month
      } else if (range === 'Yearly') {
        startDate = moment().startOf('year').format('YYYY-MM-DD'); // Start of the current year
        endDate = moment().endOf('year').format('YYYY-MM-DD'); // End of the current year
      }
  
      // Total Kehadiran berdasarkan rentang waktu
      const totalAttendances = await Attendance.count({
        where: {
          date: {
            [Op.between]: [startDate, endDate], // Filter between start and end date
          },
          prayerId: prayerIds,
        },
      });
  
      // Total Ketidakhadiran
      const totalAbsences = totalStudents - totalAttendances;
  
      // Data untuk donut chart
      const donutData = {
        series: [totalAttendances, totalAbsences],
        labels: ['Hadir', 'Tidak Hadir'],
      };
  
      return success(res, 'Donut chart kehadiran berhasil diambil', donutData);
    } catch (err) {
      console.error(err);
      return error(res, 'Gagal mengambil data donut chart kehadiran');
    }
  };