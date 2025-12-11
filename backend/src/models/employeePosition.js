import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class EmployeePosition extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    employeeid: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'employee',
        key: 'employeeid'
      }
    },
    positionid: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'position',
        key: 'positionid'
      }
    },
    startdate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.literal('CURRENT_DATE')
    }
  }, {
    sequelize,
    tableName: 'employee_position',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "employee_position_pkey",
        unique: true,
        fields: [
          { name: "employeeid" },
          { name: "positionid" },
        ]
      },
    ]
  });
  }
}
