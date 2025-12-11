import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class OtConfig extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    ot_config_id: {
      autoIncrement: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    ot_type: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    rate: {
      type: DataTypes.DECIMAL,
      allowNull: false
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.fn('now')
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'ot_config',
    schema: 'public',
    hasTrigger: true,
    timestamps: false,
    indexes: [
      {
        name: "ot_config_pkey",
        unique: true,
        fields: [
          { name: "ot_config_id" },
        ]
      },
    ]
  });
  }
}
