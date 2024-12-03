#화장실 공공데이터 cleaned_json으로 저정하는 코드


import json

# JSON 파일 경로
input_file = "toilets.json"
output_file = "toilets_cleaned.json"

# JSON 파일 읽기
with open(input_file, "r", encoding="utf-8") as file:
    data = json.load(file)

# 데이터 수정
for item in data:
    try:
        # 위도를 숫자로 변환
        item["latitude"] = float(item["latitude"])
    except (ValueError, TypeError):
        # 변환 실패 시 null로 설정
        item["latitude"] = None

    try:
        # 경도를 숫자로 변환
        item["longitude"] = float(item["longitude"])
    except (ValueError, TypeError):
        # 변환 실패 시 null로 설정
        item["longitude"] = None

# 수정된 데이터를 새로운 JSON 파일로 저장
with open(output_file, "w", encoding="utf-8") as file:
    json.dump(data, file, ensure_ascii=False, indent=4)

print(f"수정된 JSON 파일이 저장되었습니다: {output_file}")
