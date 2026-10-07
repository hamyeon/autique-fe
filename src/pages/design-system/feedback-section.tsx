import { useState } from 'react'
import { Button } from '@/components/ds'
import {
  EmptyState,
  ErrorState,
  LoadingIllustration,
  ProductCardSkeleton,
  ProductGridSkeleton,
  Skeleton,
} from '@/components/feedback'
import type { AnalysisStage } from '@/features/register/analysis'
import { ANALYSIS_STAGE_COPY } from '@/features/register/analysis'
import { Caption, Demo, OptionGroup, Section } from './showcase'

/** src/components/feedback: 화면 상태(로딩 · 비어 있음 · 에러) 공용 컴포넌트 */
export function FeedbackSection() {
  return (
    <Section id="feedback" title="Feedback">
      <LoadingIllustrationDemo />
      <SkeletonDemo />
      <EmptyStateDemo />
      <ErrorStateDemo />
    </Section>
  )
}

const STAGES = ['1', '2', '3', '4'] as const

function LoadingIllustrationDemo() {
  const [stage, setStage] = useState<(typeof STAGES)[number]>('1')
  const copy = ANALYSIS_STAGE_COPY[Number(stage) as AnalysisStage]

  return (
    <Demo
      title="LoadingIllustration"
      description="AI 분석 · 가격 로딩 일러스트(Figma LoadingImg). 120×120 상자에서 primary1 막대만 위→아래로 훑습니다: 0.2초 대기 → 1.2초 ease-out → 0.2초 대기 → 즉시 위로, 1.6초 무한 반복. 휴대폰 '동작 줄이기'가 켜져 있으면 막대가 위에 멈춥니다."
    >
      <div className="border-gray2 py-layout-step flex justify-center rounded-md border">
        <LoadingIllustration />
      </div>
      <Caption>단독</Caption>

      <OptionGroup label="로딩 단계" options={STAGES} value={stage} onChange={setStage} />
      <div className="border-gray2 py-layout-step gap-space-24 flex flex-col items-center rounded-md border">
        <LoadingIllustration />
        <div
          key={stage}
          className="gap-stack-tight animate-in fade-in flex flex-col items-center text-center duration-300 motion-reduce:animate-none"
        >
          <p className="text-body01 text-black0">{copy.title}</p>
          <p className="text-body04 text-gray5">{copy.description}</p>
        </div>
      </div>
      <Caption>AI 상품 분석 로딩 (1)~(4) 화면 구성. 단계를 바꾸면 글자만 페이드로 바뀌고 일러스트 움직임은 이어집니다.</Caption>
    </Demo>
  )
}

function SkeletonDemo() {
  return (
    <Demo
      title="Skeleton"
      description="불러오는 동안 자리를 잡는 gray1 블록(pulse). ProductCardSkeleton은 ProductCard와 같은 모양, ProductGridSkeleton은 2열 그리드(열 12 · 행 20)."
    >
      <div className="gap-space-8 flex flex-col">
        <Skeleton className="h-4 w-1/2" />
        <Caption>Skeleton (크기는 className)</Caption>
      </div>
      <div className="gap-x-space-12 grid grid-cols-2">
        <div className="gap-space-8 flex flex-col">
          <ProductCardSkeleton />
          <Caption>ProductCardSkeleton</Caption>
        </div>
      </div>
      <ProductGridSkeleton />
      <Caption>ProductGridSkeleton count=4</Caption>
    </Demo>
  )
}

function EmptyStateDemo() {
  const [withAction, setWithAction] = useState<'없음' | '있음'>('없음')
  return (
    <Demo
      title="EmptyState"
      description="목록이 비었을 때. 아이콘(gray4) → 제목 head03 → 설명 body05 gray5 → 행동(선택), 가운데 정렬, 위아래 32."
    >
      <OptionGroup label="행동 버튼" options={['없음', '있음'] as const} value={withAction} onChange={setWithAction} />
      <div className="border-gray2 rounded-md border">
        <EmptyState
          title="아직 열린 경매가 없어요"
          description="새 경매가 등록되면 여기에서 보여드릴게요."
          action={
            withAction === '있음' ? (
              <Button variant="outline" block={false}>
                상품 등록하기
              </Button>
            ) : undefined
          }
        />
      </div>
    </Demo>
  )
}

function ErrorStateDemo() {
  const [retrying, setRetrying] = useState(false)
  const retry = () => {
    setRetrying(true)
    setTimeout(() => setRetrying(false), 1200)
  }
  return (
    <Demo
      title="ErrorState"
      description="불러오기 실패. 아이콘 Info(error1) → 제목 → 설명 → 다시 시도(outline). 다시 불러오는 동안 버튼이 잠깁니다. 목록 중간 실패는 description={null} · py-0으로 작게."
    >
      <div className="border-gray2 rounded-md border">
        <ErrorState title="경매 목록을 불러오지 못했어요" onRetry={retry} retrying={retrying} />
      </div>
      <Caption>다시 시도를 눌러 보세요 (1.2초 동안 잠김)</Caption>
      <div className="border-gray2 p-space-16 rounded-md border">
        <ErrorState title="더 불러오지 못했어요" description={null} onRetry={() => {}} className="py-0" />
      </div>
      <Caption>목록 끝에서 다음 페이지 실패</Caption>
    </Demo>
  )
}
