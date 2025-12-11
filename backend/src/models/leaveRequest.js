import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class LeaveRequest extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    leaverequestid: {
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
    leavetype: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    startdate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    enddate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    reason: {
      type: DataTypes.TEXT,
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
    tableName: 'leave_request',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "leave_request_pkey",
        unique: true,
        fields: [
          { name: "leaverequestid" },
        ]
      },
    ]
  });
  }
}
