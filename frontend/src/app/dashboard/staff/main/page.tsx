'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // ✅ Import Router để chuyển hướng
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faUser, faKey, faEnvelope, faPhone, faIdCard, faBriefcase, 
    faCalendarAlt, faVenusMars, faRing, faChurch, faAddressCard, faPencil,
    faLock, faSave, faSpinner, faFileInvoiceDollar // ✅ Đã thêm các icon cần thiết cho form mật khẩu
} from '@fortawesome/free-solid-svg-icons';

import EmployeeSidebar from '@/components/EmployeeSidebar'; 
import EmployeeUpdateProfileModal, { SalaryDetailModal } from './modals';

// ✅ Import hàm từ service (đã cập nhật staff.ts trước đó)
import { 
    getCurrentUser, 
    getCertificates, 
    updateProfile, 
    changePassword, 
    StaffProfile, 
    Certificate, 
    getLatestSalary, 
    SalaryDetail,
    UpdateProfilePayload 
} from '@/services/staff/staff';

// --- LOGIC SIDEBAR LAYOUT ---
const useSidebarStateForLayout = () => {
    const [isCollapsed, setIsCollapsed] = useState(false); 
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const marginClass = isMobile ? 'ml-0' : isCollapsed ? 'md:ml-20' : 'md:ml-64';
    return { marginClass };
};

// Hàm helper format hiển thị ngày
const formatDateDisplay = (isoDate: string | undefined) => {
    if (!isoDate) return '---';
    return new Date(isoDate).toLocaleDateString('vi-VN');
};

