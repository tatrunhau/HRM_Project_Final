'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { faLock, faCheckCircle, faCircleNotch, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import { resetPassword } from '@/services/Login/auth';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userid = searchParams.get('uid');

  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!userid) {
      router.push('/restore');
    }
  }, [userid, router]);

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // 1. Validate phía Client
    if (newPass !== confirmPass) {
      setError('Mật khẩu nhập lại không khớp!');
      setLoading(false);
      return;
    }

    if (newPass.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự!');
      setLoading(false);
      return;
    }

    try {
      if (!userid) throw new Error("Không tìm thấy User ID");
      
      // ✅ SỬA 1: Truyền đủ 3 tham số (userid, newPass, confirmPass)
      // File auth.ts yêu cầu 3 tham số, nếu thiếu sẽ bị lỗi API
      await resetPassword(userid, newPass, confirmPass);
      
      setSuccess(true);
      
      // Chuyển hướng sau 3 giây
      setTimeout(() => {
        router.push('/Login');
      }, 3000);

    } catch (err) {
      console.error("Lỗi chi tiết:", err);

      // ✅ SỬA 2: Xử lý lỗi Object -> String (Fix lỗi React #31)
      // File auth.ts throw ra một object dạng { message: "..." }
      // Chúng ta cần lấy value của key 'message' để hiển thị
      const errorMessage = err?.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.';
      
      setError(errorMessage); 
    } finally {
      setLoading(false);
    }
  };

  // Giao diện khi thành công
  if (success) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <Card className="w-full max-w-md shadow-lg border-t-4 border-green-500">
          <CardContent className="pt-6 text-center">
            <div className="mb-4">
              <FontAwesomeIcon icon={faCheckCircle} className="text-5xl text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Thành công!</h2>
            <p className="text-gray-600 mb-6">
              Mật khẩu của bạn đã được cập nhật. Đang chuyển hướng về trang đăng nhập...
            </p>
            <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => router.push('/Login')}>
              Về trang đăng nhập ngay
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Giao diện Form nhập liệu
  return (
    <div className="flex justify-center items-center h-screen bg-gray-100 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Đặt lại mật khẩu</CardTitle>
          <CardDescription className="text-center">
            Nhập mật khẩu mới cho tài khoản của bạn
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleReset}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1 text-gray-700">
                <FontAwesomeIcon icon={faLock} className="mr-2 text-gray-500" />
                Mật khẩu mới
              </label>
              <Input
                type="password"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                placeholder="Nhập mật khẩu mới"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1 text-gray-700">
                <FontAwesomeIcon icon={faCheckCircle} className="mr-2 text-gray-500" />
                Nhập lại mật khẩu
              </label>
              <Input
                type="password"
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                required
              />
            </div>

            {/* Hiển thị lỗi (bây giờ error chắc chắn là string nên sẽ không lỗi nữa) */}
            {error && (
              <div className="mb-4 p-2 bg-red-50 text-red-600 text-sm rounded border border-red-200">
                {error}
              </div>
            )}

            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? (
                <>
                  <FontAwesomeIcon icon={faCircleNotch} className="animate-spin mr-2"/> 
                  Đang lưu...
                </>
              ) : (
                'Xác nhận thay đổi'
              )}
            </Button>

            <div className="mt-4 text-center">
              <Link 
                href="/restore" 
                className="text-sm text-gray-500 hover:text-black hover:underline flex items-center justify-center transition-colors"
              >
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2 text-xs" />
                Quay lại bước trước
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// Export component chính (đã bọc Suspense)
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen">Đang tải...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}