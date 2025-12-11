'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { faLock, faCheckCircle, faCircleNotch, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import { resetPassword } from '@/services/Login/auth'; // Đảm bảo đường dẫn đúng

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userid = searchParams.get('uid'); // Lấy userid từ URL

  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Nếu không có userid trên URL, đẩy về trang trước
  useEffect(() => {
    if (!userid) {
      router.push('/restore');
    }
  }, [userid, router]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (newPass !== confirmPass) {
      setError('Mật khẩu nhập lại không khớp!');
      setLoading(false);
      return;
    }

    if (!userid) {
        setError('Lỗi xác thực người dùng. Vui lòng thử lại từ đầu.');
        setLoading(false);
        return;
    }

    try {
      await resetPassword(userid, newPass, confirmPass);
      setSuccess(true);
      
      // Tự động chuyển về login sau 3s
      setTimeout(() => {
        router.push('/');
      }, 3000);

    } catch (err: any) {
      setError(err.message || 'Lỗi khi đặt lại mật khẩu.');
    } finally {
      setLoading(false);
    }
  };

  if (!userid) return null; // Tránh flash nội dung khi chưa check userid

  if (success) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
        <Card className="w-full max-w-[400px] shadow-lg text-center p-6">
            <div className="text-green-500 text-6xl mb-4">
                <FontAwesomeIcon icon={faCheckCircle} />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Hoàn tất!</h3>
            <p className="text-gray-600 mb-6">
                Mật khẩu của bạn đã được thay đổi thành công.<br/>
                Đang chuyển về trang đăng nhập...
            </p>
            <Button className="w-full" onClick={() => router.push('/')}>
                Về đăng nhập ngay
            </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
      <Card className="w-full max-w-[400px] shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">Đặt lại mật khẩu</CardTitle>
          <CardDescription className="text-center text-gray-500">
            Tạo mật khẩu mới cho tài khoản của bạn
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

            {error && <div className="mb-4 p-2 bg-red-50 text-red-600 text-sm rounded border border-red-200">{error}</div>}

            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? <><FontAwesomeIcon icon={faCircleNotch} className="animate-spin mr-2"/> Đang lưu...</> : 'Xác nhận thay đổi'}
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