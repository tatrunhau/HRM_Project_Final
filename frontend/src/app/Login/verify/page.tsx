'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { faUser, faEnvelope, faArrowLeft, faCircleNotch } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import { verifyUserIdentity } from '@/services/Login/auth'; // Đảm bảo đường dẫn đúng

export default function RestorePage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [usercode, setUsercode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Gọi API xác thực
      const res = await verifyUserIdentity(usercode, email);
      
      console.log('✅ Xác thực thành công, UserID:', res.userid);
      
      // Chuyển hướng sang trang Reset Password kèm theo userid
      router.push(`/Login/newpass?uid=${res.userid}`);

    } catch (err: any) {
      setError(err.message || 'Thông tin xác thực không chính xác.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
      <Card className="w-full max-w-[400px] shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">Quên mật khẩu</CardTitle>
          <CardDescription className="text-center text-gray-500">
            Nhập thông tin để tìm lại tài khoản của bạn
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerify}>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1 text-gray-700">
                <FontAwesomeIcon icon={faEnvelope} className="mr-2 text-gray-500" />
                Tài khoản Gmail
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Nhập email đăng ký"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1 text-gray-700">
                <FontAwesomeIcon icon={faUser} className="mr-2 text-gray-500" />
                Tên đăng nhập
              </label>
              <Input
                type="text"
                value={usercode}
                onChange={(e) => setUsercode(e.target.value)}
                placeholder="Nhập usercode"
                required
              />
            </div>

            {error && <div className="mb-4 p-2 bg-red-50 text-red-600 text-sm rounded border border-red-200">{error}</div>}

            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? <><FontAwesomeIcon icon={faCircleNotch} className="animate-spin mr-2"/> Đang kiểm tra...</> : 'Tiếp tục'}
            </Button>

            <div className="mt-4 text-center">
              <Link 
                href="/" 
                className="text-sm text-gray-500 hover:text-black hover:underline flex items-center justify-center transition-colors"
              >
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2 text-xs" />
                Quay lại đăng nhập
              </Link>
            </div>

          </form>
        </CardContent>
      </Card>
    </div>
  );
}