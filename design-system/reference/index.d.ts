import * as React from 'react';

export type ChipKind = 'plan' | 'finish' | 'live' | 'level' | 'best' | 'worst' | 'caution' | 'recommend';
export type Emphasis = 'default' | 'regular' | 'primary' | 'danger' | 'total' | 'totalDanger' | 'hero';
export type ColorToken = 'primary1' | 'primary2' | 'primary3' | 'primary4' | 'error1' | 'error2' | 'error3' | 'error4'
  | 'white0' | 'gray1' | 'gray2' | 'gray3' | 'gray4' | 'gray5' | 'gray6' | 'gray7' | 'black0';
/** One label–value row (Figma InfoRow) passed in a card's rows. `tone` is the old name of `emphasis` ('danger' | 'primary'). */
export interface InfoRowData { label: React.ReactNode; value: React.ReactNode; emphasis?: Emphasis; tone?: 'danger' | 'primary'; }
export interface InfoRowProps extends InfoRowData { className?: string; }

/* Navigation */
export interface HeaderProps { title: React.ReactNode; showBack?: boolean; onBack?: () => void;
  trailing?: 'favorite' | 'live' | React.ReactNode; favorited?: boolean; onFavorite?: () => void; className?: string; }
export interface HomeHeaderProps { onSearch?: () => void; onNotifications?: () => void; onBag?: () => void; className?: string; }
export interface SearchHeaderProps extends React.InputHTMLAttributes<HTMLInputElement> {}
export type TabKey = 'home' | 'product' | 'mypage';
/** Each tab is a link (/ · /products · /mypage); without `active` the current route decides. */
export interface TabBarProps { active?: TabKey; onChange?: (tab: TabKey) => void; className?: string; }

/* Actions */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** 'secondary' is an alias of 'outline'. */
  variant?: 'primary' | 'outline' | 'danger' | 'secondary'; block?: boolean; }
/** Figma BottomButtonBar `layout`. 'layout4' / 'layout5' are the old names of 'secondary' / 'primaryDanger'. */
export type BottomButtonBarLayout = 'single' | 'double' | 'triple' | 'secondary' | 'primaryDanger' | 'layout4' | 'layout5';
export interface BottomButtonBarProps { layout?: BottomButtonBarLayout;
  primaryLabel?: string; secondaryLabel?: string; dangerLabel?: string; primaryDisabled?: boolean;
  onPrimary?: () => void; onSecondary?: () => void; onDanger?: () => void; className?: string; }
export interface FloatingActionButtonProps { children?: React.ReactNode; onClick?: () => void; className?: string; }
export interface LoadMoreButtonProps { children: React.ReactNode; onClick?: () => void; className?: string; }
export interface LoadMoreDownButtonProps { title: React.ReactNode; children: React.ReactNode; open?: boolean; defaultOpen?: boolean;
  onToggle?: (open: boolean) => void; className?: string; }

/* Status & feedback */
export interface ChipProps { kind?: ChipKind; children: React.ReactNode; className?: string; }
export interface PageIndicatorProps { count?: number; current?: number; className?: string; }
export interface InfoBannerProps { tone?: 'default' | 'error'; children: React.ReactNode; className?: string; }
/** value 0–1. */
export interface ProgressBarProps { value: number; label?: string; className?: string; }

/* Forms */
/** `error`: message shown under the field; the border turns error1. */
export interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> { label?: string; error?: React.ReactNode; }
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> { label?: string; error?: React.ReactNode; }
export interface SegmentedControlProps { label?: string; options: string[]; value?: string; defaultValue?: string;
  disabledOptions?: string[]; onChange?: (value: string) => void; error?: React.ReactNode; onBlur?: () => void; className?: string; }
/** Passing onDateClick / onTimeClick turns that cell into a button (the picker is the consumer's). */
export interface TimeInputProps { label?: string; date: string; time: string; onDateClick?: () => void; onTimeClick?: () => void;
  error?: React.ReactNode; className?: string; }
/** value (or defaultValue) in won + min/max/step (default 5,000) + onChange; the −/+ buttons disable at the limits. */
export interface AmountStepperProps { label?: string; value?: number; defaultValue?: number;
  onChange?: (value: number) => void; min?: number; max?: number; step?: number; format?: (value: number) => React.ReactNode;
  hint?: React.ReactNode; error?: React.ReactNode; className?: string; }
export interface RadioOption { value: string; label: React.ReactNode; badge?: string; }
export interface RadioListProps { label?: string; options: RadioOption[]; value?: string; defaultValue?: string;
  onChange?: (value: string) => void; error?: React.ReactNode; onBlur?: () => void; className?: string; }
/** A hidden file input: native input props (name, onChange, disabled, accept…) go to it; picking a photo shows a preview. */
export interface ImageUploadButtonProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'children'> {
  direction?: 'front' | 'side' | 'outsole' | 'defect'; label?: string; image?: string; invalid?: boolean; className?: string; }
export interface StepHeaderProps { step?: string; title: React.ReactNode; description?: React.ReactNode;
  onInfo?: () => void; className?: string; }

/* Auction */
export interface BiddingListItemProps { price?: 'best' | 'worst' | 'default'; time: string; bidder: string;
  method?: string; amount: string; badge?: string; className?: string; }
