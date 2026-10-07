import { zodResolver } from '@hookform/resolvers/zod'
import type { ReactNode } from 'react'
import { useState } from 'react'
import type { DefaultValues, FieldErrors } from 'react-hook-form'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import type { RadioOption } from '@/components/ds'
import {
  AmountStepper,
  Button,
  ImageUploadButton,
  InfoBanner,
  InfoField,
  RadioList,
  SegmentedControl,
  StepHeader,
  Textarea,
  TextField,
  TimeInput,
} from '@/components/ds'
import shoeFront from '@/assets/illustrations/img_shoe_front.svg'
import shoeSide from '@/assets/illustrations/img_shoe_side.svg'
import { formatNumber } from '@/lib/format'
import { Caption, Demo, OptionGroup, Section } from './showcase'

export function FormsSection() {
  return (
    <Section id="forms" title="Forms">
      <TextFieldDemo />
      <TextareaDemo />
      <TimeInputDemo />
      <StepHeaderDemo />
      <InfoFieldDemo />
      <SegmentedControlDemo />
      <AmountStepperDemo />
      <RadioListDemo />
      <ImageUploadButtonDemo />
      <RhfFormDemo />
    </Section>
  )
}

function TextFieldDemo() {
  return (
    <Demo
      title="TextField"
      description="라벨 head03 + 8 + 50px 입력. 포커스는 직접 탭해서 확인(테두리 primary1). 에러 상태는 DS에 없어 정한 값입니다."
    >
      <div className="gap-form-field flex flex-col">
        <TextField label="default" placeholder="모델명을 입력해주세요" />
        <TextField label="filled" defaultValue="나이키" />
        <TextField label="disabled" defaultValue="240" disabled />
        <TextField label="error" defaultValue="" error="브랜드를 입력해 주세요." />
        <TextField placeholder="라벨 없이" aria-label="라벨 없는 입력" />
      </div>
    </Demo>
  )
}

function TextareaDemo() {
  return (
    <Demo title="Textarea" description="TextField와 같은 스타일, 102px(약 3줄), 크기 조절 없음.">
      <div className="gap-form-field flex flex-col">
        <Textarea label="default" placeholder="상품에 대한 추가 정보가 있다면 입력해주세요." />
        <Textarea
          label="filled · 긴 문장"
          defaultValue={
            '밑창 일부에 사용감이 있지만 갑피는 깨끗해요.\n박스와 여분 끈이 함께 있어요.\n직거래는 어렵고 택배로만 보내요.\n네 번째 줄은 스크롤돼요.'
          }
        />
        <Textarea label="disabled" defaultValue="수정할 수 없는 설명" disabled />
        <Textarea label="error" error="100자 이내로 입력해 주세요." />
      </div>
    </Demo>
  )
}

function TimeInputDemo() {
  const [count, setCount] = useState({ date: 0, time: 0 })

  return (
    <Demo
      title="TimeInput"
      description="날짜·시간 두 칸, 8 간격으로 반씩. 피커는 소비 측이 연결합니다. onDateClick·onTimeClick을 넘기면 칸이 버튼이 됩니다."
    >
      <div className="gap-form-field flex flex-col">
        <TimeInput label="표시만 (DS 원본)" date="2026.09.21" time="오후 4:00" />
        <TimeInput
          label="누를 수 있음"
          date="2026.09.21"
          time="오후 4:00"
          onDateClick={() => setCount((c) => ({ ...c, date: c.date + 1 }))}
          onTimeClick={() => setCount((c) => ({ ...c, time: c.time + 1 }))}
        />
        <Caption>
          날짜 칸 {count.date}회 · 시간 칸 {count.time}회 눌림
        </Caption>
        <TimeInput
          label="error"
          date="2026.09.21"
          time="오전 9:00"
          onDateClick={() => {}}
          onTimeClick={() => {}}
          error="종료 시간은 시작 시간 이후여야 해요."
        />
      </div>
    </Demo>
  )
}

