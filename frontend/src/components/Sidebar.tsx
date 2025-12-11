'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHome,
  faBriefcase,
  faUser,
  faGift,
  faPercent,
  faScaleBalanced,
  faLock,
  faCog,
  faCalendarDays,
  faTableList,
  faMoneyBill,
  faChartSimple,
  faPersonWalkingArrowRight,
  faChevronDown,
  faChevronRight,
} from '@fortawesome/free-solid-svg-icons';

interface MenuItem {
  name: string;
  icon: any;
  path?: string;
  subMenu?: { name: string; path: string }[];
}

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

const menu: MenuItem[] = [
  { name: 'Tổng Quan', icon: faHome, path: '/dashboard/admin/main' },
  {
    name: 'Tuyển Dụng',
    icon: faBriefcase,
    subMenu: [
      { name: 'Kế Hoạch Tuyển Dụng', path: '/dashboard/admin/recruitment/recruitment-plan' },
      { name: 'Hồ Sơ Ứng Viên', path: '/dashboard/admin/recruitment/candidate' },
    ],
  },
  
  { 
    name: 'Quản Lý Nhân Sự', 
    icon: faUser,
    subMenu: [
      { name: 'Nhân Viên', path: '/dashboard/admin/employee/profile' },
      { name: 'Kiêm nhiệm', path: '/dashboard/admin/employee/concurrently' },
    ],
  },

  { 
    name: 'Chế Độ & Chính Sách', 
    icon: faScaleBalanced, 
    subMenu: [
      { name: 'Văn Bản Nhà Nước', path: '/dashboard/admin/regime/document' },
      { name: 'Bảo Hiểm Xã Hội', path: '/dashboard/admin/regime/insurance-config' },
    ], 
  },
  { name: 'Quản Lý Ngày Công', icon: faCalendarDays, path: '/dashboard/admin/attendance' },
  { name: 'Bảng Lương', icon: faMoneyBill, path: '/dashboard/admin/payroll' },
  { name: 'Nghỉ việc', icon: faPersonWalkingArrowRight, path: '/dashboard/admin/resignation' },
  { 
    name: 'Tài Khoản', icon: faLock, path: '/dashboard/admin/permission/account'
  },
  { 
    name: 'Danh Mục', 
    icon: faTableList, 
     subMenu: [
      { name: 'Phụ cấp', path: '/dashboard/admin/catelogy/allowance' },
      { name: 'Phòng ban', path: '/dashboard/admin/catelogy/department' },
      { name: 'Chức vụ', path: '/dashboard/admin/catelogy/position' },
      { name: 'Chức danh', path: '/dashboard/admin/catelogy/jobtitle' },
      { name: 'Loại hợp đồng', path: '/dashboard/admin/catelogy/contract' },
      { name: 'Chứng chỉ', path: '/dashboard/admin/catelogy/certificate' },
      { name: 'Ngày nghỉ', path: '/dashboard/admin/catelogy/holiday' },
    ], 
  },
  { name: 'Báo Cáo', icon: faChartSimple, path: '/dashboard/admin/report' },
  { name: 'Cài Đặt', icon: faCog, path: '/dashboard/admin/settings' },
];

  useEffect(() => {
    const parent = menu.find((item) =>
      item.subMenu?.some((sub) => sub.path === pathname)
    );
    if (parent) {
      setOpenSubmenu(parent.name);
    }
  }, [pathname]);

  const handleMenuClick = (path?: string) => {
    if (path) {
      router.push(path);
    }
  };

  const toggleSubmenu = (name: string) => {
    setOpenSubmenu((prev) => (prev === name ? null : name));
  };

  const isActive = (path?: string, subMenu?: any[]) => {
    if (path) return pathname === path;
    if (subMenu) return subMenu.some((sub) => sub.path === pathname);
    return false;
  };

  return (
    <div className="h-screen w-64 bg-[#0F172A] text-white fixed left-0 top-0 flex flex-col">
      <div className="p-6 text-lg font-bold border-b border-gray-700 flex items-center gap-2">
        HR System
      </div>

      <nav className="flex-1 overflow-y-auto py-2">
        {menu.map((item) => {
          const hasSubmenu = !!item.subMenu;
          const active = isActive(item.path, item.subMenu);
          const submenuOpen = openSubmenu === item.name;

          return (
            <div key={item.name}>
              {/* Menu chính */}
              <div
                onClick={() => {
                  if (hasSubmenu) {
                    toggleSubmenu(item.name);
                  } else if (item.path) {
                    handleMenuClick(item.path);
                  }
                }}
                className={`
                  flex items-center gap-3 px-5 py-3 cursor-pointer transition-all
                  ${active ? 'bg-gray-700 border-l-4 border-blue-500' : 'hover:bg-gray-800'}
                  ${hasSubmenu ? 'justify-between' : 'justify-start'}
                `.trim()}
              >
                <div className="flex items-center gap-3">
                  <FontAwesomeIcon icon={item.icon} className="w-5" />
                  <span className="text-sm">{item.name}</span>
                </div>
                {hasSubmenu && (
                  <FontAwesomeIcon
                    icon={submenuOpen ? faChevronDown : faChevronRight}
                    className="w-3 text-gray-400"
                  />
                )}
              </div>

              {/* Submenu */}
              {hasSubmenu && submenuOpen && (
                <div className="ml-8 border-l border-gray-700">
                  {item.subMenu!.map((sub) => {
                    const subActive = pathname === sub.path;
                    return (
                      <div
                        key={sub.name}
                        onClick={() => handleMenuClick(sub.path)}
                        className={`
                          flex items-center gap-3 px-5 py-2 cursor-pointer text-sm transition-all
                          ${subActive ? 'text-blue-400 bg-gray-800' : 'hover:text-blue-300 hover:bg-gray-800'}
                        `}
                      >
                        <span>• {sub.name}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}