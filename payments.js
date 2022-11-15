const cloudPayments = require('cloudpayments');

class PaymentsService {

    constructor(private_key_payer, public_key_payer, private_key_recipient, public_key_recipient) {
        this.payerApi = new cloudPayments.ClientService({
            privateKey: private_key_payer,
            publicId: public_key_payer
        }).getClientApi();
        this.recipientApi = new cloudPayments.ClientService({
            privateKey: private_key_recipient,
            publicId: public_key_recipient
        }).getClientApi();
    }

    _default_handle(response, resolve) {
        response = response.getResponse();
        if (!response["Success"]) {
            throw response;
        }
        resolve(response["Model"]);
    }

    /*
     * First step in card linkage.
     * In return you'll get TransactionId, PaReq and AcsUrl for 3DSecure verification
     */
    linkCardPayment(crypto, ip, userId) {
        return new Promise((resolve, reject) => {
            this.payerApi.chargeCryptogramPayment({
                Amount: 1,
                IpAddress: ip,
                CardCryptogramPacket: crypto,
                AccountId: userId
            }).then((response) => {
                response = response.getResponse();
                if (response["Success"]) {
                    resolve({
                        Success: true,
                        token: response["Model"]["Token"]
                    });
                    return;
                }
                if (!response["Model"]) {
                    reject({
                        error: response["Message"]
                    });
                }
                resolve({
                    Success: false,
                    MD: response['Model']['TransactionId'],
                    PaReq: response['Model']['PaReq'],
                    AcsUrl: response['Model']['AcsUrl']
                })
            }).catch((e) => {
                reject(e);
            })
        });
    }

    /*
    * Second and the last step in card linkage.
    * In return you'll get payment token of given at last step card.
    */
    linkCardThreeDS(PaRes, MD) {
        return new Promise((resolve, reject) => {
            this.payerApi.confirm3DSPayment({PaRes, TransactionId: MD}).then((response) => {
                this._default_handle(response, resolve);
            }).catch((e) => {
                reject(e);
            })
        });
    }

    /*
    * Make payment by token. If accumulationId specified then makes payment at specific accumulation.
    * Creates new accumulation otherwise.
    * */
    payment(token, amount, accountId, accumulationId) {
        return new Promise((resolve, reject) => {
            let escrow;
            if (accumulationId) {
                escrow = {
                    StartAccumulation: false,
                    AccumulationId: accumulationId
                }
            } else {
                escrow = {StartAccumulation: true}
            }
            this.payerApi.chargeTokenPayment({
                AccountId: accountId,
                Token: token,
                Amount: amount,
                JsonData: {
                    Cloudpayments: {
                        Escrow: escrow
                    }
                }
            }).then((response) => {
                this._default_handle(response, resolve);
            }).catch((e) => {
                console.log("Error while paying: ", e);
                reject(e);
            })
        });
    }

    /*
    * Close the deal and make payout for given token by given transactions.
    * */
    payout(token, userId, accumulationId, amount, transactions) {
        return new Promise((resolve, reject) => {
            transactions = JSON.parse(transactions);
            this.recipientApi.chargeTokenPayout({
                Token: token,
                Amount: amount,
                AccountId: userId,
                JsonData: {
                    Cloudpayments: {
                        Escrow: {
                            AccumulationId: accumulationId,
                            TransactionIds: transactions
                        }
                    }
                }
            }).then(
                (response) => {
                    this._default_handle(response, resolve);
                }
            ).catch((e) => {
                console.log("Error while payout:", e);
                reject(e);
            });
        });
    }
}

exports.payment = PaymentsService;