function StepHeaderDemo() {
  const [infoCount, setInfoCount] = useState(0)

  return (
    <Demo
      title="StepHeader"
      description="단계(body06 gray5) · 제목(head01) + 정보 아이콘 · 설명(body05). 화면에서는 헤더 아래 layout-step(32)."
    >
      <div className="gap-layout-step flex flex-col">
        <div className="gap-space-8 flex flex-col">
          <StepHeader
            step="2/6"
            title="AI 상품 분석"
            onInfo={() => setInfoCount((c) => c + 1)}
            description="업로드한 이미지를 바탕으로 AI가 상품을 분석했어요. 잘못된 정보가 있다면 알맞게 수정해주세요."
          />
          <Caption>onInfo 호출 {infoCount}회 (아이콘 주변 44px 어디를 눌러도 동작)</Caption>
        </div>
        <StepHeader
          step="1/6"
          title="상품 사진 등록"
          description="정면, 측면, 밑창, 하자 부위 사진을 올려주세요."
        />
        <StepHeader title="단계·설명 없이 제목만" />
      </div>
    </Demo>
  )
}

function InfoFieldDemo() {
  const [tapped, setTapped] = useState<string | null>(null)

  return (
    <Demo
      title="InfoField"
      description="라벨 body03 + 4 + 값 body02. 흰 카드 안에 16 간격으로 쌓습니다. onClick을 넘기면 항목 전체가 버튼이 되고(눌린 동안 흐려짐), 터치 영역은 위아래 8씩 넓어집니다."
    >
      <div className="border-gray2 gap-form-field p-card-padding flex flex-col rounded-sm border">
        <InfoField label="브랜드" value="나이키" />
        <InfoField label="모델명" value="Dunk Low Retro White Black" />
        <InfoField label="상태" value="보통 수준의 상태로, 일반적인 사용감이 있어요." />
        <InfoField
          label="판매자 설명"
          value={
            '밑창 일부에 사용감이 있지만 갑피는 깨끗해요.\n박스와 여분 끈이 함께 있어요. 아주아주긴단어도줄바꿈되는지확인하기위한문장입니다AAAAAAAAAAAAAAAAAAAAAAAAAAAA'
          }
        />
      </div>
      <div className="border-gray2 gap-form-field p-card-padding flex flex-col rounded-sm border">
        <InfoField label="브랜드 (onClick)" value="나이키" onClick={() => setTapped('브랜드')} />
        <InfoField label="구성품 여부 (onClick)" value="일부 있음" onClick={() => setTapped('구성품 여부')} />
      </div>
      <Caption>마지막으로 누른 항목: {tapped ?? '없음'}</Caption>
    </Demo>
  )
}

const PARTS = ['전체 있음', '일부 있음', '구성품 없음']

function SegmentedControlDemo() {
  const [value, setValue] = useState('일부 있음')

  return (
    <Demo
      title="SegmentedControl"
      description="40px 칸, body05. 선택 black0 채움(Figma는 gray6), 눌림 gray2, 비활성 gray2 + gray5 글자. Radix ToggleGroup: 탭으로 들어와 ←→로 이동, Space·Enter로 선택."
    >
      <div className="gap-form-field flex flex-col">
        <SegmentedControl label="비제어형 · defaultValue" options={PARTS} defaultValue="일부 있음" />
        <div className="gap-stack-tight flex flex-col">
          <SegmentedControl
            label="제어형 · value + onChange"
            options={PARTS}
            value={value}
            onChange={setValue}
          />
          <Caption>value = "{value}"</Caption>
        </div>
        <SegmentedControl
          label="disabledOptions"
          options={PARTS}
          disabledOptions={['구성품 없음']}
        />
        <SegmentedControl
          label="선택지 2개 · 아무것도 선택 안 함"
          options={['있음', '없음']}
        />
        <ErrorUntilSelected>
          {(value, onChange, error) => (
            <SegmentedControl
              label="error · 고르면 풀림"
              options={PARTS}
              value={value}
              onChange={onChange}
              error={error && '구성품 여부를 골라 주세요.'}
            />
          )}
        </ErrorUntilSelected>
      </div>
    </Demo>
  )
}

