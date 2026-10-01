import type { ComponentProps } from 'react'
import { Drawer as DrawerPrimitive } from 'vaul'
import { cn } from '@/lib/utils'

/*
 * shadcn drawer(vaul)에서 동작만 남긴 얇은 래퍼. 겉모양은 DS BottomSheet가 입힙니다.
 * 아래 방향만 쓰므로 다른 방향용 기본 클래스는 지웠습니다.
 */

function Drawer(props: ComponentProps<typeof DrawerPrimitive.Root>) {
  return <DrawerPrimitive.Root data-slot="drawer" {...props} />
}

function DrawerTrigger(props: ComponentProps<typeof DrawerPrimitive.Trigger>) {
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />
}

function DrawerClose(props: ComponentProps<typeof DrawerPrimitive.Close>) {
  return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />
}

function DrawerOverlay({ className, ...props }: ComponentProps<typeof DrawerPrimitive.Overlay>) {
  return (
    <DrawerPrimitive.Overlay
      data-slot="drawer-overlay"
      className={cn('fixed inset-0 z-50', className)}
      {...props}
    />
  )
}

/** 포털 + 딤 + 아래에서 올라오는 내용. 딤 클래스는 overlayClassName으로 받습니다. */
function DrawerContent({
  className,
  overlayClassName,
  ...props
}: ComponentProps<typeof DrawerPrimitive.Content> & { overlayClassName?: string }) {
  return (
    <DrawerPrimitive.Portal data-slot="drawer-portal">
      <DrawerOverlay className={overlayClassName} />
      <DrawerPrimitive.Content
        data-slot="drawer-content"
        className={cn('fixed inset-x-0 bottom-0 z-50 flex flex-col', className)}
        {...props}
      />
    </DrawerPrimitive.Portal>
  )
}

function DrawerTitle(props: ComponentProps<typeof DrawerPrimitive.Title>) {
  return <DrawerPrimitive.Title data-slot="drawer-title" {...props} />
}

function DrawerDescription(props: ComponentProps<typeof DrawerPrimitive.Description>) {
  return <DrawerPrimitive.Description data-slot="drawer-description" {...props} />
}

export {
  Drawer,
  DrawerTrigger,
  DrawerClose,
  DrawerOverlay,
  DrawerContent,
  DrawerTitle,
  DrawerDescription,
}
