import { auctionHandlers } from '@/mocks/handlers/auctions'
import { authHandlers } from '@/mocks/handlers/auth'
import { autoBidHandlers } from '@/mocks/handlers/auto-bids'
import { backupOfferHandlers } from '@/mocks/handlers/backup-offers'
import { meHandlers } from '@/mocks/handlers/me'
import { notificationHandlers } from '@/mocks/handlers/notifications'
import { orderHandlers } from '@/mocks/handlers/orders'
import { productHandlers } from '@/mocks/handlers/products'
import { purchaseGoalHandlers } from '@/mocks/handlers/purchase-goals'

/** 명세의 모든 엔드포인트. 명세에 없는 엔드포인트가 생기면 assumed/에 두고 여기에 더합니다. */
export const handlers = [
  ...authHandlers,
  ...productHandlers,
  ...auctionHandlers,
  ...autoBidHandlers,
  ...orderHandlers,
  ...meHandlers,
  ...backupOfferHandlers,
  ...notificationHandlers,
  ...purchaseGoalHandlers,
]