function AmountStepperDemo() {
  const [value, setValue] = useState(120000)
  const [step, setStep] = useState<1000 | 5000 | 10000>(5000)

  return (
    <Demo
      title="AmountStepper"
      description="min·max·step을 받아 스스로 계산하고, 한계에서 버튼이 흐려지며(opacity 30%) 눌리지 않습니다. 금액은 title02."
    >
      <div className="gap-space-8 flex flex-col">
        <AmountStepper
          label="내 자동 입찰 상한가"
          value={value}
          onChange={setValue}
          min={105000}
          max={150000}
          step={step}
          hint="상한가는 현재가보다 5,000원 이상 높게 정할 수 있어요. 입찰은 5,000원씩 올라가고, 실제 결제 금액은 경쟁 상황에 따라 달라져요."
        />
        <Caption>
          value {formatNumber(value)} · min 105,000 · max 150,000 · step{' '}
          {formatNumber(step)}
        </Caption>
        <OptionGroup
          label="step"
          options={[1000, 5000, 10000] as const}
          value={step}
          onChange={setStep}
        />
      </div>
      <AmountStepper
        label="비제어형 · 최솟값에서 시작(− 비활성)"
        defaultValue={100000}
        min={100000}
        max={110000}
      />
      <AmountStepper
        label="error"
        defaultValue={110000}
        min={100000}
        error="상한가는 현재가(115,000원)보다 5,000원 이상 높아야 해요."
      />
    </Demo>
  )
}

/** 에러 예시용: 아무것도 고르지 않은 동안만 에러를 보여줍니다. */
function ErrorUntilSelected({
  children,
}: {
  children: (value: string, onChange: (v: string) => void, error: boolean) => ReactNode
}) {
  const [value, setValue] = useState('')
  return children(value, setValue, value === '')
}

const PAYMENTS: RadioOption[] = [
  { value: 'card', label: '신용/체크카드' },
  { value: 'kakao', label: '카카오페이' },
  { value: 'naver', label: '네이버페이' },
  { value: 'etc', label: '기타 결제' },
]

function RadioListDemo() {
  const [value, setValue] = useState('card')

  return (
    <Demo
      title="RadioList"
      description="gray1 테두리 박스, 24px 라디오 + body04, 행 사이 12 + 구분선. Radix RadioGroup: 탭으로 들어와 ↑↓로 이동하며 선택."
    >
      <div className="gap-stack-tight flex flex-col">
        <RadioList label="결제 수단" options={PAYMENTS} value={value} onChange={setValue} />
        <Caption>제어형 · value = "{value}"</Caption>
      </div>
      <div className="gap-stack-tight flex flex-col">
        <RadioList label="결제 수단(선택 없음)" options={PAYMENTS} />
        <Caption>비제어형 · 아무것도 선택 안 함</Caption>
      </div>
      <div className="gap-stack-tight flex flex-col">
        <RadioList
          label="배지 있음"
          defaultValue="kakao"
          options={PAYMENTS.slice(0, 2).map((o) => ({ ...o, badge: shoeSide }))}
        />
        <Caption>badge: 42×24 이미지(실제 결제사 로고는 소비 측이 제공, 여기선 임시 이미지)</Caption>
      </div>
      <div className="gap-stack-tight flex flex-col">
        <ErrorUntilSelected>
          {(value, onChange, error) => (
            <RadioList
              label="결제 수단"
              options={PAYMENTS}
              value={value}
              onChange={onChange}
              error={error && '결제 수단을 골라 주세요.'}
            />
          )}
        </ErrorUntilSelected>
        <Caption>error · 고르면 풀림</Caption>
      </div>
    </Demo>
  )
}

