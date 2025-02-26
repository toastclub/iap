// Copyright (c) 2023 Apple Inc. Licensed under MIT License.

import { Environment } from "./Shared";

/**
 * Information that represents the customer’s purchase of the app, cryptographically signed by the App Store.
 *
 * {@link https://developer.apple.com/documentation/storekit/apptransaction AppTransaction}
 */
export interface AppTransaction {
  /**
   * The server environment that signs the app transaction.
   *
   * {@link https://developer.apple.com/documentation/storekit/apptransaction/3963901-environment environment}
   */
  receiptType?: Environment | string;

  /**
   * The unique identifier the App Store uses to identify the app.
   *
   * {@link https://developer.apple.com/documentation/storekit/apptransaction/3954436-appid appId}
   */
  appAppleId?: number;

  /**
   * The bundle identifier that the app transaction applies to.
   *
   * {@link https://developer.apple.com/documentation/storekit/apptransaction/3954439-bundleid bundleId}
   */
  bundleId?: string;

  /**
   * The app version that the app transaction applies to.
   *
   * {@link https://developer.apple.com/documentation/storekit/apptransaction/3954437-appversion appVersion}
   */
  applicationVersion?: string;

  /**
   * The version external identifier of the app
   *
   * {@link https://developer.apple.com/documentation/storekit/apptransaction/3954438-appversionid appVersionID}
   */
  versionExternalIdentifier?: number;

  /**
   * The date that the App Store signed the JWS app transaction.
   *
   * {@link https://developer.apple.com/documentation/storekit/apptransaction/3954449-signeddate signedDate}
   */
  receiptCreationDate?: number;

  /**
   * The date the user originally purchased the app from the App Store.
   *
   * {@link https://developer.apple.com/documentation/storekit/apptransaction/3954448-originalpurchasedate originalPurchaseDate}
   */
  originalPurchaseDate?: number;

  /**
   * The app version that the user originally purchased from the App Store.
   *
   * {@link https://developer.apple.com/documentation/storekit/apptransaction/3954447-originalappversion originalAppVersion}
   */
  originalApplicationVersion?: string;

  /**
    The Base64 device verification value to use to verify whether the app transaction belongs to the device.

    {@link https://developer.apple.com/documentation/storekit/apptransaction/3954441-deviceverification deviceVerification}
    */
  deviceVerification?: string;

  /**
   * The UUID used to compute the device verification value.
   *
   * {@link https://developer.apple.com/documentation/storekit/apptransaction/3954442-deviceverificationnonce deviceVerificationNonce}
   */
  deviceVerificationNonce?: string;

  /**
   * The date the customer placed an order for the app before it’s available in the App Store.
   *
   * {@link https://developer.apple.com/documentation/storekit/apptransaction/4013175-preorderdate preorderDate}
   */
  preorderDate?: number;
}
