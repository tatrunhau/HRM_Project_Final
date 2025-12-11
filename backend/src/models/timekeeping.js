import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class Timekeeping extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    timekeepingid: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    employeeid: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'employee',
        key: 'employeeid'
      }
    },
    checkintime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    checkouttime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    workdate: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    late_minutes: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    early_leave_minutes: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    status: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'timekeeping',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "timekeeping_pkey",
        unique: true,
        fields: [
          { name: "timekeepingid" },
        ]
      },
    ]
  });
  }
}
