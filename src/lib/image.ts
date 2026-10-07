/*
 * 업로드 전 이미지 줄이기. 브라우저 canvas로 긴 변을 줄이고 JPEG로 다시 저장합니다.
 * 앱으로 감쌀 때 네이티브 리사이즈로 바꿀 수 있도록 이 파일 안에서만 canvas를 씁니다.
 */

/** 긴 변 최대 길이(px). 명세 용량 제한(파일당 50MB · 요청 100MB)보다 훨씬 작게 나옵니다. */
export const MAX_IMAGE_EDGE = 2048
const JPEG_QUALITY = 0.85

export class ImageDecodeError extends Error {
  constructor() {
    super('이미지를 읽을 수 없습니다.')
    this.name = 'ImageDecodeError'
  }
}

/** 사진 방향(EXIF)을 반영해 읽습니다. createImageBitmap이 없으면 <img>로 읽습니다. */
async function decode(
  file: Blob,
): Promise<{ source: CanvasImageSource; width: number; height: number; close: () => void }> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        close: () => bitmap.close(),
      }
    } catch {
      /* 아래 <img>로 다시 시도 */
    }
  }
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    return { source: img, width: img.naturalWidth, height: img.naturalHeight, close: () => {} }
  } catch {
    throw new ImageDecodeError()
  } finally {
    URL.revokeObjectURL(url)
  }
}

/**
 * 긴 변이 maxEdge를 넘으면 비율대로 줄이고, 크기와 관계없이 JPEG로 다시 저장합니다.
 * 브라우저가 읽지 못하는 형식(예: 일부 브라우저의 HEIC)이면 ImageDecodeError를 던집니다.
 */
export async function toUploadJpeg(file: File, maxEdge = MAX_IMAGE_EDGE): Promise<File> {
  const { source, width, height, close } = await decode(file)
  try {
    const scale = Math.min(1, maxEdge / Math.max(width, height))
    const w = Math.max(1, Math.round(width * scale))
    const h = Math.max(1, Math.round(height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new ImageDecodeError()
    // JPEG는 투명도가 없어 흰 바탕을 깝니다(투명 PNG가 검게 나오지 않도록).
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, w, h)
    ctx.drawImage(source, 0, 0, w, h)
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY),
    )
    if (!blob) throw new ImageDecodeError()
    const name = file.name.replace(/\.[^.]+$/, '') + '.jpg'
    return new File([blob], name, { type: 'image/jpeg', lastModified: Date.now() })
  } finally {
    close()
  }
}
