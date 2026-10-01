import type { ReactNode } from 'react'
import { useState } from 'react'
import shoeFront from '@/assets/illustrations/img_shoe_front.svg'
import type { ColorToken, IconName, IconProps, IconSize } from '@/components/ds'
import { Divider, Icon, ICON_SIZES, ImagePlaceholder } from '@/components/ds'
import { cn } from '@/lib/utils'
import { Caption, Demo, OptionGroup, Section } from './showcase'

const ICON_NAMES = Object.keys(ICON_SIZES) as IconName[]

/* SVG 파일 20개 = 이름 × 크기 (+ Favorite는 line·fill) */
type IconVariant = { name: IconName; size: IconSize; style?: 'line' | 'fill' }

const ICON_VARIANTS: IconVariant[] = ICON_NAMES.flatMap((name) =>
  (ICON_SIZES[name] as readonly IconSize[]).flatMap((size): IconVariant[] =>
    name === 'Favorite'
      ? (['line', 'fill'] as const).map((style) => ({ name, size, style }))
      : [{ name, size }],
  ),
)

const COLOR_SAMPLES: { color: ColorToken; dark?: boolean }[] = [
  { color: 'black0' },
  { color: 'gray5' },
  { color: 'error1' },
  { color: 'primary1' },
  { color: 'white0', dark: true },
]

export function FoundationsSection() {
  return (
    <Section id="foundations" title="Foundations">
      <IconGridDemo />
      <IconColorDemo />
      <IconStateDemo />
      <IconPlaygroundDemo />
      <IconLegacyArtDemo />
      <DividerDemo />
      <ImagePlaceholderDemo />
    </Section>
  )
}

function IconGridDemo() {
  return (
    <Demo title="Icon · 전체" description={`SVG ${ICON_VARIANTS.length}개. 이름과 크기(px)를 함께 표시합니다.`}>
      <ul className="gap-space-8 grid grid-cols-4">
        {ICON_VARIANTS.map(({ name, size, style }) => (
          <li
            key={`${name}-${size}-${style ?? ''}`}
            className="border-gray1 gap-stack-tight py-space-12 flex flex-col items-center rounded-sm border"
          >
            <div className="flex h-11 items-center justify-center">
              <Icon name={name} size={size} style={style} color="black0" />
            </div>
            <Caption className="text-center">
              {name}
              <br />
              {size}
              {style && ` · ${style}`}
            </Caption>
          </li>
        ))}
      </ul>
    </Demo>
  )
}

