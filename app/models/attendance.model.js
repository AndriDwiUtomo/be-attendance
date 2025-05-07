module.exports = (sequelize, DataTypes) => {
    return sequelize.define("attendance", {
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false
      }
    });

  };
  