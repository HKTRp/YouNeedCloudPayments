const cloudPayments = require('cloudpayments');

class Payments {

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

    /*
     * First step in card linkage.
     * In return you'll get TransactionId, PaReq and AcsUrl for 3DSecure verification
     */
    linkCardPayment(crypto, ip, userId, handle) {
        this.payerApi.chargeCryptogramPayment({
            Amount: 1,
            IpAddress: ip,
            CardCryptogramPacket: crypto,
            AccountId: userId
        }).then((response) => {
            response = response.getResponse();
            if (response["Success"]) {
                handle({
                    Success: true,
                    token: response["Model"]["Token"]
                });
                return;
            }
            if (!response["Model"]) {
                throw {
                    error: response["Message"]
                }
            }
            handle({
                Success: false,
                MD: response['Model']['TransactionId'],
                PaReq: response['Model']['PaReq'],
                AcsUrl: response['Model']['AcsUrl']
            })
        }).catch((e) => {
            console.log(e);
            throw e;
        });
    }

    /*
    * Second and the last step in card linkage.
    * In return you'll get payment token of given at last step card.
    */
    linkCardThreeDS(PaRes, MD, handle) {
        this.payerApi.confirm3DSPayment({PaRes, TransactionId: MD}).then((response) => {
            response = response.getResponse();
            if (!response["Success"]) {
                throw {
                    error: response["Message"]
                }
            }
            handle(response);
        }).catch((e) => {
            console.log(e);
            throw e;
        });
    }

    /*
    * Make payment by token. If accumulationId specified then makes payment at specific accumulation.
    * Creates new accumulation otherwise.
    * */
    payment(token, amount, accountId, accumulationId, handle) {
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
            response = response.getResponse();
            handle(response);
        }).catch((e) => {
            console.log(e);
            throw e;
        })
    }

    /*
    * Close the deal and make payout for given token by given transactions.
    * */
    payout(token, userId, accumulationId, amount, transactions, handle) {
        transactions = JSON.parse(transactions);
        console.log(token, userId, accumulationId, amount, transactions);
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
                response = response.getResponse();
                console.log(response);
                handle(response);
            }
        ).catch((e) => {
            console.log(e);
            throw e;
        });
    }
}

exports.payment = Payments;