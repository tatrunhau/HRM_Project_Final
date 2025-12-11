import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class Shift extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    shiftId: {
      autoIncrement: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    startTime: {
      type: DataTypes.TIME,
      allowNull: false
    },
    endTime: {
      type: DataTypes.TIME,
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'shift',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "shift_pkey",
        unique: true,
        fields: [
          { name: "shiftId" },
        ]
      },
    ]
  });
  }
}
