module.exports = (sequelize, Sequelize) => {
    return sequelize.define("student", {
      nis: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      gender: {
        type: Sequelize.ENUM("L", "P")
      },
      birth_date: {
        type: Sequelize.DATEONLY
      },
      address: {
        type: Sequelize.TEXT
      }
    });
  };
  