function ImageUploadButtonDemo() {
  const [resetKey, setResetKey] = useState(0)
  const [removed, setRemoved] = useState(0)

  return (
    <Demo
      title="ImageUploadButton"
      description="정사각 칸 가운데 일러스트(100×48) + head03 라벨. 칸을 누르면 사진 선택 창이 열리고, 고르면 미리보기로 채워집니다. 채워진 칸을 다시 누르면 다른 사진으로 바꿉니다. onRemove를 넘기면 사진 오른쪽 위에 Close(36, 터치 44) 버튼이 생겨 누르면 칸이 비워집니다. 2×2, 간격 8."
    >
      <div key={resetKey} className="gap-space-8 grid grid-cols-2">
        <ImageUploadButton direction="front" onRemove={() => setRemoved((c) => c + 1)} />
        <ImageUploadButton direction="side" onRemove={() => setRemoved((c) => c + 1)} />
        <ImageUploadButton direction="outsole" onRemove={() => setRemoved((c) => c + 1)} />
        <ImageUploadButton direction="defect" onRemove={() => setRemoved((c) => c + 1)} />
      </div>
      <Caption>onRemove 호출 {removed}회</Caption>
      <Button variant="outline" block={false} className="self-start" onClick={() => setResetKey((k) => k + 1)}>
        사진 모두 지우기
      </Button>
      <div className="gap-space-8 grid grid-cols-2">
        <div className="gap-stack-tight flex flex-col">
          <ImageUploadButton direction="front" image={shoeFront} label="image 있음" />
          <Caption>image prop(이미 올라간 사진)</Caption>
        </div>
        <div className="gap-stack-tight flex flex-col">
          <ImageUploadButton
            direction="side"
            image={shoeSide}
            label="onRemove"
            onRemove={() => setRemoved((c) => c + 1)}
          />
          <Caption>image + onRemove(오른쪽 위 X)</Caption>
        </div>
        <div className="gap-stack-tight flex flex-col">
          <ImageUploadButton direction="side" invalid />
          <Caption>invalid</Caption>
        </div>
        <div className="gap-stack-tight flex flex-col">
          <ImageUploadButton direction="outsole" disabled />
          <Caption>disabled</Caption>
        </div>
      </div>
    </Demo>
  )
}

/* ───────── RHF + Zod 데모 ───────── */

const LIMIT = { brand: 20, model: 30, description: 100 } as const
const BID = { min: 100000, max: 200000, required: 120000 } as const
const PHOTOS = [
  { name: 'photoFront', direction: 'front', label: '앞면' },
  { name: 'photoSide', direction: 'side', label: '측면' },
  { name: 'photoOutsole', direction: 'outsole', label: '밑창' },
  { name: 'photoDefect', direction: 'defect', label: '하자' },
] as const

const requiredPhoto = (label: string) =>
  z
    .custom<FileList>()
    .refine((files) => files instanceof FileList && files.length > 0, `${label} 사진을 올려 주세요.`)

const demoSchema = z.object({
  brand: z
    .string()
    .trim()
    .min(1, '브랜드를 입력해 주세요.')
    .max(LIMIT.brand, `${LIMIT.brand}자 이내로 입력해 주세요.`),
  model: z
    .string()
    .trim()
    .min(1, '모델명을 입력해 주세요.')
    .max(LIMIT.model, `${LIMIT.model}자 이내로 입력해 주세요.`),
  description: z.string().max(LIMIT.description, `${LIMIT.description}자 이내로 입력해 주세요.`),
  /** 'YYYY-MM-DDTHH:mm' (로컬 시간) */
  startAt: z.string().min(1, '시작 시간을 선택해 주세요.'),
  parts: z.string().min(1, '구성품 여부를 골라 주세요.'),
  /* 스테퍼 자체 한계(100,000~200,000)와 별개로, 폼 규칙은 120,000 이상 */
  maxBid: z
    .number()
    .min(BID.required, `상한가는 현재가(115,000원)보다 5,000원 이상 높아야 해요.`)
    .max(BID.max),
  payment: z.string().min(1, '결제 수단을 골라 주세요.'),
  photoFront: requiredPhoto('앞면'),
  photoSide: requiredPhoto('측면'),
  photoOutsole: requiredPhoto('밑창'),
  photoDefect: z.custom<FileList>().optional(),
})

type DemoValues = z.infer<typeof demoSchema>

/* 사진(FileList)은 처음엔 비어 있으므로 DefaultValues(부분 값)로 둡니다. */
const DEFAULT_VALUES: DefaultValues<DemoValues> = {
  brand: '',
  model: '',
  description: '',
  startAt: '',
  parts: '',
  maxBid: BID.min,
  payment: '',
}

type SubmitResult =
  | { ok: true; values: unknown }
  | { ok: false; values: unknown; errors: Record<string, string | undefined> }

