'use client';
import React, { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser,
  faBriefcase,
  faDollarSign,
  faChartLine,
} from '@fortawesome/free-solid-svg-icons';

// Import Service và Interface
import { getDashboardStats, DashboardSummary } from '@/services/admin/dashboard';

// --- HELPER: Format tiền tệ rút gọn (SỬA ĐỔI: Hỗ trợ số âm) ---
const formatCurrency = (amount: number) => {
  if (!amount) return '0';
  
  const absAmount = Math.abs(amount); // Lấy giá trị tuyệt đối để so sánh
  const sign = amount < 0 ? '-' : ''; // Lưu dấu

  if (absAmount >= 1000000000) {
    return sign + (absAmount / 1000000000).toFixed(1) + 'B';
  }
  if (absAmount >= 1000000) {
    return sign + (absAmount / 1000000).toFixed(0) + 'M';
  }
  return amount.toLocaleString('vi-VN');
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error("Lỗi tải dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const GrowthIndicator = ({ growth }: { growth: number | undefined }) => {
    const value = growth || 0;
    const isPositive = value >= 0;
    
    return (
      <p className={`${isPositive ? 'text-green-600' : 'text-red-600'} text-xs mt-1 font-semibold flex items-center`}>
        <span className={`${isPositive ? 'bg-green-100' : 'bg-red-100'} px-1 rounded mr-1`}>
          {isPositive ? '↑' : '↓'} {Math.abs(value)}%
        </span>
        tháng trước
      </p>
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-100 items-center justify-center">
        <div className="text-gray-500 font-medium animate-pulse">Đang tải dữ liệu tổng quan...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <div className="flex-1 flex flex-col ml-64 transition-all duration-300">
        
        <div className="flex justify-between items-center bg-white shadow px-6 py-4 sticky top-0 z-10">
          <h1 className="text-2xl font-bold text-gray-800">Tổng Quan</h1>
          <div className="text-gray-600 text-sm hidden sm:block">
            Chào mừng đến với hệ thống quản lý nhân sự
          </div>
        </div>

        <main className="p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* 1. CARD: TỔNG NHÂN VIÊN */}
          <Card className="shadow-lg p-4 hover:shadow-xl transition-shadow bg-white">
            <CardContent className="flex justify-between items-center p-0">
              <div className="flex-1 min-w-0"> {/* Thêm min-w-0 để tránh tràn text */}
                <p className="text-gray-500 text-sm mb-2 font-medium">Tổng Nhân Viên</p>
                <h2 className="text-3xl font-bold text-gray-800 truncate" title={String(stats?.employees?.value || 0)}>
                  {stats?.employees?.value || 0}
                </h2>
                <GrowthIndicator growth={stats?.employees?.growth} />
              </div>
              <div className="bg-blue-100 p-3 rounded-full w-12 h-12 flex items-center justify-center flex-shrink-0 ml-4">
                <FontAwesomeIcon icon={faUser} className="text-blue-600 text-xl" />
              </div>
            </CardContent>
          </Card>

          {/* 2. CARD: ĐƠN TUYỂN DỤNG */}
          <Card className="shadow-lg p-4 hover:shadow-xl transition-shadow bg-white">
            <CardContent className="flex justify-between items-center p-0">
              <div className="flex-1 min-w-0">
                <p className="text-gray-500 text-sm mb-2 font-medium">Đơn Tuyển Dụng</p>
                <h2 className="text-3xl font-bold text-gray-800 truncate">
                  {stats?.candidates?.value || 0}
                </h2>
                <p className="text-orange-600 text-xs mt-1 font-semibold truncate">
                  <span className="bg-orange-100 px-1 rounded mr-1">●</span>
                  {stats?.candidates?.processing || 0} đang xử lý
                </p>
              </div>
              <div className="bg-indigo-100 p-3 rounded-full w-12 h-12 flex items-center justify-center flex-shrink-0 ml-4">
                <FontAwesomeIcon icon={faBriefcase} className="text-indigo-600 text-xl" />
              </div>
            </CardContent>
          </Card>

          {/* 3. CARD: TỔNG LƯƠNG THÁNG */}
          <Card className="shadow-lg p-4 hover:shadow-xl transition-shadow bg-white">
            <CardContent className="flex justify-between items-center p-0">
              <div className="flex-1 min-w-0">
                <p className="text-gray-500 text-sm mb-2 font-medium">Tổng Lương Tháng</p>
                {/* Thêm class truncate để cắt bớt nếu vẫn quá dài */}
                <h2 className="text-3xl font-bold text-gray-800 truncate" title={formatCurrency(stats?.salary?.value || 0)}>
                  {formatCurrency(stats?.salary?.value || 0)}
                </h2>
                <GrowthIndicator growth={stats?.salary?.growth} />
              </div>
              {/* Thêm flex-shrink-0 để icon không bị bóp méo, ml-4 để tạo khoảng cách */}
              <div className="bg-green-100 p-3 rounded-full w-12 h-12 flex items-center justify-center flex-shrink-0 ml-4">
                <FontAwesomeIcon icon={faDollarSign} className="text-green-600 text-xl" />
              </div>
            </CardContent>
          </Card>

          {/* 4. CARD: TỶ LỆ GIỮ CHÂN */}
          <Card className="shadow-lg p-4 hover:shadow-xl transition-shadow bg-white">
            <CardContent className="flex justify-between items-center p-0">
              <div className="flex-1 min-w-0">
                <p className="text-gray-500 text-sm mb-2 font-medium">Tỷ Lệ Giữ Chân</p>
                <h2 className="text-3xl font-bold text-gray-800 truncate">
                  {stats?.retention?.value || 0}%
                </h2>
                <GrowthIndicator growth={stats?.retention?.growth} />
              </div>
              <div className="bg-purple-100 p-3 rounded-full w-12 h-12 flex items-center justify-center flex-shrink-0 ml-4">
                <FontAwesomeIcon icon={faChartLine} className="text-purple-600 text-xl" />
              </div>
            </CardContent>
          </Card>

        </main>
      </div>
    </div>
  );
}