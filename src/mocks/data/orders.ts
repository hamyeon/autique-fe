import type { AuctionResult, AuctionResultType } from '@/api/schemas/auctions'
import type { BackupOffer, BackupOfferStatus } from '@/api/schemas/backup-offers'
import type { Order, OrderStatus } from '@/api/schemas/orders'
import { findAuction, toProductSummary } from '@/mocks/data/auctions'
import { DAY, HOUR, SHIPPING_FEE, fromNow, kst } from '@/mocks/data/common'

/* 낙찰 이후 흐름: 경매 결과 · 주문 · 차순위 제안 */

/* ───────── 주문 ───────── */

interface MockOrder {
  orderId: number
  auctionId: number
  status: OrderStatus
  purchasePrice: number
  paymentDeadline: number
  paidAt: number | null
}

export const orders: MockOrder[] = [
  // 경매 13 낙찰 · 결제 대기
  {
    orderId: 50,
    auctionId: 13,
    status: 'PAYMENT_PENDING',
    purchasePrice: 105000,
    paymentDeadline: fromNow(21 * HOUR),
    paidAt: null,
  },
  // 경매 16 낙찰 · 결제 기한 만료
  {
    orderId: 51,
    auctionId: 16,
    status: 'PAYMENT_EXPIRED',
    purchasePrice: 85000,
    paymentDeadline: fromNow(-2 * DAY),
    paidAt: null,
  },
]

let nextOrderId = 60

export function findOrder(orderId: number) {
  return orders.find((o) => o.orderId === orderId)
}

export function createOrder(auctionId: number, purchasePrice: number) {
  const order: MockOrder = {
    orderId: nextOrderId++,
    auctionId,
    status: 'PAYMENT_PENDING',
    purchasePrice,
    paymentDeadline: fromNow(24 * HOUR),
    paidAt: null,
  }
  orders.push(order)
  return order
}

export function toOrder(o: MockOrder): Order {
  const a = findAuction(o.auctionId)!
  return {
    orderId: o.orderId,
    auctionId: o.auctionId,
    status: o.status,
    product: toProductSummary(a),
    purchasePrice: o.purchasePrice,
    shippingFee: SHIPPING_FEE,
    totalAmount: o.purchasePrice + SHIPPING_FEE,
    paymentDeadline: kst(o.paymentDeadline),
    serverTime: kst(Date.now()),
    paidAt: o.paidAt ? kst(o.paidAt) : null,
  }
}

/* ───────── 차순위 제안 ───────── */

interface MockBackupOffer {
  backupOfferId: number
  auctionId: number
  status: BackupOfferStatus
  purchasePrice: number
  deadline: number
}

export const backupOffers: MockBackupOffer[] = [
  {
    backupOfferId: 90,
    auctionId: 15,
    status: 'WAITING',
    purchasePrice: 100000,
    deadline: fromNow(20 * HOUR),
  },
]

export function findBackupOffer(backupOfferId: number) {
  return backupOffers.find((o) => o.backupOfferId === backupOfferId)
}

export function toBackupOffer(o: MockBackupOffer): BackupOffer {
  const a = findAuction(o.auctionId)!
  const expired = o.status === 'WAITING' && o.deadline <= Date.now()
  return {
    backupOfferId: o.backupOfferId,
    auctionId: o.auctionId,
    status: expired ? 'EXPIRED' : o.status,
    product: toProductSummary(a),
    purchasePrice: o.purchasePrice,
    shippingFee: SHIPPING_FEE,
    totalAmount: o.purchasePrice + SHIPPING_FEE,
    deadline: kst(o.deadline),
    serverTime: kst(Date.now()),
  }
}

/* ───────── 경매 결과 ───────── */

/** 낙찰 포기 등으로 바뀐 내 결과 */
export const resultOverrides: Record<number, AuctionResultType> = {
  15: 'BACKUP_WAITING',
  16: 'PAYMENT_EXPIRED',
}

export function toResult(auctionId: number): AuctionResult | null {
  const a = findAuction(auctionId)
  if (!a) return null

  const finalPrice = a.bids[0]?.amount ?? null
  const myLast = a.bids.find((b) => b.isMine)
  // 같은 사람의 여러 입찰은 한 순위로 셉니다.
  const bidders = [...new Set(a.bids.map((b) => b.bidderMasked))]
  const rank = myLast ? bidders.indexOf(myLast.bidderMasked) + 1 : null

  const derived: AuctionResultType = !a.bids.length ? 'NO_BIDS' : a.bids[0].isMine ? 'WON' : 'LOST'
  const result = resultOverrides[auctionId] ?? derived

  const order = result === 'WON' ? orders.find((o) => o.auctionId === auctionId) : undefined
  const backupOffer =
    result === 'BACKUP_WAITING' ? backupOffers.find((o) => o.auctionId === auctionId) : undefined

  return {
    auctionId,
    result,
    product: toProductSummary(a),
    rank,
    finalPrice,
    myLastBidAmount: myLast?.amount ?? null,
    shippingFee: order ? SHIPPING_FEE : null,
    totalAmount: order ? order.purchasePrice + SHIPPING_FEE : null,
    paymentDeadline: order ? kst(order.paymentDeadline) : null,
    serverTime: kst(Date.now()),
    orderId: order?.orderId ?? null,
    backupOfferId: backupOffer?.backupOfferId ?? null,
    backupEligible: rank === 2,
  }
}
