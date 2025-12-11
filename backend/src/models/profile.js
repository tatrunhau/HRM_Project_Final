import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class Profile extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    profileid: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    profilecode: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    candidateid: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'candidate',
        key: 'candidateid'
      }
    },
    uniquefilename: {
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
    }
  }, {
    sequelize,
    tableName: 'profile',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "profile_pkey",
        unique: true,
        fields: [
          { name: "profileid" },
        ]
      },
    ]
  });
  }
}
