// src/app/dashboard/admin/attendance/scanner/QrScannerLogic.tsx
'use client';
import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';

interface QrScannerLogicProps {
    onScan: (result: string) => void;
    onError: (error: any) => void;
    scanResult: string | null;
}

export default function QrScannerLogic({ onScan, onError }: QrScannerLogicProps) {
    const qrcodeRegionId = "html5qr-code-full-region";
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        return () => {
            setIsMounted(false);
        };
    }, []);

    useEffect(() => {
        if (!isMounted) return;

        // Cấu hình Scanner
        const scanner = new Html5QrcodeScanner(
            qrcodeRegionId,
            { 
                fps: 10, 
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0,
                showTorchButtonIfSupported: true,
                // QUAN TRỌNG: Tắt nhớ camera cũ để tránh lỗi OverconstrainedError khi đổi thiết bị
                rememberLastUsedCamera: false, 
                // Chỉ quét QR Code để tối ưu hiệu năng
                formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
                // Tắt chế độ thử nghiệm video constraints phức tạp
                videoConstraints: {
                    // Để trống để trình duyệt tự chọn camera mặc định (Webcam hoặc Cam sau)
                }
            },
            /* verbose= */ false
        );
        
        scannerRef.current = scanner;

        // Khởi động Scanner
        try {
            scanner.render(
                (decodedText) => {
                    // Thành công
                    onScan(decodedText);
                    console.log("Scan success:", decodedText);
                },
                (error) => {
                    // Lỗi quét (vẫn đang quét nhưng chưa thấy mã) - Không cần làm gì
                }
            );
        } catch (e) {
            console.error("Scanner start error:", e);
            onError(e);
        }

        // Cleanup function
        return () => {
            if (scannerRef.current) {
                try {
                    scannerRef.current.clear().catch(err => {
                        console.warn("Failed to clear scanner", err);
                    });
                } catch (e) {
                    // Ignore cleanup errors
                }
            }
        };
    }, [isMounted, onScan, onError]);

    return (
        <div className="w-full h-full bg-black relative overflow-hidden flex flex-col items-center justify-center">
            {/* Div chứa Video Camera */}
            <div id={qrcodeRegionId} className="w-full h-full bg-black" />
            
            {/* CSS tùy chỉnh để ẩn các thành phần thừa của thư viện */}
            <style jsx global>{`
                #html5qr-code-full-region { 
                    border: none !important; 
                }
                #html5qr-code-full-region img { 
                    display: none; 
                }
                #html5qr-code-full-region__scan_region { 
                    background: unset !important; 
                }
                #html5qr-code-full-region__header_message {
                    display: none;
                }
                /* Tùy chỉnh nút bấm Request Camera Permission */
                #html5qr-code-full-region__dashboard_section_csr button { 
                    background: white; 
                    padding: 8px 16px; 
                    border-radius: 6px; 
                    font-weight: bold;
                    margin-top: 20px;
                    cursor: pointer;
                }
                /* Ẩn select camera nếu chỉ có 1 cam để giao diện đẹp hơn */
                #html5qr-code-full-region__dashboard_section_swaplink {
                    display: none !important;
                }
                video {
                    object-fit: cover;
                    border-radius: 8px;
                }
            `}</style>
        </div>
    );
}