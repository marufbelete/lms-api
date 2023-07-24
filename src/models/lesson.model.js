const Sequelize = require("sequelize");
const sequelize = require("../util/database");

const Lesson = sequelize.define("lesson", {
  id: {
    type: Sequelize.UUID,
    defaultValue:Sequelize.UUIDV4,
    primaryKey: true,
    allowNull: false,
  },
  description: {
    type: Sequelize.STRING,
  },
  
});

module.exports = Lesson;