/* FileList는 JSON으로 바꾸면 {}가 되므로 파일 이름 목록으로 보여줍니다. */
function toJsonable(values: Partial<DemoValues>) {
  return Object.fromEntries(
    Object.entries(values).map(([k, v]) => [
      k,
      v instanceof FileList ? Array.from(v, (f) => `${f.name} (${Math.round(f.size / 1024)}KB)`) : v,
    ]),
  )
}

function RhfFormDemo() {
  const [result, setResult] = useState<SubmitResult | null>(null)
  /* 파일 input은 reset으로 비워져도 미리보기는 남으므로 key를 바꿔 새로 그립니다. */
  const [photoKey, setPhotoKey] = useState(0)
  const {
    register,
    control,
    handleSubmit,
    getValues,
    setFocus,
    reset,
    formState: { errors },
  } = useForm<DemoValues>({ resolver: zodResolver(demoSchema), defaultValues: DEFAULT_VALUES })

  const onValid = (values: DemoValues) => setResult({ ok: true, values: toJsonable(values) })
  /* errors에는 DOM ref가 들어 있어 그대로 JSON으로 못 바꾸므로 메시지만 뽑습니다. */
  const onInvalid = (errs: FieldErrors<DemoValues>) =>
    setResult({
      ok: false,
      values: toJsonable(getValues()),
      errors: Object.fromEntries(Object.entries(errs).map(([k, v]) => [k, v?.message])),
    })

  const missingPhotos = PHOTOS.filter(({ name }) => errors[name]).map(({ label }) => label)

  /* watch() 대신 useWatch: React Compiler와 호환되고 이 값만 구독합니다. */
  const [brand, model, description] = useWatch({
    control,
    name: ['brand', 'model', 'description'],
  })

  return (
    <Demo
      title="React Hook Form + Zod"
      description="TextField·Textarea·ImageUploadButton은 register를 그대로 펼쳐 넣고, TimeInput·SegmentedControl·AmountStepper·RadioList는 Controller로 연결합니다. 최대 길이를 넘겨 입력할 수 있게 maxLength 속성은 일부러 두지 않았어요."
    >
      <form
        noValidate
        onSubmit={handleSubmit(onValid, onInvalid)}
        className="border-gray2 gap-form-field p-card-padding flex flex-col rounded-sm border"
      >
        <div className="gap-stack-tight flex flex-col">
          <TextField
            label="브랜드 (필수)"
            placeholder="브랜드를 입력해주세요."
            error={errors.brand?.message}
            {...register('brand')}
          />
          <Counter value={brand.length} max={LIMIT.brand} />
        </div>
        <div className="gap-stack-tight flex flex-col">
          <TextField
            label="모델명 (필수)"
            placeholder="모델명을 입력해주세요."
            error={errors.model?.message}
            {...register('model')}
          />
          <Counter value={model.length} max={LIMIT.model} />
        </div>
        <div className="gap-stack-tight flex flex-col">
          <Textarea
            label="판매자 설명 (선택)"
            placeholder="상품에 대한 추가 정보가 있다면 입력해주세요."
            error={errors.description?.message}
            {...register('description')}
          />
          <Counter value={description.length} max={LIMIT.description} />
        </div>
        <Controller
          control={control}
          name="startAt"
          render={({ field, fieldState }) => {
            const { date, time } = formatLocal(field.value)
            return (
              <div className="gap-stack-tight flex flex-col">
                <TimeInput
                  ref={field.ref}
                  label="시작 시간 (필수)"
                  date={date}
                  time={time}
                  error={fieldState.error?.message}
                  onDateClick={() => field.onChange(shift(field.value, { days: 1 }))}
                  onTimeClick={() => field.onChange(shift(field.value, { minutes: 30 }))}
                />
                <Caption>데모용: 날짜 칸은 하루, 시간 칸은 30분씩 늘어나요(실제 피커 대신).</Caption>
              </div>
            )
          }}
        />

        <Controller
          control={control}
          name="parts"
          render={({ field, fieldState }) => (
            <SegmentedControl
              ref={field.ref}
              label="구성품 여부 (필수)"
              options={PARTS}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="maxBid"
          render={({ field, fieldState }) => (
            <AmountStepper
              ref={field.ref}
              label="내 자동 입찰 상한가 (120,000원 이상)"
              value={field.value}
              onChange={field.onChange}
              min={BID.min}
              max={BID.max}
              hint="데모용: 100,000원에서 시작하니 네 번 올려야 통과해요."
              error={fieldState.error?.message}
            />
          )}
        />
        <div className="gap-form-label flex flex-col">
          <span className="text-head03 text-black0">결제 수단 (필수)</span>
          <Controller
            control={control}
            name="payment"
            render={({ field, fieldState }) => (
              <RadioList
                ref={field.ref}
                label="결제 수단"
                options={PAYMENTS}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={fieldState.error?.message}
              />
            )}
          />
        </div>
        <div className="gap-form-label flex flex-col">
          <span className="text-head03 text-black0">상품 사진 (앞면·측면·밑창 필수)</span>
          <div key={photoKey} className="gap-space-8 grid grid-cols-2">
            {PHOTOS.map(({ name, direction }) => (
              <ImageUploadButton
                key={name}
                direction={direction}
                invalid={!!errors[name]}
                {...register(name)}
              />
            ))}
          </div>
          {/* 칸별 에러를 모아 한 줄로: "측면, 밑창 사진을 올려 주세요." */}
          {missingPhotos.length > 0 && (
            <p role="alert" className="text-caption01 text-error1">
              {missingPhotos.join(', ')} 사진을 올려 주세요.
            </p>
          )}
        </div>

        <div className="gap-space-8 flex flex-col">
          <Button type="submit">제출하기</Button>
          <div className="gap-space-8 flex">
            <Button
              variant="outline"
              className="min-w-0 flex-1"
              onClick={() => setFocus('brand')}
            >
              브랜드에 포커스
            </Button>
            <Button
              variant="outline"
              className="min-w-0 flex-1"
              onClick={() => {
                reset(DEFAULT_VALUES)
                setPhotoKey((k) => k + 1)
                setResult(null)
              }}
            >
              초기화
            </Button>
          </div>
        </div>
      </form>

      {result && (
        <div className="gap-space-8 flex flex-col">
          {result.ok ? (
            <InfoBanner>제출 성공이에요. 아래는 Zod를 통과한(trim 적용) 값이에요.</InfoBanner>
          ) : (
            <InfoBanner tone="error">
              {Object.keys(result.errors).length}개 항목에 에러가 있어요. 수정하면 에러가 바로
              갱신돼요.
            </InfoBanner>
          )}
          {!result.ok && <JsonBlock title="errors" data={result.errors} />}
          <JsonBlock title="values" data={result.values} />
        </div>
      )}
    </Demo>
  )
}

function Counter({ value, max }: { value: number; max: number }) {
  return (
    <Caption className={value > max ? 'text-error1 self-end' : 'self-end'}>
      {value}/{max}
    </Caption>
  )
}

function JsonBlock({ title, data }: { title: string; data: unknown }) {
  return (
    <div className="gap-stack-tight flex flex-col">
      <span className="text-body03 text-black0">{title}</span>
      <pre className="bg-gray1 text-caption02 text-gray7 p-space-12 overflow-x-auto rounded-sm">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  )
}

/* 'YYYY-MM-DDTHH:mm' ↔ 표시 문자열 (데모 전용) */
function parseLocal(value: string) {
  const [d, t] = value.split('T')
  const [y, m, day] = d.split('-').map(Number)
  const [h, min] = t.split(':').map(Number)
  return new Date(y, m - 1, day, h, min)
}

function toLocal(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function formatLocal(value: string) {
  if (!value) return { date: '선택', time: '선택' }
  const d = parseLocal(value)
  const pad = (n: number) => String(n).padStart(2, '0')
  const h = d.getHours()
  return {
    date: `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`,
    time: `${h < 12 ? '오전' : '오후'} ${h % 12 || 12}:${pad(d.getMinutes())}`,
  }
}

/** 비어 있으면 오늘 오후 4시에서 시작합니다. */
function shift(value: string, by: { days?: number; minutes?: number }) {
  const base = value ? parseLocal(value) : new Date(new Date().setHours(16, 0, 0, 0))
  if (!value) return toLocal(base)
  base.setDate(base.getDate() + (by.days ?? 0))
  base.setMinutes(base.getMinutes() + (by.minutes ?? 0))
  return toLocal(base)
}
