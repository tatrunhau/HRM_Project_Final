import sys
import json
import pandas as pd
import xgboost as xgb
import os
import numpy as np
import io

# --- KHẮC PHỤC LỖI FONT VÀ SURROGATE ERROR ---
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
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
            print(json.dumps([], ensure_ascii=False))
            return

        if not employees:
            print(json.dumps([], ensure_ascii=False))
            return
            
        # 2. Chuyển đổi sang DataFrame
        df = pd.DataFrame(employees)
        
        # 3. Chọn đúng các cột Features (Đảm bảo thứ tự GIỐNG HỆT lúc train)
        feature_cols = ['Age', 'Gender', 'YearsAtCompany', 'MonthlyIncome', 'EducationLevel', 'MaritalStatus', 'NumDependents']
        
        # Kiểm tra và điền giá trị thiếu nếu cột không tồn tại
        for col in feature_cols:
            if col not in df.columns:
                df[col] = 0

        X_input = df[feature_cols].fillna(0).astype(float)

        # 4. Load Model bằng BOOSTER (Sửa đoạn này để tránh lỗi sklearn)
        model_path = os.path.join(os.path.dirname(__file__), 'xgb_model.json')
        
        if not os.path.exists(model_path):
            print(json.dumps({"error": "Chưa có file model. Hãy chạy train_model.py trước!"}, ensure_ascii=False))
            return

        # --- THAY ĐỔI QUAN TRỌNG TẠI ĐÂY ---
        # Thay vì dùng XGBClassifier, ta dùng Booster thuần
        model = xgb.Booster()
        model.load_model(model_path)

        # Chuyển dữ liệu sang DMatrix (Định dạng riêng của XGBoost)
        dtest = xgb.DMatrix(X_input)

        # 5. Dự đoán
        # Booster.predict trả về mảng xác suất class 1 luôn (không cần [:, 1])
        probabilities = model.predict(dtest)
        
        results = []
        
        # 6. Lọc kết quả > 70%
        # probabilities là mảng numpy, ta duyệt qua nó
        for i, prob in enumerate(probabilities):
            risk_score = float(round(prob * 100, 1))
            
            if risk_score > 70:
                emp_info = df.iloc[i]
                
                reasons = []
                if float(emp_info['MonthlyIncome']) < 10000000: reasons.append("Lương thấp")
                if float(emp_info['YearsAtCompany']) < 2: reasons.append("Thâm niên thấp")
                if float(emp_info['Age']) < 25: reasons.append("Độ tuổi trẻ (GenZ)")
                if float(emp_info['YearsAtCompany']) > 5 and float(emp_info['MonthlyIncome']) < 15000000: reasons.append("Thâm niên cao nhưng lương thấp")
                
                if not reasons: reasons.append("Dự báo tổng hợp từ mô hình AI")

                # Xử lý tên và phòng ban an toàn
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
        error_msg = str(e)
        # In lỗi dạng JSON để Node.js đọc được thay vì crash
        print(json.dumps([{"error": f"Lỗi Python: {error_msg}"}], ensure_ascii=False))

if __name__ == "__main__":
    predict()