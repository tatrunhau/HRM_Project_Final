# backend/python/train_model.py
import pandas as pd
import numpy as np
from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder

# 1. Tải dữ liệu (Nếu không có file csv, tạo dữ liệu giả lập để demo chạy được ngay)
try:
    df = pd.read_csv('employee_attrition.csv')
    print("Đang train trên dữ liệu thực tế từ CSV...")
except FileNotFoundError:
    print("Không thấy CSV, tạo dữ liệu giả lập để huấn luyện...")
    # Tạo 1000 dòng dữ liệu mẫu
    data = {
        'Age': np.random.randint(20, 60, 1000),
        'Gender': np.random.randint(0, 2, 1000), # 0: Female, 1: Male
        'YearsAtCompany': np.random.randint(0, 20, 1000),
        'MonthlyIncome': np.random.randint(5, 50, 1000) * 1000000, # 5tr - 50tr
        'EducationLevel': np.random.randint(1, 5, 1000),
        'MaritalStatus': np.random.randint(0, 2, 1000), # 0: Single, 1: Married
        'NumDependents': np.random.randint(0, 4, 1000),
        'Attrition': np.random.randint(0, 2, 1000)
    }
    df = pd.DataFrame(data)

# 2. Chọn Features (Phải khớp tên với dữ liệu Node.js gửi sang sau này)
FEATURES = ['Age', 'Gender', 'YearsAtCompany', 'MonthlyIncome', 'EducationLevel', 'MaritalStatus', 'NumDependents']
TARGET = 'Attrition'

# Đổi tên cột CSV của bạn cho chuẩn nếu cần (mapping)
# Giả sử CSV của bạn tên khác, ta chuẩn hóa về tên tiếng Anh chuẩn:
# df = df.rename(columns={'Years at Company': 'YearsAtCompany', ...})

# Kiểm tra xem đủ cột không, nếu thiếu cột nào thì tạo dummy
for col in FEATURES:
    if col not in df.columns:
        df[col] = 0 

X = df[FEATURES]
y = df[TARGET]

# Xử lý Label Encoding nếu dữ liệu là chữ (Male/Female)
# Để đơn giản và đồng bộ với Node.js, ta quy ước: 
# Gender: 1=Male, 0=Female
# Marital: 1=Married, 0=Single
# Nếu CSV là chữ, ta convert:
if X['Gender'].dtype == 'object':
    le_gender = LabelEncoder()
    X['Gender'] = le_gender.fit_transform(X['Gender'])

# 3. Huấn luyện Model
model = XGBClassifier(
    objective='binary:logistic',
    n_estimators=100,
    learning_rate=0.1,
    use_label_encoder=False,
    eval_metric='logloss'
)

model.fit(X, y)

# 4. LƯU MODEL QUAN TRỌNG
# Lưu xong file này, Node.js mới có cái để dùng
model.save_model('src/python/xgb_model.json')
print("--- HUẤN LUYỆN XONG ---")
print("Đã lưu model tại: src/python/xgb_model.json")