'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser,
  faClipboardList,
  faClock,
  faSignOutAlt,
  faChevronLeft,
  faChevronRight,
  faBars,
} from '@fortawesome/free-solid-svg-icons';

// ✅ 1. Import hàm logout từ service (Bỏ import axios)
import { logout } from '@/services/staff/staff';

interface MenuItem {
  name: string;
  icon: any;
  path: string;
}

const mainMenuItems: MenuItem[] = [
  { name: 'Quản Lý Thông Tin Cá Nhân', icon: faUser, path: '/dashboard/staff/main' },
  { name: 'Quản Lý Yêu Cầu', icon: faClipboardList, path: '/dashboard/staff/request' },
  { name: 'Chấm Công', icon: faClock, path: '/dashboard/staff/attendance' },
  { name: 'Đăng Xuất', icon: faSignOutAlt, path: '/logout' }, 
];

export default function EmployeeSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleMenuClick = async (path: string) => {
    // ✅ 2. Xử lý logic Đăng Xuất gọn gàng hơn
    if (path === '/logout') {
        // Gọi hàm từ service (nó đã lo việc gọi API và xóa localStorage)
        await logout();
        
        // Chỉ việc lo phần UI: đóng menu và chuyển hướng
        if (isMobile) setIsMobileOpen(false);
        router.push('/Login');
        return;
    }

    router.push(path);
    if (isMobile) {
      setIsMobileOpen(false);
    }
  };

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };
  
  const toggleMobileSidebar = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  const sidebarWidthClass = isSidebarCollapsed ? 'w-20' : 'w-64';
  const sidebarDisplayClass = isMobile 
    ? isMobileOpen ? 'translate-x-0' : '-translate-x-full'
    : 'translate-x-0';

  return (
    <>
        {/* Nút mở Sidebar Mobile */}
        {isMobile && !isMobileOpen && (
            <button 
                onClick={toggleMobileSidebar}
                className="fixed top-4 left-4 p-2 z-50 bg-blue-600 text-white rounded-md shadow-lg"
            >
                <FontAwesomeIcon icon={faBars} className="w-5 h-5" />
            </button>
        )}

        {/* Overlay */}
        {isMobile && isMobileOpen && (
            <div 
                className="fixed inset-0 bg-black opacity-50 z-40 md:hidden" 
                onClick={toggleMobileSidebar}
            />
        )}

        {/* Sidebar */}
        <div 
            className={`
                h-screen bg-[#0F172A] text-white fixed left-0 top-0 flex flex-col transition-all duration-300 z-50
                ${sidebarWidthClass}
                ${sidebarDisplayClass}
            `}
        >
            <div 
                className={`p-6 text-lg font-bold border-b border-gray-700 flex items-center gap-2 overflow-hidden ${isSidebarCollapsed ? 'justify-center' : 'justify-start'}`}
            >
                {!isSidebarCollapsed && 'Employee Dashboard'}
                {isSidebarCollapsed && <FontAwesomeIcon icon={faUser} className="w-5" />}
            </div>

            <nav className="flex-1 overflow-y-auto py-2">
                {mainMenuItems.map((item) => {
                    const active = pathname.startsWith(item.path) && item.path !== '/logout'; 
                    const isLogout = item.path === '/logout';

                    return (
                        <div
                            key={item.name}
                            onClick={() => handleMenuClick(item.path)}
                            className={`
                                flex items-center gap-3 px-5 py-3 cursor-pointer transition-all
                                ${isSidebarCollapsed ? 'justify-center' : 'justify-start'}
                                ${isLogout 
                                    ? 'text-red-400 hover:bg-red-900/20 hover:text-red-300 mt-4 border-t border-gray-700 pt-4' 
                                    : active 
                                        ? 'bg-gray-700 border-l-4 border-blue-500' 
                                        : 'hover:bg-gray-800'
                                }
                            `}
                            title={isSidebarCollapsed ? item.name : ''}
                        >
                            <FontAwesomeIcon icon={item.icon} className="w-5" />
                            {!isSidebarCollapsed && <span className="text-sm font-medium">{item.name}</span>}
                        </div>
                    );
                })}
            </nav>

            {!isMobile && (
                <div className="py-2 border-t border-gray-700">
                    <div
                        onClick={toggleSidebarCollapse}
                        className={`
                            flex items-center gap-3 px-5 py-2 cursor-pointer transition-all hover:bg-gray-800
                            ${isSidebarCollapsed ? 'justify-center' : 'justify-end'}
                        `}
                    >
                        <FontAwesomeIcon 
                            icon={isSidebarCollapsed ? faChevronRight : faChevronLeft} 
                            className="w-4 text-gray-400" 
                        />
                        {!isSidebarCollapsed && <span className="text-sm">Thu Gọn</span>}
                    </div>
                </div>
            )}
        </div>
    </>
  );
}