function IconColorDemo() {
  return (
    <Demo title="Icon · 색" description="color에 색 토큰 이름을 넘깁니다. 기본 크기로 그립니다.">
      <div className="gap-space-8 flex flex-col">
        {COLOR_SAMPLES.map(({ color, dark }) => (
          <div
            key={color}
            className={cn(
              'gap-space-8 p-card-padding flex flex-col rounded-sm border',
              dark ? 'border-black0 bg-black0' : 'border-gray1',
            )}
          >
            <Caption className={cn(dark && 'text-gray3')}>
              {color}
              {dark && ' on black0'}
            </Caption>
            <div className="gap-space-12 flex flex-wrap items-center">
              {ICON_NAMES.map((name) => (
                <Icon key={name} name={name} color={color} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </Demo>
  )
}

function IconStateDemo() {
  return (
    <Demo
      title="Icon · 상태"
      description="Home·Product·User는 color가 없으면 default = gray5, active = black0. Favorite는 line·fill."
    >
      <div className="gap-space-8 grid grid-cols-4">
        {(['Home', 'Product', 'User'] as const).flatMap((name) =>
          (['default', 'active'] as const).map((state) => (
            <StateCell key={`${name}-${state}`} label={`${name}\n${state}`}>
              <Icon name={name} state={state} />
            </StateCell>
          )),
        )}
        <StateCell label={'Favorite\nline'}>
          <Icon name="Favorite" style="line" />
        </StateCell>
        <StateCell label={'Favorite\nfill · error1'}>
          <Icon name="Favorite" style="fill" color="error1" />
        </StateCell>
      </div>
    </Demo>
  )
}

function StateCell({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="border-gray1 gap-stack-tight py-space-12 flex flex-col items-center rounded-sm border">
      <div className="flex h-11 items-center justify-center">{children}</div>
      <Caption className="text-center whitespace-pre-line">{label}</Caption>
    </div>
  )
}

const PLAYGROUND_COLORS = ['inherit', 'black0', 'gray5', 'gray4', 'primary1', 'error1', 'white0'] as const

function IconPlaygroundDemo() {
  const [name, setName] = useState<IconName>('Favorite')
  const [size, setSize] = useState<IconSize>(24)
  const [style, setStyle] = useState<'line' | 'fill'>('line')
  const [state, setState] = useState<'default' | 'active'>('default')
  const [color, setColor] = useState<(typeof PLAYGROUND_COLORS)[number]>('inherit')

  const sizes = ICON_SIZES[name] as readonly IconSize[]
  const currentSize = sizes.includes(size) ? size : sizes[0]
  const hasState = name === 'Home' || name === 'Product' || name === 'User'
  const props: IconProps = {
    name,
    size: currentSize,
    style: name === 'Favorite' ? style : undefined,
    state: hasState ? state : undefined,
    color: color === 'inherit' ? undefined : color,
  }

  return (
    <Demo title="Icon · 직접 바꿔보기" description="이름을 바꾸면 그 이름에 있는 크기만 고를 수 있습니다.">
      <div
        className={cn(
          'flex h-24 items-center justify-center rounded-sm border',
          color === 'white0' ? 'border-black0 bg-black0' : 'border-gray1',
        )}
      >
        <Icon {...props} />
      </div>
      <code className="text-caption02 text-gray6 bg-gray1 p-space-8 rounded-sm break-all">
        {`<Icon ${Object.entries(props)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => (typeof v === 'number' ? `${k}={${v}}` : `${k}="${v}"`))
          .join(' ')} />`}
      </code>
      <div className="gap-form-field flex flex-col">
        <OptionGroup label="name" options={ICON_NAMES} value={name} onChange={setName} />
        <OptionGroup label="size" options={sizes} value={currentSize} onChange={setSize} />
        {name === 'Favorite' && (
          <OptionGroup label="style" options={['line', 'fill'] as const} value={style} onChange={setStyle} />
        )}
        {hasState && (
          <OptionGroup
            label="state"
            options={['default', 'active'] as const}
            value={state}
            onChange={setState}
          />
        )}
        <OptionGroup label="color" options={PLAYGROUND_COLORS} value={color} onChange={setColor} />
      </div>
    </Demo>
  )
}

const LEGACY_SAMPLES = [
  'icn_search_gray_24px',
  'icn_info_blue_18px',
  'icn_info_red_18px',
  'icn_favorite_fill_24px',
  'icn_home_active_24px',
  'icn_arrow_right_16px',
] as const

const ART_SAMPLES = [
  'img_shoe_front',
  'img_shoe_side',
  'img_shoe_outsole',
  'img_shoe_defect',
] as const

function IconLegacyArtDemo() {
  return (
    <Demo
      title="Icon · 예전 이름 · 일러스트 · 로고"
      description="예전 Figma 이름(icn_*)은 당시 모양·색 그대로 그려져요(새 코드에서는 쓰지 않기). 일러스트와 로고도 name으로 그립니다."
    >
      <ul className="gap-space-8 grid grid-cols-3">
        {LEGACY_SAMPLES.map((name) => (
          <li
            key={name}
            className="border-gray1 gap-stack-tight py-space-12 flex flex-col items-center rounded-sm border"
          >
            <div className="flex h-11 items-center justify-center">
              <Icon name={name} />
            </div>
            <Caption className="text-center break-all">{name}</Caption>
          </li>
        ))}
      </ul>
      <ul className="gap-space-8 grid grid-cols-2">
        {ART_SAMPLES.map((name) => (
          <li
            key={name}
            className="border-gray1 gap-stack-tight py-space-12 flex flex-col items-center rounded-sm border"
          >
            <Icon name={name} />
            <Caption>{name}</Caption>
          </li>
        ))}
      </ul>
      <div className="border-gray1 gap-stack-tight py-space-12 flex flex-col items-center rounded-sm border">
        <Icon name="autique-logo" label="Autique" className="*:h-7 *:w-27" />
        <Caption>autique-logo (108×28로 표시)</Caption>
      </div>
    </Demo>
  )
}

function DividerDemo() {
  return (
    <Demo title="Divider" description="1px, 부모 폭을 채웁니다. 카드 안에서는 위아래 card-row(8) 간격.">
      <div className="gap-space-16 flex flex-col">
        {(['default', 'primary', 'error'] as const).map((tone) => (
          <div key={tone} className="gap-space-8 flex flex-col">
            <Caption>tone="{tone}"</Caption>
            <Divider tone={tone} />
          </div>
        ))}
      </div>
      <div className="gap-space-8 flex flex-col">
        <DividerCard tone="default" className="border-gray2 bg-white0" />
        <DividerCard tone="primary" className="border-primary2 bg-primary4" />
        <DividerCard tone="error" className="border-error2 bg-error4" />
      </div>
    </Demo>
  )
}

function DividerCard({
  tone,
  className,
}: {
  tone: 'default' | 'primary' | 'error'
  className: string
}) {
  return (
    <div className={cn('gap-card-row p-card-padding flex flex-col rounded-sm border', className)}>
      <Row label="카드 안 구분선" value={`tone="${tone}"`} />
      <Divider tone={tone} />
      <Row label="아래 행" value="값" />
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="gap-space-8 flex items-center justify-between">
      <span className="text-body05 text-gray5">{label}</span>
      <span className="text-body04 text-black0">{value}</span>
    </div>
  )
}

const RATIO_OPTIONS = ['1', '4:3', '16:9', '없음'] as const
const RATIO_VALUE: Record<(typeof RATIO_OPTIONS)[number], number | undefined> = {
  '1': 1,
  '4:3': 4 / 3,
  '16:9': 16 / 9,
  없음: undefined,
}

function ImagePlaceholderDemo() {
  const [ratio, setRatio] = useState<(typeof RATIO_OPTIONS)[number]>('1')
  const [withSrc, setWithSrc] = useState<'없음' | '있음'>('없음')
  const ratioValue = RATIO_VALUE[ratio]

  return (
    <Demo title="ImagePlaceholder" description="gray1 바탕 자리. src가 있으면 object-fit: cover로 채웁니다.">
      <div className="gap-space-12 flex items-start">
        <div className="gap-space-8 flex flex-col">
          <ImagePlaceholder width={160} ratio={1} />
          <Caption>width 160 · ratio 1</Caption>
        </div>
        <div className="gap-space-8 flex flex-col">
          <ImagePlaceholder width={125} height={118} />
          <Caption>125 × 118 (결과 일러스트)</Caption>
        </div>
      </div>

      <div className="gap-space-8 flex flex-col">
        <ImagePlaceholder
          ratio={ratioValue}
          height={ratioValue ? undefined : 120}
          src={withSrc === '있음' ? shoeFront : undefined}
          alt={withSrc === '있음' ? '신발 정면 일러스트' : undefined}
        />
        <Caption>
          부모 폭 · ratio {ratio}
          {!ratioValue && ' (height 120)'}
          {withSrc === '있음' && ' · src'}
        </Caption>
      </div>
      <div className="gap-form-field flex flex-col">
        <OptionGroup label="ratio" options={RATIO_OPTIONS} value={ratio} onChange={setRatio} />
        <OptionGroup
          label="src"
          options={['없음', '있음'] as const}
          value={withSrc}
          onChange={setWithSrc}
        />
      </div>
    </Demo>
  )
}
