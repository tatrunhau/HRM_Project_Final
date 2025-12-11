import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class Contract extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    contractid: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    contractcode: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'contract',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "contract_pkey",
        unique: true,
        fields: [
          { name: "contractid" },
        ]
      },
    ]
  });
  }
}
