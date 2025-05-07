module.exports = (sequelize, DataTypes) => {
    return sequelize.define("prayer", {
      name: {
        type: DataTypes.ENUM("dhuhur", "ashar"),
        allowNull: false
      }
    });

  };
  