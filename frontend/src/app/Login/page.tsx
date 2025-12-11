'use client';
import { useState } from 'react';
import { login } from "@/services/Login/auth"; 
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { faUser, faLock } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; 

export default function LoginForm() {
  const router = useRouter();
  const [usercode, setUsercode] = useState('');
  const [pass, setPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await login(usercode, pass);
      console.log('✅ Đăng nhập thành công:', res);

      // 👇 [QUAN TRỌNG] Lưu Token vào LocalStorage
      // Phải lưu thì axios bên kia mới đọc được để gửi đi các request sau
      if (res.accessToken) {
        localStorage.setItem("accessToken", res.accessToken);
      } else {
        throw new Error("Không nhận được Access Token từ hệ thống!");
      }

      // Xử lý chuyển hướng
      const role = Number(res.role) || Number(res.user?.role);

      if (role === 2) router.push('/dashboard/admin/main');
      else if (role === 1) router.push('/dashboard/staff/main');
      else router.push('/');

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Đăng nhập thất bại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <Card className="w-[400px] shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">Đăng nhập</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                <FontAwesomeIcon icon={faUser} className="mr-2" />
                Mã người dùng
              </label>
              <Input
                value={usercode}
                onChange={(e) => setUsercode(e.target.value)}
                placeholder="Nhập usercode"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                <FontAwesomeIcon icon={faLock} className="mr-2" />
                Mật khẩu
              </label>
              <Input
                type="password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                placeholder="Nhập mật khẩu"
                required
              />
              <div className="flex justify-end mt-1">
                <Link 
                  href="/Login/verify" 
                  className="text-sm text-blue-600 hover:underline"
                >
                  Quên mật khẩu?
                </Link>
              </div>
            </div>
            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}