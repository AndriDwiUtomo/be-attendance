const config = require("../config/db.config.js");

const Sequelize = require("sequelize");
const sequelize = new Sequelize(
  config.DB,
  config.USER,
  config.PASSWORD,
  {
    host: config.HOST,
    dialect: config.dialect,
    pool: {
      max: config.pool.max,
      min: config.pool.min,
      acquire: config.pool.acquire,
      idle: config.pool.idle
    }
  }
);

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.user = require("../models/user.model.js")(sequelize, Sequelize);
db.role = require("../models/role.model.js")(sequelize, Sequelize);
db.classes = require("../models/class.model.js")(sequelize, Sequelize);
db.student = require("../models/student.model.js")(sequelize, Sequelize);
db.prayer = require("../models/prayer.model.js")(sequelize, Sequelize);
db.attendance = require("../models/attendance.model.js")(sequelize, Sequelize);

db.role.belongsToMany(db.user, {
  through: "user_roles"
});
db.user.belongsToMany(db.role, {
  through: "user_roles"
});

db.classes.hasMany(db.student, { foreignKey: "classId" });
db.student.belongsTo(db.classes, { foreignKey: "classId" });

// Prayer - Attendance one-to-many
db.prayer.hasMany(db.attendance, { foreignKey: "prayerId" });
db.attendance.belongsTo(db.prayer, { foreignKey: "prayerId" });

// Student - Attendance one-to-many
db.student.hasMany(db.attendance, { foreignKey: "studentId" });
db.attendance.belongsTo(db.student, { foreignKey: "studentId" });

db.ROLES = ["user", "admin", "moderator"];

module.exports = db;