export interface ProductCardProps { status?: 'planned' | 'live'; statusLabel?: string; image?: string; grade?: string;
  brand: string; name: string; priceLabel?: string; price: string; meta?: string;
  favorited?: boolean; onFavorite?: () => void; className?: string; }
export interface ProductSummaryProps { name: React.ReactNode; subName?: React.ReactNode; image?: string; className?: string; }
export interface SellerProfileProps { name: React.ReactNode; meta?: React.ReactNode; avatar?: string; className?: string; }
export interface DividerProps { tone?: 'default' | 'primary' | 'error'; className?: string; }
export interface TagProps { tone?: 'primary' | 'error'; size?: 'md' | 'sm'; children: React.ReactNode; className?: string; }
/** Up to 4 rows; `dividerAfter` = number of rows before the divider (Figma: 2). */
export interface SummaryCardProps { tone?: 'default' | 'primary'; rows: InfoRowData[]; dividerAfter?: number; className?: string; }
export interface InfoFieldProps { label: React.ReactNode; value: React.ReactNode; className?: string; }
export interface SortTabsProps { options?: string[]; value?: string; defaultValue?: string; onChange?: (value: string) => void; label?: string; className?: string; }
export interface ImagePlaceholderProps { width?: number | string; height?: number | string; ratio?: number; src?: string; alt?: string; className?: string; }
export interface PriceCardProps { tag?: string; price: string; rows?: InfoRowData[]; className?: string; }
export interface AuctionStatusCardProps { status?: 'leading' | 'exceeded' | 'watching'; priceLabel?: string; price: string; badge?: string; rows?: InfoRowData[];
  extraRows?: InfoRowData[]; progress?: number; caption?: React.ReactNode; className?: string; }

/* Overlay */
export interface BottomSheetProps { open?: boolean; onClose?: () => void; title?: React.ReactNode; inline?: boolean;
  children?: React.ReactNode; footer?: React.ReactNode; className?: string; }

export type IconName = 'Add' | 'Minus' | 'Info' | 'Search' | 'Bell' | 'Bag' | 'ArrowLeft' | 'ArrowRight' | 'ArrowUp' | 'ArrowDown'
  | 'Favorite' | 'Home' | 'Product' | 'User';
/** A Figma `Icon/<Name>` set. `size` picks a variant (Add/Minus 24|20, Info 24|18, ArrowRight 16|36, ArrowDown 16|20, others one size);
 *  `style` only for Favorite, `state` only for Home/Product/User (default = gray5, active = black0).
 *  `color` is a colour token name; without it the icon takes the text colour around it.
 *  Old names ("icn_search_24px") and illustrations ("img_shoe_front", "autique-logo") also work. */
export interface IconProps { name: IconName | string; size?: 16 | 18 | 20 | 24 | 36; style?: 'line' | 'fill';
  state?: 'default' | 'active'; color?: ColorToken; label?: string; className?: string; }

export declare const Header: React.FC<HeaderProps>;
export declare const HomeHeader: React.FC<HomeHeaderProps>;
export declare const SearchHeader: React.FC<SearchHeaderProps>;
export declare const TabBar: React.FC<TabBarProps>;
export declare const Button: React.FC<ButtonProps>;
export declare const BottomButtonBar: React.FC<BottomButtonBarProps>;
export declare const FloatingActionButton: React.FC<FloatingActionButtonProps>;
export declare const LoadMoreButton: React.FC<LoadMoreButtonProps>;
export declare const LoadMoreDownButton: React.FC<LoadMoreDownButtonProps>;
export declare const Chip: React.FC<ChipProps>;
export declare const PageIndicator: React.FC<PageIndicatorProps>;
export declare const InfoBanner: React.FC<InfoBannerProps>;
export declare const ProgressBar: React.FC<ProgressBarProps>;
export declare const TextField: React.FC<TextFieldProps>;
export declare const Textarea: React.FC<TextareaProps>;
export declare const SegmentedControl: React.FC<SegmentedControlProps>;
export declare const TimeInput: React.FC<TimeInputProps>;
export declare const AmountStepper: React.FC<AmountStepperProps>;
export declare const RadioList: React.FC<RadioListProps>;
export declare const ImageUploadButton: React.FC<ImageUploadButtonProps>;
export declare const StepHeader: React.FC<StepHeaderProps>;
export declare const BiddingListItem: React.FC<BiddingListItemProps>;
export declare const ProductCard: React.FC<ProductCardProps>;
export declare const ProductSummary: React.FC<ProductSummaryProps>;
export declare const SellerProfile: React.FC<SellerProfileProps>;
export declare const InfoRow: React.FC<InfoRowProps>;
export declare const InfoField: React.FC<InfoFieldProps>;
export declare const SummaryCard: React.FC<SummaryCardProps>;
export declare const PriceCard: React.FC<PriceCardProps>;
export declare const Tag: React.FC<TagProps>;
export declare const Divider: React.FC<DividerProps>;
export declare const SortTabs: React.FC<SortTabsProps>;
export declare const ImagePlaceholder: React.FC<ImagePlaceholderProps>;
export declare const AuctionStatusCard: React.FC<AuctionStatusCardProps>;
export declare const BottomSheet: React.FC<BottomSheetProps>;
export declare const Icon: React.FC<IconProps>;
