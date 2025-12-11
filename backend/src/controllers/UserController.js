export const authme = async (req, res) => {
    try {
        const user = req.user; // Lấy user từ middleware xác thực

        return res.status(200).json({ message: 'Lấy thông tin user thành công', user });
    } catch (error) {
        console.error('Lỗi khi gọi authme', error);
        return res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
}