export default function ProfilePage() {
    const router = useRouter(); // Khởi tạo router
    const [activeTab, setActiveTab] = useState('info'); 
    const { marginClass } = useSidebarStateForLayout(); 
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    
    // -- State dữ liệu --
    const [profileData, setProfileData] = useState<StaffProfile | null>(null);
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // -- State form đổi mật khẩu --
    const [passForm, setPassForm] = useState({ oldPass: '', newPass: '', confirmPass: '' });
    const [passMessage, setPassMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [isPassLoading, setIsPassLoading] = useState(false);

    const [showSalaryModal, setShowSalaryModal] = useState(false);
    const [salaryData, setSalaryData] = useState<SalaryDetail | null>(null);
    const [isSalaryLoading, setIsSalaryLoading] = useState(false);

    // 1. Fetch dữ liệu khi load trang
    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [profileRes, certRes] = await Promise.all([
                getCurrentUser(),
                getCertificates()
            ]);
            setProfileData(profileRes);
            setCertificates(certRes);
        } catch (error: any) {
            console.error("Lỗi tải trang:", error);
            // Nếu lỗi 401 (chưa đăng nhập/hết hạn), đẩy về trang login
            if (error.response?.status === 401) {
                router.push('/Login');
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // 2. Xử lý lưu thông tin hồ sơ
    const handleSaveProfile = async (formData: UpdateProfilePayload) => {
        if (!profileData?.employee?.employeeid) return;
        
        try {
            setIsSaving(true);
            await updateProfile(profileData.employee.employeeid, formData);
            alert("Cập nhật thông tin thành công!");
            
            setShowUpdateModal(false);
            await fetchData(); 

        } catch (error: any) {
            alert(error.message || "Có lỗi xảy ra khi cập nhật.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleViewSalary = async () => {
        if (!profileData?.employee?.employeeid) return;
        
        try {
            setIsSalaryLoading(true);
            const data = await getLatestSalary(profileData.employee.employeeid);
            if (data) {
                setSalaryData(data);
                setShowSalaryModal(true);
            } else {
                alert("Chưa có dữ liệu lương của tháng này!");
            }
        } catch (error) {
            console.error(error);
            alert("Không thể tải thông tin lương.");
        } finally {
            setIsSalaryLoading(false);
        }
    };

    // 3. Xử lý đổi mật khẩu (Logic mới giống Admin)
    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setPassMessage(null);
        
        // Validate dữ liệu đầu vào
        if (!passForm.oldPass) {
            setPassMessage({ type: 'error', text: "Vui lòng nhập mật khẩu hiện tại!" });
            return;
        }
        if (!passForm.newPass || !passForm.confirmPass) {
            setPassMessage({ type: 'error', text: "Vui lòng nhập đầy đủ mật khẩu mới!" });
            return;
        }
        if (passForm.newPass !== passForm.confirmPass) {
            setPassMessage({ type: 'error', text: "Mật khẩu xác nhận không khớp!" });
            return;
        }
        if (passForm.newPass.length < 6) {
             setPassMessage({ type: 'error', text: "Mật khẩu mới phải có ít nhất 6 ký tự!" });
             return;
        }

        try {
            setIsPassLoading(true);

            // Gọi API đổi mật khẩu (yêu cầu oldPass)
            await changePassword({
                oldPass: passForm.oldPass,
                newPass: passForm.newPass,
                confirmPass: passForm.confirmPass
            });
            
            setPassMessage({ type: 'success', text: "Đổi mật khẩu thành công! Hệ thống sẽ đăng xuất sau 2 giây..." });
            setPassForm({ oldPass: '', newPass: '', confirmPass: '' });

            // Tự động đăng xuất và chuyển về trang login
            setTimeout(() => {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('userRole');
                // Sửa đường dẫn này nếu trang login của bạn khác (vd: /auth/login)
                router.push('/Login'); 
            }, 2000);

        } catch (error: any) {
            const msg = error.message || error.response?.data?.message || "Lỗi đổi mật khẩu";
            setPassMessage({ type: 'error', text: msg });
        } finally {
            setIsPassLoading(false);
        }
    };

    // --- RENDER ---
    
    if (isLoading) {
        return <div className="flex h-screen items-center justify-center">Đang tải dữ liệu...</div>;
    }

    if (!profileData) {
        return <div className="flex h-screen items-center justify-center">Không tìm thấy thông tin nhân viên.</div>;
    }

    const { employee, user } = profileData;

    return (
        <div className="flex min-h-screen bg-gray-100">
            <EmployeeSidebar /> 

            <main className={`flex-1 p-4 md:p-8 transition-all duration-300 ${marginClass}`}>
                <div className="pt-12 md:pt-0">
                    <h1 className="text-3xl font-bold text-gray-800 mb-6">Quản Lý Thông Tin Cá Nhân</h1>
                    
                    {/* Tab Navigation */}
                    <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
                        <button
                            onClick={() => setActiveTab('info')}
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors duration-200 ${activeTab === 'info' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <FontAwesomeIcon icon={faUser} /> Xem Thông Tin
                        </button>
                        <button
                            onClick={() => setActiveTab('password')}
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors duration-200 ${activeTab === 'password' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <FontAwesomeIcon icon={faKey} /> Cập Nhật Mật Khẩu
                        </button>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md min-h-[500px]">
                    
                    {/* --- TAB 1: THÔNG TIN --- */}
                    {activeTab === 'info' && (
                        <section>
                            <div className="flex justify-between items-center mb-4 border-b pb-2">
                                <h2 className="text-2xl font-semibold">Thông Tin Hồ Sơ</h2>
<div className="flex gap-2">
                                    {/* NÚT XEM LƯƠNG (MỚI) */}
                                    <button
                                        onClick={handleViewSalary}
                                        disabled={isSalaryLoading}
                                        className="flex items-center gap-2 bg-green-600 text-white px-3 py-1.5 text-sm rounded-lg hover:bg-green-700 transition duration-200 shadow-md"
                                    >
                                        {isSalaryLoading ? (
                                            <FontAwesomeIcon icon={faSpinner} spin />
                                        ) : (
                                            <FontAwesomeIcon icon={faFileInvoiceDollar} className="w-4 h-4" />
                                        )}
                                        Xem Phiếu Lương
                                    </button>

                                    {/* Nút cập nhật thông tin (Cũ) */}
                                    <button
                                        onClick={() => setShowUpdateModal(true)}
                                        className="flex items-center gap-2 bg-blue-500 text-white px-3 py-1.5 text-sm rounded-lg hover:bg-blue-600 transition duration-200 shadow-md"
                                    >
                                        <FontAwesomeIcon icon={faPencil} className="w-4 h-4" /> 
                                        Cập nhật Thông tin
                                    </button>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {/* Cột 1: Cá nhân */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-blue-600 border-b border-blue-100 pb-1">Cá Nhân</h3>
                                    <InfoItem icon={faUser} label="Họ và tên" value={employee.name || user.name} />
                                    <InfoItem icon={faAddressCard} label="Mã nhân viên" value={employee.employeecode} />
                                    <InfoItem icon={faIdCard} label="CCCD/CMND" value={employee.cccd?.toString() || '---'} />
                                    <InfoItem icon={faCalendarAlt} label="Ngày sinh" value={formatDateDisplay(employee.dateofbirth)} />
                                    <InfoItem icon={faVenusMars} label="Giới tính" value={employee.gender ? 'Nam' : 'Nữ'} />
                                    <InfoItem icon={faRing} label="Tình trạng Hôn nhân" value={employee.maritalstatus ? 'Đã kết hôn' : 'Độc thân'} />
                                    <InfoItem icon={faChurch} label="Tôn giáo" value={employee.religion ? 'Có' : 'Không'} />
                                </div>

                                {/* Cột 2: Liên hệ */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-blue-600 border-b border-blue-100 pb-1">Liên Hệ</h3>
                                    <InfoItem icon={faEnvelope} label="Email" value={employee.email || '---'} />
                                    <InfoItem icon={faPhone} label="Số điện thoại" value={employee.phonenumber?.toString() || '---'} />
                                </div>
                                
                                {/* Cột 3: Công việc & Học vấn */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-blue-600 border-b border-blue-100 pb-1">Công Việc & Học Vấn</h3>
                                    <InfoItem icon={faBriefcase} label="Phòng ban" value={employee.department?.name || '---'} />
                                    <InfoItem icon={faBriefcase} label="Chức danh" value={employee.jobtitle?.name || '---'} />
                                    <InfoItem icon={faCalendarAlt} label="Ngày vào làm" value={formatDateDisplay(employee.joineddate)} />
                                    <InfoItem icon={faAddressCard} label="Trình độ Học vấn" value={employee.educationlevel_certificate?.name || 'Chưa cập nhật'} />
                                    
                                    {employee.cv_file && (
                                        <div className="mt-2">
                                            <p className="text-sm font-medium text-gray-500 mb-1">Hồ sơ đính kèm</p>
                                            <a href={employee.cv_file} target="_blank" rel="noreferrer" className="text-blue-600 underline text-sm hover:text-blue-800">
                                                Xem hồ sơ
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>
                    )}

                    {/* --- TAB 2: MẬT KHẨU --- */}
                    {activeTab === 'password' && (
                        <section id="change-password" className="max-w-md mx-auto py-4">
                            <h2 className="text-2xl font-semibold mb-6 border-b pb-2 text-center text-gray-800">Cập Nhật Mật Khẩu</h2>
                            
                            {/* Thông báo */}
                            {passMessage && (
                                <div className={`mb-4 p-3 rounded-lg text-sm font-medium border text-center animate-pulse ${
                                    passMessage.type === 'success' 
                                        ? 'bg-green-50 text-green-700 border-green-200' 
                                        : 'bg-red-50 text-red-700 border-red-200'
                                }`}>
                                    {passMessage.text}
                                </div>
                            )}

                            <form onSubmit={handlePasswordUpdate} className="space-y-5">
                                
                                {/* 1. Mật khẩu hiện tại */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Mật khẩu hiện tại <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                            <FontAwesomeIcon icon={faKey} />
                                        </div>
                                        <input 
                                            type="password" 
                                            className="w-full pl-10 p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm" 
                                            placeholder="Nhập mật khẩu đang dùng..."
                                            required
                                            value={passForm.oldPass}
                                            onChange={e => setPassForm({...passForm, oldPass: e.target.value})}
                                        />
                                    </div>
                                </div>

                                {/* 2. Mật khẩu mới */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Mật khẩu mới <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                            <FontAwesomeIcon icon={faLock} />
                                        </div>
                                        <input 
                                            type="password" 
                                            className="w-full pl-10 p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm" 
                                            placeholder="Tối thiểu 6 ký tự..."
                                            required
                                            value={passForm.newPass}
                                            onChange={e => setPassForm({...passForm, newPass: e.target.value})}
                                        />
                                    </div>
                                </div>

                                {/* 3. Xác nhận mật khẩu */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Xác nhận mật khẩu <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                            <FontAwesomeIcon icon={faLock} />
                                        </div>
                                        <input 
                                            type="password" 
                                            className="w-full pl-10 p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm" 
                                            placeholder="Nhập lại mật khẩu mới..."
                                            required
                                            value={passForm.confirmPass}
                                            onChange={e => setPassForm({...passForm, confirmPass: e.target.value})}
                                        />
                                    </div>
                                </div>

                                {/* Nút Submit */}
                                <button 
                                    type="submit" 
                                    disabled={isPassLoading}
                                    className={`w-full flex justify-center items-center gap-2 text-white p-2.5 rounded-lg font-medium transition duration-200 mt-2
                                        ${isPassLoading 
                                            ? 'bg-blue-400 cursor-not-allowed' 
                                            : 'bg-blue-600 hover:bg-blue-700 shadow-md active:scale-[0.99]'}`}
                                >
                                    {isPassLoading ? (
                                        <>
                                            <FontAwesomeIcon icon={faSpinner} spin /> Đang xử lý...
                                        </>
                                    ) : (
                                        <>
                                            <FontAwesomeIcon icon={faSave} /> Cập Nhật Mật Khẩu
                                        </>
                                    )}
                                </button>
                            </form>
                        </section>
                    )}

                    {/* MODAL CẬP NHẬT THÔNG TIN */}
                    <EmployeeUpdateProfileModal
                        showModal={showUpdateModal}
                        setShowModal={setShowUpdateModal}
                        initialData={employee} // Dữ liệu hiện tại
                        certificates={certificates} // Danh sách bằng cấp để chọn
                        onSave={handleSaveProfile}
                        isSaving={isSaving}
                    />

                    {/* MODAL XEM LƯƠNG (MỚI) */}
                    <SalaryDetailModal 
                        showModal={showSalaryModal}
                        setShowModal={setShowSalaryModal}
                        data={salaryData}
                        employeeName={employee.name || user.name}
                    />
                </div>
            </main>
        </div>
    );
}

// Component hiển thị từng dòng thông tin
const InfoItem = ({ icon, label, value }: { icon: any, label: string, value: string }) => (
    <div className="flex items-start group">
        <div className="mt-1 w-8 h-8 flex items-center justify-center rounded-full bg-blue-50 group-hover:bg-blue-100 transition-colors">
             <FontAwesomeIcon icon={icon} className="w-4 h-4 text-blue-500" />
        </div>
        <div className="ml-3">
            <p className="text-sm font-medium text-gray-500">{label}</p>
            <p className="text-base font-semibold text-gray-900 break-words">{value}</p>
        </div>
    </div>
);