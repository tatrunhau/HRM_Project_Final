import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class Jobtitle extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    jobtitleid: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    jobtitlecode: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'jobtitle',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "jobtitle_pkey",
        unique: true,
        fields: [
          { name: "jobtitleid" },
        ]
      },
    ]
  });
  }
}
