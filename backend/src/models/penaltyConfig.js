import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class PenaltyConfig extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    penaltyconfigid: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    penaltytype: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    min_minutes: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    max_minutes: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    penaltyrate: {
      type: DataTypes.DECIMAL,
      allowNull: true
    },
    fixedamount: {
      type: DataTypes.DECIMAL,
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true
    }
  }, {
    sequelize,
    tableName: 'penalty_config',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "penalty_config_pkey",
        unique: true,
        fields: [
          { name: "penaltyconfigid" },
        ]
      },
    ]
  });
  }
}
