import { fromBER } from "asn1js";
import type { IAPReceiptOptions } from ".";

export interface IAPReceipt {
  quantity?: number;
  productIdentifier?: string;
  transactionIdentifier?: string;
  originalTransactionIdentifier?: string;
  purchaseDate?: Date;
  originalPurchaseDate?: Date;
  subscriptionExpirationDate?: Date | null;
  subscriptionIntroductoryPricePeriod?: number;
  cancellationDate?: Date | null;
  webOrderLineItemID?: number;
  remaining?: any[];
}

function nullableDate(value: Date | null) {
  // if `Invalid Date` or `null`, return `null`
  if (!value || isNaN(value.getTime())) {
    return null;
  }
  return value;
}

function parseInAppPurchaseReceipt(attributes, options: IAPReceiptOptions) {
  const receipt: IAPReceipt = { remaining: [] };

  const handlers: Record<number, (value: any) => void> = {
    1701: (value) => (receipt.quantity = value.valueDec),
    1702: (value) => (receipt.productIdentifier = value.value),
    1703: (value) => (receipt.transactionIdentifier = value.value),
    1705: (value) => (receipt.originalTransactionIdentifier = value.value),
    1704: (value) => (receipt.purchaseDate = new Date(value.value)),
    1706: (value) => (receipt.originalPurchaseDate = new Date(value.value)),
    1708: (value) =>
      (receipt.subscriptionExpirationDate = nullableDate(
        new Date(value.value)
      )),
    1719: (value) =>
      (receipt.subscriptionIntroductoryPricePeriod = value.valueDec),
    1712: (value) =>
      (receipt.cancellationDate = nullableDate(
        nullableDate(new Date(value.value))
      )),
    1711: (value) => (receipt.webOrderLineItemID = value.valueDec),
  };

  if (options.returnRemaining) {
    receipt.remaining = [];
  }
  for (const attr of attributes) {
    let block = (n: number) => attr.valueBlock.value[n].valueBlock;
    let value = block(2).value[0].valueBlock;
    let attributeId = block(0).valueDec;

    if (handlers[attributeId]) {
      handlers[attributeId](value);
    } else if (options.returnRemaining) {
      receipt.remaining!.push(attr);
    }
  }

  return receipt;
}

export interface AppReceipt {
  /**
   * The app bundle identifier.
   */
  bundleIdentifier?: string;
  /**
   * The app version identifier.
   */
  appVersion?: string;
  /**
   * An opaque value used, with other data, to compute the SHA-1 hash during validation.
   */
  opaqueValue?: any;
  /**
   * The SHA-1 hash, which is used to validate the receipt.
   */
  sha1Hash?: string;
  /**
   * An array of in-app purchase receipts.
   *
   * The in-app purchase receipt for a consumable product is added to the receipt
   * when the purchase is made. It is kept in the receipt until your app finishes
   * that transaction. After that point, it is removed from the receipt the next
   * time the receipt is updated - for example, when the user makes another purchase
   * or if your app explicitly refreshes the receipt.
   *
   * The in-app purchase receipt for a non-consumable product, auto-renewable
   * subscription, non-renewing subscription, or free subscription remains in the
   * receipt indefinitely.
   */
  inAppPurchaseReceipts: IAPReceipt[];
  /**
   * The version of the app that was originally purchased.
   */
  originalApplicationVersion?: string;
  /**
   * The date that the app receipt was created.
   */
  receiptCreationDate?: Date;
  /**
   * The date that the app receipt expires.
   */
  receiptExpirationDate?: Date;
  /**
   * Any remaining attributes that were not parsed.
   *
   * Keys not documented are reserved for use by Apple and must be ignored by your app.
   */
  remaining?: any[];
}

function parseAppReceipt(attributes, options: IAPReceiptOptions) {
  const receipt: AppReceipt = { inAppPurchaseReceipts: [], remaining: [] };

  const handlers: Record<number, (value: any) => void> = {
    2: (value) => (receipt.bundleIdentifier = value.value[0].valueBlock.value),
    3: (value) => (receipt.appVersion = value.value[0].valueBlock.value),
    4: (value) =>
      (receipt.opaqueValue = Buffer.from(value.valueHex).toString("hex")),
    5: (value) =>
      (receipt.sha1Hash = Buffer.from(value.valueHex).toString("hex")),
    17: (value) => {
      const result = fromBER(new Uint8Array(value.valueHex).buffer);
      if (result.offset !== -1) {
        let iapAttributes = result.result.valueBlock.value;
        const iap = parseInAppPurchaseReceipt(iapAttributes, options);
        receipt.inAppPurchaseReceipts.push(iap);
      }
    },
    19: (value) =>
      (receipt.originalApplicationVersion = value.value[0].valueBlock.value),
    12: (value) =>
      (receipt.receiptCreationDate = new Date(value.value[0].valueBlock.value)),
    21: (value) =>
      (receipt.receiptExpirationDate = new Date(
        value.value[0].valueBlock.value
      )),
  };

  if (options.returnRemaining) {
    receipt.remaining = [];
  }
  for (const attr of attributes) {
    let block = (n: number) => attr.valueBlock.value[n].valueBlock;
    let attributeId = block(0).valueDec;
    let value = block(2);

    if (handlers[attributeId]) {
      handlers[attributeId](value);
    } else if (options.returnRemaining) {
      receipt.remaining!.push(attr);
    }
  }

  return receipt;
}

export { parseInAppPurchaseReceipt, parseAppReceipt };
