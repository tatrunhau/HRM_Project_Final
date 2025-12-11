import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class Allowance extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    allowanceid: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    allowancecode: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    amount: {
      type: DataTypes.DECIMAL,
      allowNull: true
    },
    condition: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true
    },
    apply_to_all: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true
    },
    effectivedate: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.fn('now')
    }
  }, {
    sequelize,
    tableName: 'allowance',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "allowance_pkey",
        unique: true,
        fields: [
          { name: "allowanceid" },
        ]
      },
    ]
  });
  }
}
