import { cn } from '@/lib/utils'

/* SVG 원본(currentColor)을 문자열로 불러와 그대로 그립니다. 경로에서 파일명만 키로 씁니다. */
function loadSvgs(modules: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(modules).map(([path, svg]) => [path.split('/').pop()!.replace('.svg', ''), svg]),
  )
}

const ICON_SVGS = loadSvgs(
  import.meta.glob<string>('@/assets/icons/*.svg', {
    query: '?raw',
    import: 'default',
    eager: true,
  }),
)
const ART_SVGS = loadSvgs(
  import.meta.glob<string>(['@/assets/illustrations/*.svg', '@/assets/logos/*.svg'], {
    query: '?raw',
    import: 'default',
    eager: true,
  }),
)

/** 이름별로 제공되는 크기. 첫 번째 값이 기본 크기입니다. */
const ICON_SIZES = {
  Add: [24, 20],
  Minus: [24, 20],
  Info: [24, 18],
  Search: [24],
  Bell: [24],
  Bag: [24],
  ArrowLeft: [36],
  ArrowRight: [16, 36],
  ArrowUp: [20],
  ArrowDown: [16, 20],
  Favorite: [24],
  Home: [24],
  Product: [24],
  User: [24],
} as const satisfies Record<string, readonly IconSize[]>

export type IconName = keyof typeof ICON_SIZES
export type IconSize = 16 | 18 | 20 | 24 | 36
type ArtName =
  'img_shoe_front' | 'img_shoe_side' | 'img_shoe_outsole' | 'img_shoe_defect' | 'autique-logo'

/* 색 토큰 → 클래스. Tailwind가 클래스를 찾을 수 있도록 문자열을 그대로 적어둡니다. */
const COLOR_CLASS = {
  primary1: 'text-primary1',
  primary2: 'text-primary2',
  primary3: 'text-primary3',
  primary4: 'text-primary4',
  error1: 'text-error1',
  error2: 'text-error2',
  error3: 'text-error3',
  error4: 'text-error4',
  white0: 'text-white0',
  gray1: 'text-gray1',
  gray2: 'text-gray2',
  gray3: 'text-gray3',
  gray4: 'text-gray4',
  gray5: 'text-gray5',
  gray6: 'text-gray6',
  gray7: 'text-gray7',
  black0: 'text-black0',
} as const

export type ColorToken = keyof typeof COLOR_CLASS

type IconSpec = {
  name: IconName
  size?: IconSize
  style?: 'line' | 'fill'
  state?: 'default' | 'active'
  color?: ColorToken
}

/* 예전 Figma 이름(icn_*)은 당시 인스턴스의 모양·색 그대로 그립니다. 새 코드에서는 쓰지 마세요. */
const LEGACY = {
  icn_add_20px: { name: 'Add', size: 20, color: 'white0' },
  icn_add_24px: { name: 'Add', size: 24 },
  icn_minus_20px: { name: 'Minus', size: 20, color: 'white0' },
  icn_minus_24px: { name: 'Minus', size: 24 },
  icn_info_24px: { name: 'Info', size: 24, color: 'gray4' },
  icn_info_blue_18px: { name: 'Info', size: 18, color: 'primary1' },
  icn_info_red_18px: { name: 'Info', size: 18, color: 'error1' },
  icn_search_24px: { name: 'Search', size: 24 },
  icn_search_gray_24px: { name: 'Search', size: 24, color: 'gray5' },
  icn_bell_24px: { name: 'Bell', size: 24 },
  icn_bag_24px: { name: 'Bag', size: 24 },
  icn_arrow_left_36px: { name: 'ArrowLeft', size: 36 },
  icn_arrow_right_16px: { name: 'ArrowRight', size: 16 },
  icn_arrow_right_36px: { name: 'ArrowRight', size: 36 },
  icn_arrow_top_20px: { name: 'ArrowUp', size: 20 },
  icn_arrow_down_16px: { name: 'ArrowDown', size: 16 },
  icn_arrow_down_20px: { name: 'ArrowDown', size: 20 },
  icn_favorite_black_line_24px: { name: 'Favorite', size: 24, style: 'line' },
  icn_favorite_line_24px: { name: 'Favorite', size: 24, style: 'line', color: 'error1' },
  icn_favorite_fill_24px: { name: 'Favorite', size: 24, style: 'fill', color: 'error1' },
  icn_home_24px: { name: 'Home', size: 24, state: 'default' },
  icn_home_active_24px: { name: 'Home', size: 24, state: 'active' },
  icn_product_24px: { name: 'Product', size: 24, state: 'default' },
  icn_product_active_24px: { name: 'Product', size: 24, state: 'active' },
  icn_user_24px: { name: 'User', size: 24, state: 'default' },
  icn_user_active_24px: { name: 'User', size: 24, state: 'active' },
} as const satisfies Record<string, IconSpec>

type LegacyName = keyof typeof LEGACY

export interface IconProps {
  name: IconName | LegacyName | ArtName
  /** 이름마다 있는 크기만 쓸 수 있고, 없는 크기면 기본 크기로 그립니다. */
  size?: IconSize
  /** Favorite 전용 */
  style?: 'line' | 'fill'
  /** Home·Product·User 전용. color가 없으면 default = gray5, active = black0 */
  state?: 'default' | 'active'
  /** 색 토큰 이름. 없으면 주변 글자색을 따릅니다. */
  color?: ColorToken
  /** 뜻이 있는 단독 아이콘에만 넘깁니다. 버튼 안 아이콘은 버튼에 aria-label을 답니다. */
  label?: string
  className?: string
}

const TAB_ICONS: readonly IconName[] = ['Home', 'Product', 'User']

function kebab(s: string) {
  return s.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
}

function isLegacy(name: string): name is LegacyName {
  return name in LEGACY
}

export function Icon({ name, label, className, ...props }: IconProps) {
  const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true }
  const base = 'inline-flex shrink-0 leading-none *:block'

  if (name in ART_SVGS) {
    return (
      <span
        className={cn(base, className)}
        {...a11y}
        dangerouslySetInnerHTML={{ __html: ART_SVGS[name] }}
      />
    )
  }

  const spec: IconSpec = isLegacy(name)
    ? { ...LEGACY[name], ...stripUndefined(props) }
    : { name: name as IconName, ...props }

  const sizes: readonly IconSize[] = ICON_SIZES[spec.name]
  const size = spec.size && sizes.includes(spec.size) ? spec.size : sizes[0]
  const variant = spec.name === 'Favorite' ? `-${spec.style === 'fill' ? 'fill' : 'line'}` : ''
  const svg = ICON_SVGS[`${kebab(spec.name)}-${size}${variant}`]
  if (!svg) return null

  const color =
    spec.color ??
    (TAB_ICONS.includes(spec.name) ? (spec.state === 'active' ? 'black0' : 'gray5') : undefined)

  return (
    <span
      className={cn(base, color && COLOR_CLASS[color], className)}
      {...a11y}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}

function stripUndefined<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>
}
