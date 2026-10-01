# ImageUploadButton

상품 이미지 업로드 칸으로, 정사각 흰 박스(`gray2` 테두리, `radius-sm`) 가운데에 촬영 방향 신발 일러스트(100×48, `gray7`)와 head03 라벨을 둡니다(Figma ImageUploadButton `direction`).

- `direction`: `front`(앞면) · `side`(측면) · `outsole`(밑창) · `defect`(하자). 일러스트는 Figma 원본 SVG입니다.
- 경매 등록 1단계에서 2×2 그리드(간격 8px)로 씁니다.
- 칸을 누르면 사진 선택 창이 열리고, 고르면 칸이 미리보기로 채워집니다(정사각 cover). 숨긴 file input에 네이티브 속성(`name`, `onChange`, `disabled`…)이 그대로 갑니다.
- 이미 올라간 사진은 `image`(URL)로 넘깁니다.
- `invalid`: 테두리 `error1`. 메시지는 그리드 아래 한 줄로 모아 씁니다: "측면, 밑창 사진을 올려 주세요."
