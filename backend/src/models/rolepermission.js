import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class Rolepermission extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    rolepermissionid: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    roleid: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'role',
        key: 'roleid'
      }
    },
    permissionid: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'permission',
        key: 'permissionid'
      }
    },
    status: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false
    }
  }, {
    sequelize,
    tableName: 'rolepermission',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "rolepermission_pkey",
        unique: true,
        fields: [
          { name: "rolepermissionid" },
        ]
      },
    ]
  });
  }
}
