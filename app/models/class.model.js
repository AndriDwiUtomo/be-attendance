module.exports = (sequelize, Sequelize) => {
    return sequelize.define("class", {
      name: {
        type: Sequelize.STRING,
        allowNull: false
      }
    });
  };