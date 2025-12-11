import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class InsuranceConfig extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    insuranceconfigid: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    insurancetype: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    employeerate: {
      type: DataTypes.DECIMAL,
      allowNull: true
    },
    employerrate: {
      type: DataTypes.DECIMAL,
      allowNull: true
    },
    maxsalarybase: {
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
    tableName: 'insurance_config',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "insurance_config_pkey",
        unique: true,
        fields: [
          { name: "insuranceconfigid" },
        ]
      },
    ]
  });
  }
}
