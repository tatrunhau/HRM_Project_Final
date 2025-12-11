import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class Session extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    userid: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'user',
        key: 'userid'
      }
    },
    refreshtoken: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: "session_refreshtoken_key"
    },
    expiresat: {
      type: DataTypes.DATEONLY,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'session',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "session_pkey",
        unique: true,
        fields: [
          { name: "userid" },
        ]
      },
      {
        name: "session_refreshtoken_key",
        unique: true,
        fields: [
          { name: "refreshtoken" },
        ]
      },
    ]
  });
  }
}
