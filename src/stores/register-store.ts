import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { PhotoSlot, RegisterDraft, RegisterStep } from '@/features/register/schemas'
import { REGISTER_STEPS, STEP_SCHEMAS } from '@/features/register/schemas'
import { deleteFile, deleteFiles, loadFile, saveFile } from '@/lib/file-store'
import { sessionAppStorage } from '@/lib/storage'

export interface AnalysisTask {
  /** 분석 세션 ID(= 폴링의 taskId) */
  id: number
  /** 접수 시각(ms). 최대 대기 시간과 시간 기준 로딩 단계를 여기서부터 잽니다. */
  startedAt: number
}

/** IndexedDB에 사진을 넣는 key 앞부분 */
const PHOTO_KEY = 'register-photo:'

interface RegisterState {
  /** 단계마다 모은 입력값 */
  draft: RegisterDraft
  /** '다음'으로 끝낸 단계 */
  completed: RegisterStep[]
  /** 6/6(정보 확인)에 한 번이라도 들어왔는지. 그 뒤로는 고친 단계에서 '다음'을 누르면 남은 미완료 단계만 거쳐 6/6으로 돌아갑니다. */
  reviewed: boolean
  /**
   * 진행 중인 AI 분석 작업(POST /api/products/analyze가 돌려준 analysisId)과 접수 시각.
   * 분석 화면에서 새로고침 · 나갔다 와도 같은 작업을 이어서 기다리려고 저장합니다. 분석이 끝나면 draft.analysisId로 옮기고 비웁니다.
   */
  analysisTask: AnalysisTask | null
  /**
   * 가격 계산에 이미 쓴 분석 세션 ID. 명세상 세션당 1회만 계산할 수 있어(이후 40003),
   * 같은 세션으로 다시 계산해야 하면 같은 사진으로 새 분석 세션을 만듭니다(src/features/register/pricing.ts).
   */
  pricedAnalysisId: number | null
  /** 등록 성공 후 완료 화면으로 가려고 기록을 되돌리는 중(저장하지 않음) */
  completing: boolean
  /** 값만 바꿉니다(완료 표시는 그대로). */
  update: (patch: Partial<RegisterDraft>) => void
  /** 값을 합치고 그 단계 스키마를 통과하면 완료로 표시합니다. 통과 여부를 돌려줍니다. */
  completeStep: (step: RegisterStep, patch?: Partial<RegisterDraft>) => boolean
  /** 이 단계부터 뒤의 완료 표시를 지웁니다. */
  resetFrom: (step: RegisterStep) => void
  /** 이 단계 하나만 완료 표시를 지웁니다(값은 그대로, 다시 확인받을 때). */
  uncompleteStep: (step: RegisterStep) => void
  markReviewed: () => void
  setAnalysisTask: (task: AnalysisTask | null) => void
  setCompleting: (completing: boolean) => void
  setPricedAnalysisId: (id: number | null) => void
  /** 사진을 바꾸면 분석부터 다시 합니다(사용자 결정). 파일은 IndexedDB, 정보만 스토어에 */
  setPhoto: (slot: PhotoSlot, file: File) => Promise<void>
  removePhoto: (slot: PhotoSlot) => Promise<void>
  loadPhoto: (slot: PhotoSlot) => Promise<Blob | null>
  /** 등록 완료 · 등록 취소 시 모두 비웁니다(사진 파일 포함). */
  reset: () => Promise<void>
}

/** 사진이 바뀌면 분석 세션 · 가격 계산 결과는 더 쓸 수 없어 함께 지웁니다. */
const STALE_AFTER_PHOTO_CHANGE: (keyof RegisterDraft)[] = ['analysisId', 'priceResult']

export const useRegisterStore = create<RegisterState>()(
  persist(
    (set, get) => ({
      draft: {},
      completed: [],
      reviewed: false,
      analysisTask: null,
      completing: false,
      pricedAnalysisId: null,

      update: (patch) => set((s) => ({ draft: { ...s.draft, ...patch } })),

      completeStep: (step, patch = {}) => {
        const draft = { ...get().draft, ...patch }
        const ok = STEP_SCHEMAS[step].safeParse(draft).success
        set((s) => ({
          draft,
          completed: ok && !s.completed.includes(step) ? [...s.completed, step] : s.completed,
        }))
        return ok
      },

      resetFrom: (step) => {
        const later = REGISTER_STEPS.slice(REGISTER_STEPS.indexOf(step))
        set((s) => ({ completed: s.completed.filter((c) => !later.includes(c)) }))
      },

      uncompleteStep: (step) => set((s) => ({ completed: s.completed.filter((c) => c !== step) })),

      markReviewed: () => set({ reviewed: true }),

      setAnalysisTask: (analysisTask) => set({ analysisTask }),

      setCompleting: (completing) => set({ completing }),

      setPricedAnalysisId: (pricedAnalysisId) => set({ pricedAnalysisId }),

      setPhoto: async (slot, file) => {
        await saveFile(PHOTO_KEY + slot, file)
        const draft = { ...get().draft }
        for (const key of STALE_AFTER_PHOTO_CHANGE) delete draft[key]
        draft.photos = {
          ...draft.photos,
          [slot]: { name: file.name, type: file.type, size: file.size },
        } as RegisterDraft['photos']
        set({ draft, analysisTask: null })
        get().resetFrom('1')
      },

      removePhoto: async (slot) => {
        await deleteFile(PHOTO_KEY + slot)
        const draft = { ...get().draft }
        for (const key of STALE_AFTER_PHOTO_CHANGE) delete draft[key]
        const photos = { ...draft.photos }
        delete photos[slot]
        draft.photos = photos as RegisterDraft['photos']
        set({ draft, analysisTask: null })
        get().resetFrom('1')
      },

      loadPhoto: (slot) => loadFile(PHOTO_KEY + slot),

      reset: async () => {
        set({
          draft: {},
          completed: [],
          reviewed: false,
          analysisTask: null,
          pricedAnalysisId: null,
        })
        await deleteFiles(PHOTO_KEY)
      },
    }),
    {
      // 새로고침에는 남고, 탭(앱 세션)을 닫으면 사라집니다.
      name: 'autique-register-draft',
      storage: createJSONStorage(() => sessionAppStorage),
      partialize: ({ draft, completed, reviewed, analysisTask, pricedAnalysisId }) => ({
        draft,
        completed,
        reviewed,
        analysisTask,
        pricedAnalysisId,
      }),
    },
  ),
)

/** 작성 중인 내용이 있는지(나가기 확인용) */
export function selectIsDirty(state: Pick<RegisterState, 'draft' | 'completed'>) {
  return state.completed.length > 0 || Object.keys(state.draft).length > 0
}
