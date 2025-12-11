import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class Resignation extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    resignationid: {
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
    resignationdate: {
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
    tableName: 'resignation',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "resignation_pkey",
        unique: true,
        fields: [
          { name: "resignationid" },
        ]
      },
    ]
  });
  }
}
