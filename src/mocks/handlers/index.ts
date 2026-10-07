import { assumedAuctionHandlers } from '@/mocks/handlers/assumed/auctions'
import { auctionHandlers } from '@/mocks/handlers/auctions'
import { authHandlers } from '@/mocks/handlers/auth'
import { autoBidHandlers } from '@/mocks/handlers/auto-bids'
import { backupOfferHandlers } from '@/mocks/handlers/backup-offers'
import { meHandlers } from '@/mocks/handlers/me'
import { notificationHandlers } from '@/mocks/handlers/notifications'
import { orderHandlers } from '@/mocks/handlers/orders'
import { productHandlers } from '@/mocks/handlers/products'

/** 명세의 모든 엔드포인트 + 명세에 없어서 만든 엔드포인트(assumed/) */
export const handlers = [
  ...authHandlers,
  ...productHandlers,
  ...auctionHandlers,
  ...autoBidHandlers,
  ...orderHandlers,
  ...meHandlers,
  ...backupOfferHandlers,
  ...notificationHandlers,
  ...assumedAuctionHandlers,
]
