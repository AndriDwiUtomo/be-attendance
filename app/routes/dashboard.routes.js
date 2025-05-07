const controller = require("../controllers/dashboard.controller");
const { authJwt } = require("../middleware");

module.exports = app => {
    app.get("/api/dashboard/summary", [authJwt.verifyToken, authJwt.isAdmin],  controller.getDashboardSummary);
    app.get("/api/dashboard/attendance-statistics",[authJwt.verifyToken, authJwt.isAdmin],  controller.getAttendanceStatistics);
    app.get("/api/dashboard/attendance-weekly-bar",[authJwt.verifyToken, authJwt.isAdmin],  controller.getAttendanceBarWeekly);
    app.get("/api/dashboard/attendance-donut",[authJwt.verifyToken, authJwt.isAdmin],  controller.getAttendanceDonut);

};
