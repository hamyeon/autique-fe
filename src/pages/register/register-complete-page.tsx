import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { BottomButtonBar, ImagePlaceholder } from '@/components/ds'
import { Screen } from '@/layouts/screen'
import { useRegisterStore } from '@/stores/register-store'

/**
 * 등록 완료(Figma 551:2322). 헤더 없이 가운데 정렬(사용자 결정: Figma의 헤더는 뺌).
 * 일러스트 자리(125×118 ImagePlaceholder) → 24 → 제목 · 설명. 들어오면 작성 내용을 비우고, '완료'는 홈으로(사용자 결정).
 * 이 화면은 등록을 시작한 기록 자리에 들어오므로(use-register-nav goComplete) 뒤로 가기를 눌러도 등록 단계로 돌아가지 않습니다.
 */
export function RegisterCompletePage() {
  const navigate = useNavigate()
  const reset = useRegisterStore((s) => s.reset)

  useEffect(() => {
    void reset()
  }, [reset])

  return (
    <Screen
      className="gap-layout-section items-center justify-center text-center"
      bottom={
        <BottomButtonBar
          layout="single"
          primaryLabel="완료"
          onPrimary={() => navigate('/', { replace: true })}
        />
      }
    >
      {/* 결과 화면 일러스트 자리(Figma도 아직 빈 자리) */}
      <ImagePlaceholder width={125} height={118} />
      <div className="gap-space-8 flex flex-col items-center">
        <p className="text-head01 text-black0">경매가 성공적으로 등록되었어요!</p>
        <p className="text-body06 text-gray6">
          <span className="block">내 경매 페이지에서</span>
          <span className="block">등록된 상품을 관리할 수 있어요</span>
        </p>
      </div>
    </Screen>
  )
}
