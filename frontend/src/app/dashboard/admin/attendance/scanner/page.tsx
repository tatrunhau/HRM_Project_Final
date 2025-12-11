'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCallback, useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faQrcode, faCheckCircle, faTimesCircle, faSpinner } from '@fortawesome/free-solid-svg-icons';

// ✅ IMPORT HÀM GỌI API TỪ SERVICE (Đã cấu hình đúng URL Backend)
import { checkInByQr } from '@/services/admin/attendance'; 

// Dynamic Import Scanner
const QrScannerLogic = dynamic(
    () => import('./QrScannerLogic'), 
    { 
        ssr: false, 
        loading: () => (
            <div className="w-full h-80 flex items-center justify-center bg-gray-900 rounded-lg text-white">
                <div className="flex flex-col items-center gap-2">
                    <FontAwesomeIcon icon={faSpinner} spin className="h-8 w-8" />
                    <p className="text-sm">Đang khởi động camera...</p>
                </div>
            </div>
        ) 
    }
);

export default function ScannerPage() {
    const [scanResult, setScanResult] = useState<string | null>(null);
    const [scanStatus, setScanStatus] = useState<'success' | 'error' | 'processing' | 'idle'>('idle');
    const [employeeName, setEmployeeName] = useState<string>('');
    
    // Audio refs
    const successAudio = useRef<HTMLAudioElement | null>(null);
    const errorAudio = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        successAudio.current = new Audio('https://actions.google.com/sounds/v1/cartoon/cartoon_boing.ogg');
        errorAudio.current = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
    }, []);

    const playSound = (type: 'success' | 'error') => {
        if (type === 'success' && successAudio.current) {
            successAudio.current.currentTime = 0;
            successAudio.current.play().catch(() => {});
        } else if (type === 'error' && errorAudio.current) {
            errorAudio.current.currentTime = 0;
            errorAudio.current.play().catch(() => {});
        }
    };

    // Hàm xử lý khi quét thành công
    const handleScanSuccess = useCallback(async (decodedText: string) => {
        if (scanStatus !== 'idle') return; 
        
        setScanStatus('processing');
        setScanResult(`Đang kiểm tra...`);
        
        try {
            // ✅ SỬA LẠI: Dùng hàm service thay vì fetch thủ công
            // Hàm này sẽ tự động gọi đúng URL: http://localhost:5001/api/attendance/checkin
            const data = await checkInByQr(decodedText);
            
            // Nếu chạy xuống đây nghĩa là thành công (Service thường ném lỗi nếu thất bại)
            setScanStatus('success');
            setEmployeeName(data.employeeName || 'Nhân viên');
            setScanResult(data.message);
            playSound('success');

} catch (error: any) {
            setScanStatus('error');
            
            // ✅ SỬA: Lấy message chi tiết từ error object
            const errorMsg = error.message || 'Lỗi kết nối hoặc mã không hợp lệ';
            
            setScanResult(errorMsg);
            playSound('error');
        }
        finally {
            setTimeout(() => {
                setScanStatus('idle');
                setScanResult(null);
                setEmployeeName('');
            }, 3500);
        }
    }, [scanStatus]);
    
    const handleCameraError = useCallback((error: any) => {
        // console.warn(error); 
    }, []);

    const renderStatus = () => {
        if (scanStatus === 'idle') {
            return (
                <div className="text-center text-slate-500 py-4">
                    <FontAwesomeIcon icon={faQrcode} className="h-10 w-10 mb-2 opacity-50" />
                    <p>Vui lòng đưa mã QR vào khung hình</p>
                </div>
            );
        }
        if (scanStatus === 'processing') {
            return (
                <div className="text-center text-blue-600 py-4">
                    <FontAwesomeIcon icon={faSpinner} spin className="h-10 w-10 mb-2" />
                    <p className="font-bold">Đang xử lý dữ liệu...</p>
                </div>
            );
        }
        if (scanStatus === 'success') {
            return (
                <div className="text-center text-green-600 py-4 bg-green-50 rounded-lg border border-green-200">
                    <FontAwesomeIcon icon={faCheckCircle} className="h-12 w-12 mb-2" />
                    <h3 className="text-xl font-bold uppercase">{employeeName}</h3>
                    <p className="font-medium px-4">{scanResult}</p>
                </div>
            );
        }
        if (scanStatus === 'error') {
            return (
                <div className="text-center text-red-600 py-4 bg-red-50 rounded-lg border border-red-200">
                    <FontAwesomeIcon icon={faTimesCircle} className="h-12 w-12 mb-2" />
                    <h3 className="text-lg font-bold">LỖI CHẤM CÔNG</h3>
                    <p className="font-medium px-4">{scanResult}</p>
                </div>
            );
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 p-4">
            <Card className="w-full max-w-lg shadow-2xl overflow-hidden border-0 bg-white">
                <CardHeader className="bg-blue-600 border-b px-6 py-4 text-white text-center">
                    <CardTitle className="text-2xl font-bold uppercase tracking-wider">
                        Máy Chấm Công
                    </CardTitle>
                    <p className="text-blue-100 text-sm opacity-80">Quét mã QR nhân viên</p>
                </CardHeader>
                
                <CardContent className="flex flex-col gap-0 p-0 relative">
                    {/* KHU VỰC CAMERA */}
                    <div className="w-full aspect-square bg-black relative">
                        <QrScannerLogic 
                            onScan={handleScanSuccess} 
                            onError={handleCameraError} 
                            scanResult={scanResult}
                        />
                        {/* Overlay khung quét */}
                        <div className="absolute inset-0 border-[40px] border-black/50 pointer-events-none flex items-center justify-center">
                            <div className="w-64 h-64 border-4 border-blue-400/80 rounded-lg relative">
                                <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-blue-500 -mt-1 -ml-1"></div>
                                <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-blue-500 -mt-1 -mr-1"></div>
                                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-blue-500 -mb-1 -ml-1"></div>
                                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-blue-500 -mb-1 -mr-1"></div>
                            </div>
                        </div>
                    </div>
                    
                    {/* KHU VỰC THÔNG BÁO */}
                    <div className="w-full p-6 bg-white min-h-[180px] flex flex-col justify-center">
                        {renderStatus()}
                    </div>
                </CardContent>
            </Card>
            <p className="mt-8 text-slate-500 text-sm">Hệ thống HRM v1.0 - Powered by Next.js</p>
        </div>
    );
}