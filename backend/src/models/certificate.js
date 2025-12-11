import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class Certificate extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    certificateid: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    certificatecode: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'certificate',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "certificate_pkey",
        unique: true,
        fields: [
          { name: "certificateid" },
        ]
      },
    ]
  });
  }
}
