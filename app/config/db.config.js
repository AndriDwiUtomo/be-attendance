module.exports = {
  HOST: "localhost",
  USER: "root",
  PASSWORD: "DB123456",
  DB: "db_shalat",
  dialect: "mysql",
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};
