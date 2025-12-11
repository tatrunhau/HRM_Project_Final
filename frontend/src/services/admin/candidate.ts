import api from "@/lib/axios";

// Interface map với API Backend
export interface CandidatePayload {
  candidatecode?: string;
  name: string;
  email?: string; // Vẫn giữ trong payload để backend xử lý (dù frontend không hiện input)
  phonenumber?: string; 
  jobtitleid: string | number;
  departmentid: string | number;
  submissiondate?: string;
  status?: string | number;
  skill?: string;
  note?: string;
  cv_file?: string | null;
}

export const getCandidates = async () => {
  try {
    const response = await api.get("/candidates");
    return response.data;
  } catch (error: any) {
    console.error("Lỗi lấy danh sách ứng viên:", error);
    return [];
  }
};

export const createCandidate = async (data: CandidatePayload) => {
  try {
    const response = await api.post("/candidates", data);
    return response.data;
  } catch (error: any) {
    console.error("Lỗi tạo ứng viên:", error);
    throw error;
  }
};

export const updateCandidate = async (id: number | string, data: CandidatePayload) => {
  try {
    const response = await api.put(`/candidates/${id}`, data);
    return response.data;
  } catch (error: any) {
    console.error("Lỗi cập nhật ứng viên:", error);
    throw error;
  }
};

export const deleteCandidate = async (id: number | string) => {
  try {
    const response = await api.delete(`/candidates/${id}`);
    return response.data;
  } catch (error: any) {
    console.error("Lỗi xóa ứng viên:", error);
    throw error;
  }
};