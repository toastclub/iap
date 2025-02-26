// Copyright (c) 2023 Apple Inc. Licensed under MIT License.

/**
 * The type of in-app purchase products you can offer in your app.
 *
 * {@link https://developer.apple.com/documentation/appstoreserverapi/type type}
 */
export enum Type {
  AUTO_RENEWABLE_SUBSCRIPTION = "Auto-Renewable Subscription",
  NON_CONSUMABLE = "Non-Consumable",
  CONSUMABLE = "Consumable",
  NON_RENEWING_SUBSCRIPTION = "Non-Renewing Subscription",
}

/**
 * The cause of a purchase transaction, which indicates whether it’s a customer’s purchase or a renewal for an auto-renewable subscription that the system initiates.
 *
 * {@link https://developer.apple.com/documentation/appstoreserverapi/transactionreason transactionReason}
 */
export enum TransactionReason {
  PURCHASE = "PURCHASE",
  RENEWAL = "RENEWAL",
}

/**
 * The reason for a refunded transaction.
 *
 * {@link https://developer.apple.com/documentation/appstoreserverapi/revocationreason revocationReason}
 */
export enum RevocationReason {
  REFUNDED_DUE_TO_ISSUE = 1,
  REFUNDED_FOR_OTHER_REASON = 0,
}

/**
 * The type of subscription offer.
 *
 * {@link https://developer.apple.com/documentation/appstoreserverapi/offertype offerType}
 */
export enum OfferType {
  INTRODUCTORY_OFFER = 1,
  PROMOTIONAL_OFFER = 2,
  SUBSCRIPTION_OFFER_CODE = 3,
  WIN_BACK_OFFER = 4,
}

/**
 * The payment mode you configure for an introductory offer, promotional offer, or offer code on an auto-renewable subscription.
 *
 * {@link https://developer.apple.com/documentation/appstoreserverapi/offerdiscounttype offerDiscountType}
 */
export enum OfferDiscountType {
  FREE_TRIAL = "FREE_TRIAL",
  PAY_AS_YOU_GO = "PAY_AS_YOU_GO",
  PAY_UP_FRONT = "PAY_UP_FRONT",
}

/**
 * The relationship of the user with the family-shared purchase to which they have access.
 *
 * {@link https://developer.apple.com/documentation/appstoreserverapi/inappownershiptype inAppOwnershipType}
 */
export enum InAppOwnershipType {
  FAMILY_SHARED = "FAMILY_SHARED",
  PURCHASED = "PURCHASED",
}

/**
 * The server environment, either sandbox or production.
 *
 * {@link https://developer.apple.com/documentation/appstoreserverapi/environment environment}
 */
export enum Environment {
  SANDBOX = "Sandbox",
  PRODUCTION = "Production",
  XCODE = "Xcode",
  LOCAL_TESTING = "LocalTesting", // Used for unit testing
}

export interface DecodedSignedData {
  signedDate?: number;
}
