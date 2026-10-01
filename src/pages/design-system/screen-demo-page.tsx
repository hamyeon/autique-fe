import { useState } from 'react'
import {
  BottomButtonBar,
  Divider,
  Header,
  ImagePlaceholder,
  InfoBanner,
  TabBar,
} from '@/components/ds'
import type { ScreenProps } from '@/layouts/screen'
import { Screen } from '@/layouts/screen'
import { BAR_LABELS, BAR_LAYOUTS } from './bar-demo-data'
import type { BarLayout } from './bar-demo-data'
import { Caption, OptionGroup } from './showcase'

const BOTTOMS = [...BAR_LAYOUTS, 'TabBar', '없음'] as const
type Bottom = BarLayout | 'TabBar' | '없음'

/** 개발 모드 전용: Screen 골격(sticky 헤더·하단 바, safe-area, 여백) 확인 (/design-system/screen-demo) */
export function ScreenDemoPage() {
  const [length, setLength] = useState<'짧은 본문' | '긴 본문'>('긴 본문')
  const [top, setTop] = useState<NonNullable<ScreenProps['top']>>('top')
  const [bottom, setBottom] = useState<Bottom>('single')
  const [primaryDisabled, setPrimaryDisabled] = useState<'false' | 'true'>('false')
  const [lastAction, setLastAction] = useState<string | null>(null)

  return (
    <Screen
      header={<Header title="Screen 데모" />}
      top={top}
      bottom={
        bottom === 'TabBar' ? (
          <TabBar />
        ) : (
          bottom !== '없음' && (
          <BottomButtonBar
            layout={bottom}
            {...BAR_LABELS}
            primaryDisabled={primaryDisabled === 'true'}
            onPrimary={() => setLastAction(BAR_LABELS.primaryLabel)}
            onSecondary={() => setLastAction(BAR_LABELS.secondaryLabel)}
            onDanger={() => setLastAction(BAR_LABELS.dangerLabel)}
          />
          )
        )
      }
    >
      <div className="gap-layout-section flex flex-col">
        <div className="gap-form-field flex flex-col">
          <OptionGroup
            label="본문 길이"
            options={['짧은 본문', '긴 본문'] as const}
            value={length}
            onChange={setLength}
          />
          <OptionGroup
            label="top (헤더 아래 여백)"
            options={['top', 'step', 'none'] as const}
            value={top}
            onChange={setTop}
          />
          <OptionGroup label="bottom" options={BOTTOMS} value={bottom} onChange={setBottom} />
          {bottom !== '없음' && bottom !== 'TabBar' && (
            <OptionGroup
              label="primaryDisabled"
              options={['false', 'true'] as const}
              value={primaryDisabled}
              onChange={setPrimaryDisabled}
            />
          )}
          <Caption>
            마지막으로 누른 하단 버튼: {lastAction ?? '없음'} · 뒤로 가기는 navigate(-1)이에요. TabBar
            탭은 실제 링크라 누르면 이동해요(상품 찾기·마이페이지 화면은 아직 없어 404).
          </Caption>
        </div>

        <Divider />

        {length === '긴 본문' ? (
          <>
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="gap-space-12 flex items-center">
                <ImagePlaceholder width={72} ratio={1} />
                <div className="gap-stack-tight flex flex-col">
                  <span className="text-body03 text-black0">콘텐츠 {i + 1}</span>
                  <Caption>스크롤해도 헤더와 하단 바가 제자리에 붙어 있어야 해요.</Caption>
                </div>
              </div>
            ))}
            <InfoBanner>
              마지막 콘텐츠예요. 맨 아래까지 스크롤했을 때 하단 바와 24px(+ 바 위쪽 패딩 12) 떨어져
              보여야 해요.
            </InfoBanner>
          </>
        ) : (
          <InfoBanner>
            짧은 본문이에요. 남는 공간은 본문 아래로 가고 하단 바는 화면 맨 아래에 붙어야 해요.
          </InfoBanner>
        )}
      </div>
    </Screen>
  )
}
