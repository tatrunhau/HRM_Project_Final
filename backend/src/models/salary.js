import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class Salary extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    salaryid: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    employeeid: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'employee',
        key: 'employeeid'
      }
    },
    month: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    basicsalary: {
      type: DataTypes.DECIMAL,
      allowNull: true
    },
    totalallowance: {
      type: DataTypes.DECIMAL,
      allowNull: true
    },
    overtimeamount: {
      type: DataTypes.DECIMAL,
      allowNull: true
    },
    insuranceamount: {
      type: DataTypes.DECIMAL,
      allowNull: true
    },
    taxamount: {
      type: DataTypes.DECIMAL,
      allowNull: true
    },
    penaltyamount: {
      type: DataTypes.DECIMAL,
      allowNull: true
    },
    advanceamount: {
      type: DataTypes.DECIMAL,
      allowNull: true
    },
    otherdeductions: {
      type: DataTypes.DECIMAL,
      allowNull: true
    },
    netsalary: {
      type: DataTypes.DECIMAL,
      allowNull: true
    },
    status: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: "pending"
    },
    calculateddate: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'salary',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "salary_pkey",
        unique: true,
        fields: [
          { name: "salaryid" },
        ]
      },
    ]
  });
  }
}
