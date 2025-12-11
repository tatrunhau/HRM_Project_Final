import _sequelize from "sequelize";
const DataTypes = _sequelize.DataTypes;
import _AdvanceRequest from  "./advanceRequest.js";
import _Allowance from  "./allowance.js";
import _Candidate from  "./candidate.js";
import _Certificate from  "./certificate.js";
import _Contract from  "./contract.js";
import _DeductionConfig from  "./deductionConfig.js";
import _Department from  "./department.js";
import _Document from  "./document.js";
import _Employee from  "./employee.js";
import _EmployeePosition from  "./employeePosition.js";
import _Holiday from  "./holiday.js";
import _InsuranceConfig from  "./insuranceConfig.js";
import _Jobtitle from  "./jobtitle.js";
import _LeaveRequest from  "./leaveRequest.js";
import _OtConfig from  "./otConfig.js";
import _OvertimeRequest from  "./overtimeRequest.js";
import _PenaltyConfig from  "./penaltyConfig.js";
import _Permission from  "./permission.js";
import _Position from  "./position.js";
import _Profile from  "./profile.js";
import _Recruitmentplan from  "./recruitmentplan.js";
import _Resignation from  "./resignation.js";
import _Role from  "./role.js";
import _Rolepermission from  "./rolepermission.js";
import _Salary from  "./salary.js";
import _Session from  "./session.js";
import _Shift from  "./shift.js";
import _TaxConfig from  "./taxConfig.js";
import _Timekeeping from  "./timekeeping.js";
import _User from  "./user.js";

