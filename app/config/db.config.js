const fs = require('fs');
const path = require('path');

console.log({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  db: process.env.DB_NAME,
  port: process.env.DB_PORT
});

module.exports = {
  HOST: process.env.DB_HOST,
  USER: process.env.DB_USER,
  PASSWORD: process.env.DB_PASSWORD,
  DB: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT),
  dialect: "mysql",
  dialectOptions: {
    ssl: {
      ca: fs.readFileSync(path.join(__dirname, "certs", "ca.pem"))
    }
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};
