import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class Holiday extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    holiday_id: {
      autoIncrement: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    holiday_name: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    is_annual: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
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
    tableName: 'holiday',
    schema: 'public',
    hasTrigger: true,
    timestamps: false,
    indexes: [
      {
        name: "holiday_pkey",
        unique: true,
        fields: [
          { name: "holiday_id" },
        ]
      },
    ]
  });
  }
}
