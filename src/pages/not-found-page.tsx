import { Link } from 'react-router'

export function NotFoundPage() {
  return (
    <section className="gap-space-16 px-layout-gutter flex min-h-dvh flex-col items-center justify-center text-center">
      <p className="text-muted-foreground text-body05">페이지를 찾을 수 없어요.</p>
      <Link
        to="/"
        className="bg-primary text-primary-foreground px-space-20 text-head03 inline-flex h-11 items-center rounded-md"
      >
        홈으로
      </Link>
    </section>
  )
}
