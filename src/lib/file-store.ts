/*
 * 파일(Blob) 임시 저장소. IndexedDB에 넣어 새로고침해도 남게 합니다.
 * 경매 등록 1/6에서 고른 사진은 '다음'(분석 요청)을 누를 때 업로드되므로, 그 전까지 여기에 둡니다.
 * 앱으로 감쌀 때 Capacitor Filesystem 등으로 바꿀 수 있도록 이 파일 안에서만 IndexedDB를 씁니다.
 * IndexedDB를 쓸 수 없는 환경(일부 사생활 보호 모드)에서는 저장을 건너뛰고 null을 돌려줍니다.
 */

const DB_NAME = 'autique-files'
/** 문자열 key 범위의 끝(prefix로 시작하는 key를 모두 고를 때) */
const LAST_CHAR = String.fromCharCode(0xffff)
const STORE = 'files'

let dbPromise: Promise<IDBDatabase | null> | null = null

function openDb() {
  dbPromise ??= new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB_NAME, 1)
      req.onupgradeneeded = () => req.result.createObjectStore(STORE)
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => resolve(null)
    } catch {
      resolve(null)
    }
  })
  return dbPromise
}

function run<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>) {
  return openDb().then(
    (db) =>
      new Promise<T | null>((resolve) => {
        if (!db) return resolve(null)
        try {
          const req = action(db.transaction(STORE, mode).objectStore(STORE))
          req.onsuccess = () => resolve(req.result)
          req.onerror = () => resolve(null)
        } catch {
          resolve(null)
        }
      }),
  )
}

export function saveFile(key: string, file: Blob) {
  return run('readwrite', (store) => store.put(file, key))
}

export async function loadFile(key: string) {
  const value = await run<unknown>('readonly', (store) => store.get(key))
  return value instanceof Blob ? value : null
}

export function deleteFile(key: string) {
  return run('readwrite', (store) => store.delete(key))
}

/** key가 prefix로 시작하는 파일을 모두 지웁니다. */
export function deleteFiles(prefix: string) {
  return run('readwrite', (store) => store.delete(IDBKeyRange.bound(prefix, prefix + LAST_CHAR)))
}
