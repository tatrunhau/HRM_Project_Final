import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class Document extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    documentid: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    documentcode: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    type: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    filepath: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    createddate: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.fn('now')
    },
    status: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: "active"
    }
  }, {
    sequelize,
    tableName: 'document',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "document_pkey",
        unique: true,
        fields: [
          { name: "documentid" },
        ]
      },
    ]
  });
  }
}
