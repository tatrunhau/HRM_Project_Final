'use client';

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCurrentUser } from '@/services/staff/staff'; // Hàm lấy user bạn đã có
import { format } from 'date-fns';

export default function StaffAttendancePage() {
    const [qrValue, setQrValue] = useState<string>('');
    const [employee, setEmployee] = useState<any>(null);
    const [timeLeft, setTimeLeft] = useState(120); // 120 giây = 2 phút

    // 1. Lấy thông tin nhân viên
    useEffect(() => {
        const fetchUser = async () => {
            const user = await getCurrentUser();
            if (user?.employee) {
                setEmployee(user.employee);
                generateQrToken(user.employee.employeeid);
            }
        };
        fetchUser();
    }, []);

    // 2. Hàm sinh mã Token (EmployeeID + Timestamp)
    const generateQrToken = (empId: number) => {
        const payload = {
            id: empId,
            ts: Date.now(), // Thời gian tạo mã
            type: 'attendance'
        };
        // Mã hóa Base64 đơn giản để admin quét
        const token = btoa(JSON.stringify(payload)); 
        setQrValue(token);
        setTimeLeft(120); // Reset đếm ngược
    };

    // 3. Tự động đổi mã sau mỗi 2 phút
    useEffect(() => {
        if (!employee) return;

        const interval = setInterval(() => {
            generateQrToken(employee.employeeid);
        }, 120 * 1000); // 2 phút

        const countdown = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 120));
        }, 1000);

        return () => {
            clearInterval(interval);
            clearInterval(countdown);
        };
    }, [employee]);

    if (!employee) return <div className="p-8 text-center">Đang tải thông tin...</div>;

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] bg-gray-50 p-4">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="text-center bg-blue-600 text-white rounded-t-lg">
                    <CardTitle>Mã QR Chấm Công</CardTitle>
                    <p className="text-sm opacity-90">{employee.name} - {employee.employeecode}</p>
                </CardHeader>
                <CardContent className="flex flex-col items-center p-8 bg-white">
                    <div className="border-4 border-slate-800 p-4 rounded-xl bg-white shadow-inner">
                        {qrValue && (
                            <QRCodeSVG 
                                value={qrValue} 
                                size={250} 
                                level={"H"} 
                                includeMargin={true}
                            />
                        )}
                    </div>
                    
                    <div className="mt-6 text-center space-y-2">
                        <p className="text-gray-500 font-medium">Mã sẽ tự động thay đổi sau:</p>
                        <div className="text-3xl font-bold text-blue-600 font-mono">
                            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                        </div>
                        <p className="text-xs text-gray-400 italic">
                            Vui lòng đưa mã này vào máy quét của Admin
                        </p>
                    </div>

                    <div className="mt-6 w-full pt-4 border-t text-center text-sm text-gray-500">
                        Ngày hôm nay: <span className="font-bold text-gray-800">{format(new Date(), 'dd/MM/yyyy')}</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}