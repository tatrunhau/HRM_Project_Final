import sys
import json
import pandas as pd
import xgboost as xgb
import os
import numpy as np
import io

# --- KHẮC PHỤC LỖI FONT VÀ SURROGATE ERROR ---
# 1. errors='replace': Nếu gặp ký tự lỗi không in được, thay bằng dấu  thay vì crash
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
# 2. Đọc stdin dạng binary rồi decode an toàn để tránh lỗi ngay từ đầu vào
sys.stdin = io.TextIOWrapper(sys.stdin.buffer, encoding='utf-8', errors='replace')

def predict():
    try:
        # 1. Đọc dữ liệu JSON từ Node.js
        input_data = sys.stdin.read()
        
        # Kiểm tra dữ liệu rỗng
        if not input_data or input_data.strip() == "":
            print(json.dumps([], ensure_ascii=False))
            return
        
        try:
            employees = json.loads(input_data)
        except json.JSONDecodeError:
            # Nếu JSON lỗi, trả về mảng rỗng thay vì crash
            print(json.dumps([], ensure_ascii=False))
            return

        if not employees:
            print(json.dumps([], ensure_ascii=False))
            return
            
        # 2. Chuyển đổi sang DataFrame
        df = pd.DataFrame(employees)
        
        # 3. Chọn đúng các cột Features
        feature_cols = ['Age', 'Gender', 'YearsAtCompany', 'MonthlyIncome', 'EducationLevel', 'MaritalStatus', 'NumDependents']
        
        # Đảm bảo dữ liệu đúng kiểu số
        X_input = df[feature_cols].fillna(0).astype(float)

        # 4. Load Model
        model = xgb.XGBClassifier()
        model_path = os.path.join(os.path.dirname(__file__), 'xgb_model.json')
        
        if not os.path.exists(model_path):
            print(json.dumps({"error": "Chưa có file model. Hãy chạy train_model.py trước!"}, ensure_ascii=False))
            return

        model.load_model(model_path)

        # 5. Dự đoán
        probabilities = model.predict_proba(X_input)[:, 1]
        
        results = []
        
        # 6. Lọc kết quả > 70%
        for i, prob in enumerate(probabilities):
            risk_score = float(round(prob * 100, 1))
            
            if risk_score > 70:
                emp_info = df.iloc[i]
                
                reasons = []
                if emp_info['MonthlyIncome'] < 10000000: reasons.append("Lương thấp")
                if emp_info['YearsAtCompany'] < 2: reasons.append("Thâm niên thấp")
                if emp_info['Age'] < 25: reasons.append("Độ tuổi trẻ (GenZ)")
                if emp_info['YearsAtCompany'] > 5 and emp_info['MonthlyIncome'] < 15000000: reasons.append("Thâm niên cao nhưng lương thấp")
                
                if not reasons: reasons.append("Dự báo tổng hợp từ mô hình AI")

                # Xử lý tên và phòng ban an toàn (tránh NoneType)
                emp_name = str(employees[i].get('Name') or 'Unknown')
                emp_dept = str(employees[i].get('Department') or 'Unknown')
                emp_id = str(employees[i].get('EmployeeID') or 'Unknown')

                results.append({
                    "id": emp_id,
                    "name": emp_name,
                    "dept": emp_dept,
                    "riskScore": "Cao" if risk_score > 85 else "Trung bình",
                    "probability": risk_score,
                    "reason": ", ".join(reasons)
                })
        
        # 7. Trả về JSON
        print(json.dumps(results, ensure_ascii=False))

    except Exception as e:
        # Bắt lỗi chung để không làm crash Node.js
        error_msg = str(e)
        print(json.dumps([{"error": f"Lỗi Python: {error_msg}"}], ensure_ascii=False))

if __name__ == "__main__":
    predict()