import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class DeductionConfig extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    deductionconfigid: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    deductiontype: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    amount: {
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
    tableName: 'deduction_config',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "deduction_config_pkey",
        unique: true,
        fields: [
          { name: "deductionconfigid" },
        ]
      },
    ]
  });
  }
}
