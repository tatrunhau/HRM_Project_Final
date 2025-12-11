import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class User extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    userid: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    usercode: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    employeeid: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'employee',
        key: 'employeeid'
      }
    },
    role: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'role',
        key: 'roleid'
      }
    },
    pass: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false
    }
  }, {
    sequelize,
    tableName: 'user',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "user_pkey",
        unique: true,
        fields: [
          { name: "userid" },
        ]
      },
    ]
  });
  }
}
