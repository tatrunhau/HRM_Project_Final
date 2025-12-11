import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class OvertimeRequest extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    overtimerequestid: {
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
    overtimedate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    starttime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    endtime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    workcontent: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    overtimehours: {
      type: DataTypes.DECIMAL,
      allowNull: true
    },
    overtimeamount: {
      type: DataTypes.DECIMAL,
      allowNull: true
    },
    status: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: "pending"
    },
    createddate: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.fn('now')
    },
    approvedby: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'user',
        key: 'userid'
      }
    },
    approveddate: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'overtime_request',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "overtime_request_pkey",
        unique: true,
        fields: [
          { name: "overtimerequestid" },
        ]
      },
    ]
  });
  }
}
