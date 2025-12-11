import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class Candidate extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    candidateid: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    candidatecode: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    submissiondate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    jobtitleid: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'jobtitle',
        key: 'jobtitleid'
      }
    },
    skill: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    receiveddate: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    departmentid: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'department',
        key: 'departmentid'
      }
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    isdeleted: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'candidate',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "candidate_pkey",
        unique: true,
        fields: [
          { name: "candidateid" },
        ]
      },
      {
        name: "candidate_unique",
        unique: true,
        fields: [
          { name: "candidateid" },
        ]
      },
      {
        name: "fk_candidate_department_idx",
        fields: [
          { name: "departmentid" },
        ]
      },
      {
        name: "fk_candidate_jobtitle_idx",
        fields: [
          { name: "jobtitleid" },
        ]
      },
    ]
  });
  }
}
