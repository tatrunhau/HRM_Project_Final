import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class Recruitmentplan extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    recruitmentplanid: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    plannumber: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    employeeid: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'employee',
        key: 'employeeid'
      }
    },
    effectivedate: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    issuedate: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    enddate: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    abstract: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    receivinglocation: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    linkfile: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    departmentid: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'department',
        key: 'departmentid'
      }
    }
  }, {
    sequelize,
    tableName: 'recruitmentplan',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "recruitmentplan_pkey",
        unique: true,
        fields: [
          { name: "recruitmentplanid" },
        ]
      },
    ]
  });
  }
}
