import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class Employee extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    employeeid: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    employeecode: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    dateofbirth: {
      type: DataTypes.DATE,
      allowNull: true
    },
    gender: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    maritalstatus: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    religion: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    email: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    phonenumber: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    cccd: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    candidateid: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'candidate',
        key: 'candidateid'
      }
    },
    jobtitleid: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'jobtitle',
        key: 'jobtitleid'
      }
    },
    joineddate: {
      type: DataTypes.DATE,
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
    contractid: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'contract',
        key: 'contractid'
      }
    },
    status: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    basicsalary: {
      type: DataTypes.DECIMAL,
      allowNull: true
    },
    layoff: {
      type: DataTypes.DATE,
      allowNull: true
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    educationlevel: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'certificate',
        key: 'certificateid'
      }
    },
    dependents: {
      type: DataTypes.DECIMAL,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'employee',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "employee_pkey",
        unique: true,
        fields: [
          { name: "employeeid" },
        ]
      },
    ]
  });
  }
}
