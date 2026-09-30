import { Link } from 'react-router'

export function NotFoundPage() {
  return (
    <section className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-muted-foreground text-sm">페이지를 찾을 수 없어요.</p>
      <Link
        to="/"
        className="bg-primary text-primary-foreground inline-flex h-11 items-center rounded-md px-5 text-sm font-medium"
      >
        홈으로
      </Link>
    </section>
  )
}
