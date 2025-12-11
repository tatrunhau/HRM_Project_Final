import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class Permission extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    permissionid: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    permissioncode: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    parentid: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'permission',
        key: 'permissionid'
      }
    }
  }, {
    sequelize,
    tableName: 'permission',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "permission_pkey",
        unique: true,
        fields: [
          { name: "permissionid" },
        ]
      },
    ]
  });
  }
}
