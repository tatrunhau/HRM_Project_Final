import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class Position extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    positionid: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    positioncode: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false
    },
    bonus: {
      type: DataTypes.DECIMAL,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'position',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "position_pkey",
        unique: true,
        fields: [
          { name: "positionid" },
        ]
      },
    ]
  });
  }
}
