const controller = require("../controllers/attendance.controller");

module.exports = app => {
    app.get("/api/attendances", controller.getAttendanceByDateAndPrayer);

    // POST: Tandai siswa hadir
    app.post("/api/attendances", controller.markAttendance);
};
