import { Link } from 'react-router'
import { Screen } from '@/layouts/screen'

export function NotFoundPage() {
  return (
    <Screen className="gap-space-16 items-center justify-center text-center">
      <p className="text-gray6 text-body05">페이지를 찾을 수 없어요.</p>
      <Link
        to="/"
        className="bg-black0 text-white0 px-space-20 text-head03 inline-flex h-11 items-center rounded-md"
      >
        홈으로
      </Link>
    </Screen>
  )
}
