import type { ReactNode } from 'react'
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer'
import { cn } from '@/lib/utils'

export interface BottomSheetProps {
  open?: boolean
  /** 딤을 누르거나, 아래로 끌어내리거나, Esc를 누르면 호출됩니다. */
  onClose?: () => void
  title?: ReactNode
  /** 미리보기용: 포털·딤 없이 그 자리에 시트만 그립니다. */
  inline?: boolean
  /** 내용: 기본은 InfoBanner → 정보 행 → AmountStepper → 캡션 (간격 12) */
  children?: ReactNode
  /** 보통 BottomButtonBar */
  footer?: ReactNode
  className?: string
}

/* 흰 시트, 위쪽만 radius-lg(20), 위 8 패딩 + 60×4 gray2 핸들 */
const SHEET = 'bg-white0 pt-space-8 pb-safe flex flex-col rounded-t-lg'

function SheetBody({
  title,
  children,
  footer,
  titleSlot,
}: Pick<BottomSheetProps, 'children' | 'footer' | 'title'> & { titleSlot: ReactNode }) {
  return (
    <>
      <div aria-hidden className="bg-gray2 mx-auto h-1 w-15 shrink-0 rounded-full" />
      {/* 내용이 길면 이 영역만 스크롤되고 버튼 바는 아래에 남습니다. */}
      <div className="gap-space-12 py-space-24 px-layout-gutter flex min-h-0 flex-col overflow-y-auto">
        {title && titleSlot}
        {children}
      </div>
      {footer && <div className="shrink-0">{footer}</div>}
    </>
  )
}

/**
 * 화면 위로 올라오는 시트. 동작(포털·포커스 가두기·Esc·끌어내려 닫기·스크롤 잠금)은 vaul,
 * 겉모양(black0 90% 딤, 위쪽 radius-lg, 핸들, 여백)은 DS입니다.
 * 휴대폰 폭(max-w-md) 가운데에 열리고, 아래는 pb-safe로 홈 인디케이터 위에 버튼이 놓입니다.
 */
export function BottomSheet({
  open = false,
  onClose,
  title,
  inline,
  children,
  footer,
  className,
}: BottomSheetProps) {
  const titleClass = 'text-head02 text-black0'

  if (inline) {
    return (
      <div
        role="dialog"
        aria-label={typeof title === 'string' ? title : undefined}
        className={cn(SHEET, className)}
      >
        <SheetBody title={title} footer={footer} titleSlot={<p className={titleClass}>{title}</p>}>
          {children}
        </SheetBody>
      </div>
    )
  }

  return (
    <Drawer open={open} onOpenChange={(next) => !next && onClose?.()}>
      <DrawerContent
        overlayClassName="bg-black0/90"
        /* 설명 문단이 없으므로 Radix의 aria-describedby 경고를 끕니다. */
        aria-describedby={undefined}
        className={cn(SHEET, 'mx-auto max-h-11/12 w-full max-w-md focus:outline-none', className)}
      >
        <SheetBody
          title={title}
          footer={footer}
          titleSlot={<DrawerTitle className={titleClass}>{title}</DrawerTitle>}
        >
          {children}
        </SheetBody>
        {/* 제목이 없어도 스크린리더용 이름은 필요합니다. */}
        {!title && <DrawerTitle className="sr-only">바텀시트</DrawerTitle>}
      </DrawerContent>
    </Drawer>
  )
}
