import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class TaxConfig extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    taxconfigid: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    taxlevel: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    minamount: {
      type: DataTypes.DECIMAL,
      allowNull: true
    },
    maxamount: {
      type: DataTypes.DECIMAL,
      allowNull: true
    },
    taxrate: {
      type: DataTypes.DECIMAL,
      allowNull: true
    },
    effectivedate: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.fn('now')
    },
    status: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true
    }
  }, {
    sequelize,
    tableName: 'tax_config',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "tax_config_pkey",
        unique: true,
        fields: [
          { name: "taxconfigid" },
        ]
      },
    ]
  });
  }
}
