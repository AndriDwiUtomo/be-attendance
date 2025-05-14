const controller = require("../controllers/student.controller");
const { authJwt } = require("../middleware");
const upload = require("../middleware/upload");

module.exports = app => {
  app.post("/api/students", [authJwt.verifyToken, authJwt.isAdmin], controller.create);
  app.get("/api/students", [authJwt.verifyToken, authJwt.isAdmin], controller.findAll);
  app.get("/api/students/:id", [authJwt.verifyToken, authJwt.isAdmin], controller.findOne);
  app.put("/api/students/:id",[authJwt.verifyToken, authJwt.isAdmin],  controller.update);
  app.delete("/api/students/:id",[authJwt.verifyToken, authJwt.isAdmin], controller.delete);
  app.post("/api/students/import", upload.single("file"), controller.importStudents);
};
