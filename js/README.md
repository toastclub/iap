# iap.js

A JavaScript library to validate in-app purchases made on Apple and ~~Android~~.

- Apple verification endpoints do _not_ make external network requests.
- It is WinterTC compatible, meaning it can be used in all JavaScript runtimes, not just node.
- Very lightweight

## Usage

### Apple

There are two methods to verify Apple receipts: [`receipt`](https://developer.apple.com/documentation/appstorereceipts/validating_receipts_on_the_device) and [`transaction`](https://medium.com/@ronaldmannak/how-to-validate-ios-and-macos-in-app-purchases-using-storekit-2-and-server-side-swift-98626641d3ea). They are roughly equivalent, but `transaction` is newer and likely a better choice.

In both cases, the basic flow is as follows:

1. Get the receipt from the user's device.
2. Send the receipt to the server for requests that should be authenticated.
3. Call the appropriate verification function. The function handles the following:
   - Parsing the receipt
   - Verifying the signature. At best, we can prove that the receipt was signed by Apple. The library cannot attest that the receipt is not being covertly shared between users.
4. It is your responsibility to check the receipt's contents.
   - Check that the receipt is for the correct product.
   - Check that the receipt is not expired for subscriptions.

#### Receipt

Safeguarding against replay attacks is very difficult. Receipts are only generated at very infrequent intervals (e.g. when a subscription renews).

```javascript
import { parseReceipt as parseApple } from "iap.js/apple/receipt";
let result = await parseApple(receipt, options).catch((err) => {
  // throws an error if the receipt is invalid
});
console.log(result.bundleIdentifier);
```

Please see the type definitions for `IAPReceiptOptions` for options.

Here are some common errors that the function may throw:

- `Signature verification failed`: The signature did not pass verification. This could be due to a malformed receipt or a malicious actor.
- `Failed to parse certificate ASN.1 structure`: This should never happen. If it does, please open an issue.
- `Failed to parse receipt ASN.1 structure`: The receipt is malformed. This could potentially be due to a bug.

#### Transaction

The transaction parser is an attempt at a faithful recreation of [app-store-server-library-node](https://github.com/apple/app-store-server-library-node/blob/1662832f6119e386da4bf1191230fe88baa27189/jws_verification.ts), using webcrypto instead of node's crypto.

unlike `app-store-server-library-node`, the library checks that Apple signed the receipt, but it does not check that the receipt is structured correctly.