export default function initModels(sequelize) {
  const AdvanceRequest = _AdvanceRequest.init(sequelize, DataTypes);
  const Allowance = _Allowance.init(sequelize, DataTypes);
  const Candidate = _Candidate.init(sequelize, DataTypes);
  const Certificate = _Certificate.init(sequelize, DataTypes);
  const Contract = _Contract.init(sequelize, DataTypes);
  const DeductionConfig = _DeductionConfig.init(sequelize, DataTypes);
  const Department = _Department.init(sequelize, DataTypes);
  const Document = _Document.init(sequelize, DataTypes);
  const Employee = _Employee.init(sequelize, DataTypes);
  const EmployeePosition = _EmployeePosition.init(sequelize, DataTypes);
  const Holiday = _Holiday.init(sequelize, DataTypes);
  const InsuranceConfig = _InsuranceConfig.init(sequelize, DataTypes);
  const Jobtitle = _Jobtitle.init(sequelize, DataTypes);
  const LeaveRequest = _LeaveRequest.init(sequelize, DataTypes);
  const OtConfig = _OtConfig.init(sequelize, DataTypes);
  const OvertimeRequest = _OvertimeRequest.init(sequelize, DataTypes);
  const PenaltyConfig = _PenaltyConfig.init(sequelize, DataTypes);
  const Permission = _Permission.init(sequelize, DataTypes);
  const Position = _Position.init(sequelize, DataTypes);
  const Profile = _Profile.init(sequelize, DataTypes);
  const Recruitmentplan = _Recruitmentplan.init(sequelize, DataTypes);
  const Resignation = _Resignation.init(sequelize, DataTypes);
  const Role = _Role.init(sequelize, DataTypes);
  const Rolepermission = _Rolepermission.init(sequelize, DataTypes);
  const Salary = _Salary.init(sequelize, DataTypes);
  const Session = _Session.init(sequelize, DataTypes);
  const Shift = _Shift.init(sequelize, DataTypes);
  const TaxConfig = _TaxConfig.init(sequelize, DataTypes);
  const Timekeeping = _Timekeeping.init(sequelize, DataTypes);
  const User = _User.init(sequelize, DataTypes);

  Employee.belongsToMany(Position, { as: 'positionid_positions', through: EmployeePosition, foreignKey: "employeeid", otherKey: "positionid" });
  Position.belongsToMany(Employee, { as: 'employeeid_employees', through: EmployeePosition, foreignKey: "positionid", otherKey: "employeeid" });
  Employee.belongsTo(Candidate, { as: "candidate", foreignKey: "candidateid"});
  Candidate.hasMany(Employee, { as: "employees", foreignKey: "candidateid"});
  Profile.belongsTo(Candidate, { as: "candidate", foreignKey: "candidateid"});
  Candidate.hasMany(Profile, { as: "profiles", foreignKey: "candidateid"});
  Employee.belongsTo(Certificate, { as: "educationlevel_certificate", foreignKey: "educationlevel"});
  Certificate.hasMany(Employee, { as: "employees", foreignKey: "educationlevel"});
  Employee.belongsTo(Contract, { as: "contract", foreignKey: "contractid"});
  Contract.hasMany(Employee, { as: "employees", foreignKey: "contractid"});
  Candidate.belongsTo(Department, { as: "department", foreignKey: "departmentid"});
  Department.hasMany(Candidate, { as: "candidates", foreignKey: "departmentid"});
  Employee.belongsTo(Department, { as: "department", foreignKey: "departmentid"});
  Department.hasMany(Employee, { as: "employees", foreignKey: "departmentid"});
  Recruitmentplan.belongsTo(Department, { as: "department", foreignKey: "departmentid"});
  Department.hasMany(Recruitmentplan, { as: "recruitmentplans", foreignKey: "departmentid"});
  AdvanceRequest.belongsTo(Employee, { as: "employee", foreignKey: "employeeid"});
  Employee.hasMany(AdvanceRequest, { as: "advance_requests", foreignKey: "employeeid"});
  EmployeePosition.belongsTo(Employee, { as: "employee", foreignKey: "employeeid"});
  Employee.hasMany(EmployeePosition, { as: "employee_positions", foreignKey: "employeeid"});
  LeaveRequest.belongsTo(Employee, { as: "employee", foreignKey: "employeeid"});
  Employee.hasMany(LeaveRequest, { as: "leave_requests", foreignKey: "employeeid"});
  OvertimeRequest.belongsTo(Employee, { as: "employee", foreignKey: "employeeid"});
  Employee.hasMany(OvertimeRequest, { as: "overtime_requests", foreignKey: "employeeid"});
  Profile.belongsTo(Employee, { as: "employee", foreignKey: "employeeid"});
  Employee.hasMany(Profile, { as: "profiles", foreignKey: "employeeid"});
  Recruitmentplan.belongsTo(Employee, { as: "employee", foreignKey: "employeeid"});
  Employee.hasMany(Recruitmentplan, { as: "recruitmentplans", foreignKey: "employeeid"});
  Resignation.belongsTo(Employee, { as: "employee", foreignKey: "employeeid"});
  Employee.hasMany(Resignation, { as: "resignations", foreignKey: "employeeid"});
  Salary.belongsTo(Employee, { as: "employee", foreignKey: "employeeid"});
  Employee.hasMany(Salary, { as: "salaries", foreignKey: "employeeid"});
  Timekeeping.belongsTo(Employee, { as: "employee", foreignKey: "employeeid"});
  Employee.hasMany(Timekeeping, { as: "timekeepings", foreignKey: "employeeid"});
  User.belongsTo(Employee, { as: "employee", foreignKey: "employeeid"});
  Employee.hasMany(User, { as: "users", foreignKey: "employeeid"});
  Candidate.belongsTo(Jobtitle, { as: "jobtitle", foreignKey: "jobtitleid"});
  Jobtitle.hasMany(Candidate, { as: "candidates", foreignKey: "jobtitleid"});
  Employee.belongsTo(Jobtitle, { as: "jobtitle", foreignKey: "jobtitleid"});
  Jobtitle.hasMany(Employee, { as: "employees", foreignKey: "jobtitleid"});
  Permission.belongsTo(Permission, { as: "parent", foreignKey: "parentid"});
  Permission.hasMany(Permission, { as: "permissions", foreignKey: "parentid"});
  Rolepermission.belongsTo(Permission, { as: "permission", foreignKey: "permissionid"});
  Permission.hasMany(Rolepermission, { as: "rolepermissions", foreignKey: "permissionid"});
  EmployeePosition.belongsTo(Position, { as: "position", foreignKey: "positionid"});
  Position.hasMany(EmployeePosition, { as: "employee_positions", foreignKey: "positionid"});
  Rolepermission.belongsTo(Role, { as: "role", foreignKey: "roleid"});
  Role.hasMany(Rolepermission, { as: "rolepermissions", foreignKey: "roleid"});
  User.belongsTo(Role, { as: "role_role", foreignKey: "role"});
  Role.hasMany(User, { as: "users", foreignKey: "role"});
  AdvanceRequest.belongsTo(User, { as: "approvedby_user", foreignKey: "approvedby"});
  User.hasMany(AdvanceRequest, { as: "advance_requests", foreignKey: "approvedby"});
  LeaveRequest.belongsTo(User, { as: "approvedby_user", foreignKey: "approvedby"});
  User.hasMany(LeaveRequest, { as: "leave_requests", foreignKey: "approvedby"});
  OvertimeRequest.belongsTo(User, { as: "approvedby_user", foreignKey: "approvedby"});
  User.hasMany(OvertimeRequest, { as: "overtime_requests", foreignKey: "approvedby"});
  Resignation.belongsTo(User, { as: "approvedby_user", foreignKey: "approvedby"});
  User.hasMany(Resignation, { as: "resignations", foreignKey: "approvedby"});
  Session.belongsTo(User, { as: "user", foreignKey: "userid"});
  User.hasOne(Session, { as: "session", foreignKey: "userid"});

  return {
    AdvanceRequest,
    Allowance,
    Candidate,
    Certificate,
    Contract,
    DeductionConfig,
    Department,
    Document,
    Employee,
    EmployeePosition,
    Holiday,
    InsuranceConfig,
    Jobtitle,
    LeaveRequest,
    OtConfig,
    OvertimeRequest,
    PenaltyConfig,
    Permission,
    Position,
    Profile,
    Recruitmentplan,
    Resignation,
    Role,
    Rolepermission,
    Salary,
    Session,
    Shift,
    TaxConfig,
    Timekeeping,
    User,
  };
}
