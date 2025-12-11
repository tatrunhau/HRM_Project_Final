'use client';
import React, { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faExclamationTriangle,
    faChartPie,
    faChartBar,
    faSearchDollar,
    faSpinner,
    faRobot,
    faFilePdf,
    faChevronLeft,  // Icon nút lùi
    faChevronRight  // Icon nút tiến
} from '@fortawesome/free-solid-svg-icons';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';

// --- IMPORT SERVICE ---
import {
    getReportStats,
    predictAttrition,
    DepartmentStat,
    ContractStat,
    downloadReportPDF,
    RiskEmployee
} from '@/services/admin/report';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function ReportsPage() {
    // --- STATE QUẢN LÝ DỮ LIỆU BIỂU ĐỒ ---
    const [deptData, setDeptData] = useState<DepartmentStat[]>([]);
    const [contractData, setContractData] = useState<ContractStat[]>([]);

    // --- STATE QUẢN LÝ AI PREDICTION ---
    const [riskEmployeesData, setRiskEmployeesData] = useState<RiskEmployee[]>([]);
    const [isPredicting, setIsPredicting] = useState(false);
    const [hasPredicted, setHasPredicted] = useState(false);

    // --- STATE PHÂN TRANG (MỚI THÊM) ---
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5; // Số lượng nhân viên hiển thị trên 1 trang

    const [isExporting, setIsExporting] = useState(false);

    // --- LOGIC TÍNH TOÁN PHÂN TRANG ---
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;

    // Cắt mảng dữ liệu để chỉ lấy các item của trang hiện tại
    const currentRiskItems = riskEmployeesData.slice(indexOfFirstItem, indexOfLastItem);

    // Tính tổng số trang
    const totalPages = Math.ceil(riskEmployeesData.length / itemsPerPage);

    // Hàm chuyển trang
    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    const handleExportPDF = async () => {
        setIsExporting(true);
        try {
            await downloadReportPDF();
        } catch (error) {
            alert("Lỗi khi tải báo cáo.");
        } finally {
            setIsExporting(false);
        }
    };

    // --- USE EFFECT: GỌI API THỐNG KÊ ---
    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await getReportStats();
                if (data) {
                    setDeptData(data.departmentData);
                    setContractData(data.employeeTypeData);
                }
            } catch (error) {
                console.error("Lỗi khi tải dữ liệu trang báo cáo:", error);
            }
        };

        fetchData();
    }, []);

    // --- HÀM XỬ LÝ: GỌI AI DỰ ĐOÁN ---
    const handlePredict = async () => {
        setIsPredicting(true);
        setHasPredicted(true);
        setRiskEmployeesData([]);
        setCurrentPage(1); // Reset về trang 1 khi dự đoán mới

        try {
            const data = await predictAttrition();
            setRiskEmployeesData(data);

            if (data.length === 0) {
                console.log("Không phát hiện nhân viên nào có nguy cơ cao.");
            }
        } catch (error) {
            console.error("Lỗi dự đoán:", error);
            alert("Đã xảy ra lỗi khi chạy mô hình AI.");
        } finally {
            setIsPredicting(false);
        }
    };

    // --- GIAO DIỆN CHÍNH ---
    return (
        <div className="flex min-h-screen bg-gray-100 font-sans">
            <Sidebar />

            <div className="flex-1 flex flex-col ml-64 transition-all duration-300">

                {/* HEADER & ACTION BUTTONS */}
                <div className="flex justify-between items-center bg-white shadow px-6 py-4 sticky top-0 z-10">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Báo Cáo & Thống Kê</h1>
                        <p className="text-gray-500 text-sm">Phân tích dữ liệu nhân sự và dự báo</p>
                    </div>
                    <button
                        onClick={handleExportPDF}
                        disabled={isExporting}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow flex items-center gap-2 transition-all disabled:opacity-50"
                    >
                        {isExporting ? (
                            <><FontAwesomeIcon icon={faSpinner} className="animate-spin" /> Đang tạo PDF...</>
                        ) : (
                            <><FontAwesomeIcon icon={faFilePdf} /> Xuất Báo Cáo (PDF)</>
                        )}
                    </button>
                </div>
                {/* NỘI DUNG CHÍNH */}
                <main className="p-8 space-y-8">

                    {/* SECTION 1: BIỂU ĐỒ THỐNG KÊ (GIỮ NGUYÊN) */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Chart 1 */}
                        <Card className="bg-white shadow-md hover:shadow-lg transition-shadow border border-gray-100">
                            <CardHeader className="pb-2 border-b border-gray-100">
                                <CardTitle className="text-lg font-bold text-gray-700 flex items-center gap-2">
                                    <FontAwesomeIcon icon={faChartBar} className="text-blue-500" />
                                    Nhân sự & Quỹ lương theo phòng ban
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="h-[350px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={deptData}
                                            margin={{ top: 20, right: 60, left: 40, bottom: 5 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                            <XAxis dataKey="name" tick={false} axisLine={true} />
                                            <YAxis yAxisId="left" orientation="left" stroke="#8884d8" width={40} label={{ value: 'Nhân sự', angle: -90, position: 'insideLeft', fill: '#8884d8', fontSize: 12, offset: -5 }} />
                                            <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" width={60} label={{ value: 'Quỹ lương (Triệu)', angle: 90, position: 'insideRight', fill: '#82ca9d', fontSize: 12, offset: 0 }} />
                                            <RechartsTooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} formatter={(value: any, name: any, props: any) => { if (props.dataKey === 'salary') { return [value, 'Quỹ lương (Triệu VNĐ)']; } return [value, 'Số nhân viên']; }} />
                                            <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: '20px' }} />
                                            <Bar yAxisId="left" dataKey="employees" name="Nhân viên" fill="#8884d8" radius={[4, 4, 0, 0]} barSize={30} />
                                            <Bar yAxisId="right" dataKey="salary" name="Quỹ lương" fill="#82ca9d" radius={[4, 4, 0, 0]} barSize={30} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Chart 2 */}
                        <Card className="bg-white shadow-md hover:shadow-lg transition-shadow border border-gray-100">
                            <CardHeader className="pb-2 border-b border-gray-100">
                                <CardTitle className="text-lg font-bold text-gray-700 flex items-center gap-2">
                                    <FontAwesomeIcon icon={faChartPie} className="text-purple-500" />
                                    Cơ cấu loại hình hợp đồng
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="h-[380px] w-full flex items-center justify-center">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={contractData} cx="50%" cy="45%" innerRadius={60} outerRadius={95} fill="#8884d8" paddingAngle={5} dataKey="value" labelLine={true} label={({ name, percent }) => percent > 0 ? `${(percent * 100).toFixed(0)}%` : ''}>
                                                {contractData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={2} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px' }} formatter={(value) => [`${value} Nhân sự`]} />
                                            <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: '10px' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* SECTION 2: DANH SÁCH RỦI RO (AI PREDICTION) */}
                    <div className="mt-8">
                        <Card className="bg-white shadow-md border-t-4 border-red-500 hover:shadow-lg transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 pb-4">
                                <div>
                                    <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-3">
                                        <FontAwesomeIcon icon={faRobot} className="text-red-600 text-2xl" />
                                        Dự Báo Nguy Cơ Nghỉ Việc (AI)
                                    </CardTitle>
                                    <p className="text-sm text-gray-500 mt-2 ml-1">
                                        Phân tích realtime bằng thuật toán XGBoost dựa trên dữ liệu hiện tại.
                                    </p>
                                </div>

                                <button
                                    onClick={handlePredict}
                                    disabled={isPredicting}
                                    className={`
                                        flex items-center gap-2 px-5 py-2.5 rounded-lg shadow-md font-bold text-white transition-all
                                        ${isPredicting
                                            ? 'bg-gray-400 cursor-not-allowed'
                                            : 'bg-red-600 hover:bg-red-700 hover:shadow-lg animate-pulse hover:animate-none'
                                        }
                                    `}
                                >
                                    {isPredicting ? (
                                        <><FontAwesomeIcon icon={faSpinner} className="animate-spin" /> Đang phân tích...</>
                                    ) : (
                                        <><FontAwesomeIcon icon={faSearchDollar} /> Quét Rủi Ro Ngay</>
                                    )}
                                </button>
                            </CardHeader>

                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Mã NV</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Họ Tên</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Phòng Ban</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Mức Độ Rủi Ro</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Tỷ Lệ (%)</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Lý Do Dự Đoán</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">

                                            {/* TRƯỜNG HỢP 1: CHƯA BẤM NÚT */}
                                            {!hasPredicted && !isPredicting && (
                                                <tr>
                                                    <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                                                        <FontAwesomeIcon icon={faExclamationTriangle} className="text-gray-300 text-4xl mb-3 block mx-auto" />
                                                        <span className="text-lg">Dữ liệu realtime chưa được tải.</span>
                                                        <p className="text-sm mt-1">Nhấn nút <b>"Quét Rủi Ro Ngay"</b> để AI bắt đầu phân tích.</p>
                                                    </td>
                                                </tr>
                                            )}

                                            {/* TRƯỜNG HỢP 2: KHÔNG CÓ KẾT QUẢ */}
                                            {hasPredicted && !isPredicting && riskEmployeesData.length === 0 && (
                                                <tr>
                                                    <td colSpan={6} className="px-6 py-10 text-center text-green-600">
                                                        <span className="text-lg font-bold">Tuyệt vời!</span>
                                                        <p>Hiện tại không phát hiện nhân viên nào có nguy cơ nghỉ việc trên 70%.</p>
                                                    </td>
                                                </tr>
                                            )}

                                            {/* TRƯỜNG HỢP 3: CÓ DỮ LIỆU - DÙNG BIẾN currentRiskItems ĐÃ CẮT TRANG */}
                                            {currentRiskItems.map((emp, idx) => (
                                                <tr key={idx} className="hover:bg-red-50 transition-colors cursor-default animate-in fade-in slide-in-from-bottom-2 duration-500">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{emp.id}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">{emp.name}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{emp.dept}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full border ${emp.riskScore === 'Cao'
                                                            ? 'bg-red-100 text-red-700 border-red-200'
                                                            : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                                                            }`}>
                                                            {emp.riskScore}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm font-bold text-red-600">
                                                        {emp.probability}%
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-600 italic">
                                                        "{emp.reason}"
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* --- PHẦN ĐIỀU KHIỂN PHÂN TRANG (MỚI THÊM) --- */}
                                {riskEmployeesData.length > itemsPerPage && (
                                    <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">

                                        {/* Thông tin trang trên Mobile */}
                                        <div className="flex flex-1 justify-between sm:hidden">
                                            <button
                                                onClick={() => handlePageChange(currentPage - 1)}
                                                disabled={currentPage === 1}
                                                className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                            >
                                                Trước
                                            </button>
                                            <button
                                                onClick={() => handlePageChange(currentPage + 1)}
                                                disabled={currentPage === totalPages}
                                                className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                            >
                                                Sau
                                            </button>
                                        </div>

                                        {/* Thông tin trang trên Desktop */}
                                        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                                            <div>
                                                <p className="text-sm text-gray-700">
                                                    Hiển thị <span className="font-medium">{indexOfFirstItem + 1}</span> đến <span className="font-medium">{Math.min(indexOfLastItem, riskEmployeesData.length)}</span> trong số <span className="font-medium">{riskEmployeesData.length}</span> kết quả
                                                </p>
                                            </div>
                                            <div>
                                                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                                                    <button
                                                        onClick={() => handlePageChange(currentPage - 1)}
                                                        disabled={currentPage === 1}
                                                        className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <span className="sr-only">Previous</span>
                                                        <FontAwesomeIcon icon={faChevronLeft} className="h-3 w-3" />
                                                    </button>

                                                    {/* Hiển thị số trang */}
                                                    {[...Array(totalPages)].map((_, i) => (
                                                        <button
                                                            key={i + 1}
                                                            onClick={() => handlePageChange(i + 1)}
                                                            className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${currentPage === i + 1
                                                                ? 'z-10 bg-red-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600'
                                                                : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                                                                }`}
                                                        >
                                                            {i + 1}
                                                        </button>
                                                    ))}

                                                    <button
                                                        onClick={() => handlePageChange(currentPage + 1)}
                                                        disabled={currentPage === totalPages}
                                                        className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <span className="sr-only">Next</span>
                                                        <FontAwesomeIcon icon={faChevronRight} className="h-3 w-3" />
                                                    </button>
                                                </nav>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {/* --- KẾT THÚC PHẦN PHÂN TRANG --- */}

                            </CardContent>
                        </Card>
                    </div>

                </main>
            </div>
        </div>
    );
}