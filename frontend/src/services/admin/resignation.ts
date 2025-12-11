import api from "@/lib/axios";

export interface Resignation {
  resignationid: number;
  employeeid: number;
  resignationdate: string;
  reason: string;
  status: string;
  employee?: {
    name: string;
    employeecode: string;
    department?: { name: string };
    jobtitle?: { name: string };
  };
}

export const getResignations = async () => {
  const res = await api.get<Resignation[]>("/resignations");
  return res.data;
};

export const createResignation = async (data: any) => {
  const res = await api.post("/resignations", data);
  return res.data;
};

export const updateResignation = async (id: number, data: any) => {
  const res = await api.put(`/resignations/${id}`, data);
  return res.data;
};

export const deleteResignation = async (id: number) => {
  const res = await api.delete(`/resignations/${id}`);
  return res.data;
};

export const exportResignations = async () => {
  const response = await api.get("/resignations/export", { responseType: "blob" });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `DS_NghiViec_${Date.now()}.xlsx`);
  document.body.appendChild(link);
  link.click();
  link.remove();
};