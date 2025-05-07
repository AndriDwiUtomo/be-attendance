const { authJwt } = require("../middleware");
const controller = require("../controllers/class.controller");

module.exports = app => {app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, Content-Type, Accept"
    );
    next();
  });

  app.post("/api/classes", [authJwt.verifyToken, authJwt.isAdmin], controller.create);
  app.get("/api/classes",[authJwt.verifyToken, authJwt.isAdmin], controller.findAll);
  app.get("/api/classes/:id",[authJwt.verifyToken, authJwt.isAdmin], controller.findOne);
  app.put("/api/classes/:id",[authJwt.verifyToken, authJwt.isAdmin], controller.update);
  app.delete("/api/classes/:id",[authJwt.verifyToken, authJwt.isAdmin], controller.delete);
};
