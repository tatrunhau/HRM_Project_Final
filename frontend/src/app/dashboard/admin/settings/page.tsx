'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Import UI Components
import Sidebar from '@/components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faKey,
  faSignOutAlt,
  faLock,
  faSave,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';

// ✅ Import các hàm xử lý từ Service (đã tách)
import { getAuthMe, changePassword, signOut } from '@/services/admin/auth';

export default function SettingsPage() {
  const router = useRouter();

  // --- STATES ---
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // State cho form
  const [passwords, setPasswords] = useState({
    oldPass: '',
    newPass: '',
    confirmPass: ''
  });

  // --- 1. LOAD USER INFO ---
  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Gọi hàm từ service thay vì axios trực tiếp
        const data = await getAuthMe(); 
        setCurrentUser(data.user);
      } catch (error) {
        console.error("Lỗi xác thực:", error);
        // Nếu token lỗi hoặc hết hạn, đẩy về trang login
        router.push('/Login');
      }
    };

    fetchUser();
  }, [router]);

  // --- 2. HANDLE INPUT CHANGE ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
    // Xóa thông báo lỗi khi người dùng bắt đầu nhập lại
    if (message?.type === 'error') setMessage(null);
  };

  // --- 3. XỬ LÝ ĐỔI MẬT KHẨU ---
  const handleUpdatePassword = async () => {
    setMessage(null);

    // Validate phía Client
    if (!passwords.oldPass) {
        setMessage({ type: 'error', text: 'Vui lòng nhập mật khẩu hiện tại.' });
        return;
    }
    if (!passwords.newPass || !passwords.confirmPass) {
      setMessage({ type: 'error', text: 'Vui lòng nhập mật khẩu mới và xác nhận.' });
      return;
    }
    if (passwords.newPass !== passwords.confirmPass) {
      setMessage({ type: 'error', text: 'Mật khẩu xác nhận không khớp.' });
      return;
    }

    setLoading(true);
    try {
      // ✅ Gọi service đổi mật khẩu
      await changePassword({
        oldPass: passwords.oldPass,
        newPass: passwords.newPass,
        confirmPass: passwords.confirmPass
      });

      setMessage({ type: 'success', text: 'Đổi mật khẩu thành công! Hệ thống sẽ đăng xuất sau 2 giây...' });
      
      // Clear form
      setPasswords({ oldPass: '', newPass: '', confirmPass: '' });

      // Tự động đăng xuất để người dùng đăng nhập lại bằng pass mới
      setTimeout(() => {
        handleLogout();
      }, 2000);

    } catch (error: any) {
      // Lấy message lỗi từ service trả về
      const errorMsg = error.response?.data?.message || 'Lỗi hệ thống khi đổi mật khẩu.';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  // --- 4. XỬ LÝ ĐĂNG XUẤT ---
  const handleLogout = async () => {
    try {
      // ✅ Gọi service đăng xuất (xóa cookie server)
      await signOut();
    } catch (error) {
      console.error("Lỗi đăng xuất:", error);
    } finally {
      // Dọn dẹp local storage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('userRole'); 
      
      // Chuyển hướng
      router.push('/Login');
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar giữ nguyên để đồng bộ layout */}
      <Sidebar />

      <div className="flex-1 flex flex-col ml-64 transition-all duration-300">
        
        {/* Header Section */}
        <div className="flex justify-between items-center bg-white shadow px-6 py-4 sticky top-0 z-10">
          <h1 className="text-2xl font-bold text-gray-800">Cài đặt tài khoản</h1>
          <div className="text-gray-600 text-sm hidden sm:block">
            {currentUser ? `Xin chào, ${currentUser.name}` : 'Đang tải thông tin...'}
          </div>
        </div>

        {/* Main Content */}
        <main className="p-8 space-y-8 max-w-4xl mx-auto w-full">
          
          {/* --- CARD 1: ĐỔI MẬT KHẨU --- */}
          <Card className="shadow-lg bg-white">
            <CardHeader className="border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                    <FontAwesomeIcon icon={faKey} />
                </div>
                <CardTitle className="text-xl font-bold text-gray-800">Đổi mật khẩu</CardTitle>
              </div>
            </CardHeader>
            
            <CardContent className="pt-6 space-y-5">
              
              {/* Thông báo trạng thái */}
              {message && (
                <div className={`p-3 rounded-lg text-sm font-medium border ${
                  message.type === 'success' 
                    ? 'bg-green-50 text-green-700 border-green-200' 
                    : 'bg-red-50 text-red-700 border-red-200'
                }`}>
                  {message.text}
                </div>
              )}

              {/* Input: Mật khẩu cũ */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <FontAwesomeIcon icon={faLock} className="text-gray-400 text-xs" />
                  Mật khẩu hiện tại
                </label>
                <input 
                  type="password" 
                  name="oldPass"
                  value={passwords.oldPass}
                  onChange={handleChange}
                  placeholder="Nhập mật khẩu hiện tại..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>

              {/* Grid: Mật khẩu mới & Xác nhận */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Mật khẩu mới</label>
                    <input 
                      type="password" 
                      name="newPass"
                      value={passwords.newPass}
                      onChange={handleChange}
                      placeholder="Mật khẩu mới..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Xác nhận mật khẩu</label>
                    <input 
                      type="password" 
                      name="confirmPass"
                      value={passwords.confirmPass}
                      onChange={handleChange}
                      placeholder="Nhập lại mật khẩu mới..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                </div>
              </div>

              {/* Button Action */}
              <div className="pt-4 flex justify-end">
                <button 
                  onClick={handleUpdatePassword}
                  disabled={loading}
                  className={`flex items-center gap-2 font-semibold py-2.5 px-6 rounded-lg shadow transition-all text-white
                    ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 active:scale-95'}`}
                >
                  {loading ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} spin /> Đang xử lý...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faSave} /> Cập nhật mật khẩu
                    </>
                  )}
                </button>
              </div>
            </CardContent>
          </Card>

          {/* --- CARD 2: ĐĂNG XUẤT --- */}
          <Card className="shadow-lg bg-white border-l-4 border-red-500">
            <CardContent className="p-6 flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <FontAwesomeIcon icon={faSignOutAlt} className="text-red-500" />
                    Đăng xuất khỏi hệ thống
                </h3>
                <p className="text-gray-500 text-sm mt-1">
                    Bạn sẽ cần đăng nhập lại để tiếp tục làm việc. Hãy đảm bảo bạn đã lưu mọi thay đổi.
                </p>
              </div>
              
              <button 
                onClick={handleLogout}
                className="whitespace-nowrap bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 font-semibold py-2.5 px-6 rounded-lg transition-all shadow-sm active:bg-red-100"
              >
                Đăng xuất ngay
              </button>
            </CardContent>
          </Card>

        </main>
      </div>
    </div>
  );
}