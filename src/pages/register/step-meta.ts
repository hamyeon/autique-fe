/** 경매 등록 단계 화면 문구(Figma 등록 1/6 ~ 6/6). 버튼은 각 단계의 주 버튼 문구 */
export const STEP_META = {
  '1': {
    title: '상품 이미지 업로드',
    description: '밝은 곳에서 촬영한 이미지를 업로드해주세요.',
    next: '다음',
  },
  '2': {
    title: 'AI 상품 분석',
    description:
      '업로드한 이미지를 바탕으로 AI가 상품을 분석했어요.\n잘못된 정보가 있다면 알맞게 수정해주세요.',
    next: '다음',
  },
  '3': {
    title: '추가 정보 입력',
    description:
      '추가적인 정보가 있다면 입력해주세요.\n일부 구성품이 없는 경우 설명을 함께 적어주시면 좋아요.',
    next: 'AI 기준가 분석하기',
  },
  '4': {
    title: '경매 시작가 설정',
    description:
      '기준가는 유사 거래 데이터를 바탕으로\n상품 상태를 보정하여 산출된 상품의 적정 가격이에요.',
    // Figma 갱신 전 문구 기준(사용자 확인): 검정 '기준가로 설정하기' + 흰 '가격 수정하기'
    next: '기준가로 설정하기',
    secondary: '가격 수정하기',
  },
  '5': {
    title: '경매 일정 설정',
    description:
      '경매가 열리고 닫힐 세부 일정을 설정해주세요.\n경매 시간은 1시간부터 설정할 수 있어요.',
    next: '다음',
  },
  '6': {
    title: '경매 정보 확인',
    description: '입력한 정보가 맞는지 마지막으로 확인해주세요.',
    next: '상품 등록하기',
  },
} as const

export type NumberedStep = keyof typeof STEP_META
