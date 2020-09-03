const axios = require('axios').default;
const config = require('../../config/config.js');
/**
 * Created for the MX Merchant API for Auth Only transaction
 * https://developer.mxmerchant.com/docs/making-an-authonly-transaction-and-completing-the-sale
 */

class PaymentHandler {
  constructor() {
    this.mx = config.mx;
    const buff = Buffer.from(`${this.mx.consumerKey}:${this.mx.consumerSecret}`, 'utf-8');
    this.auth = buff.toString('base64');
  }
  /**
   * Sends payment info to the MX Merchant API as authOnly, returns response from API
   * @param {object} payData - { amount, number, expiryMonth, expiryYear, cvv, avsZip, avsStreet }
   * @return {object|error}
   */
  authorizePayment(payData) {
    if (payData === {}) return new Error('Empty Payment Info');
    return axios({
      method: 'POST',
      url: 'https://sandbox.api.mxmerchant.com/checkout/v3/payment',
      headers: {
        Authorization: `Basic ${this.auth}`,
        'content-type': 'application/json'
      },
      params: {
        echo: 'true'
      },
      data: {
        merchantId: this.mx.merchantId,
        tenderType: 'Card',
        amount: payData.amount,
        authOnly: true,
        cardAccount: {
          number: payData.cardNumber,
          expiryMonth: payData.expiryMonth,
          expiryYear: payData.expiryYear,
          cvv: payData.cvv,
          avsZip: payData.avsZip,
          avsStreet: payData.avsStreet
        }
      },
      responseType: 'json'
    })
    .then(res => res.data)
    .catch(error => error);
  }
  finalizePayment(finData) {
    if (finData === {}) return new Error('Empty Payment Info');
    return axios({
      method: 'POST',
      url: 'https://sandbox.api.mxmerchant.com/checkout/v3/payment',
      headers: {
        Authorization: `Basic ${this.auth}`,
        'content-type': 'application/json'
      },
      params: {
        echo: 'true'
      },
      data: {
        merchantId: this.mx.merchantId,
        tenderType: 'Card',
        amount: finData.amount,
        authOnly: false,
        paymentToken: finData.paymentToken,
        authCode: finData.authCode
      },
      responseType: 'json'
    })
    .then(res => res.data)
    .catch(error => new Error(error));
  }
  refundPartial(payData) {
    if (payData === {}) return new Error('Empty Payment Data');
    var data = {
      merchantId: this.mx.merchantId,
      tenderType: 'Card',
      amount: payData.amount
    }
    if (payData.paymentToken) data.paymentToken = payData.paymentToken;
    if (payData.cardNumber) data.cardAccount = {
      number: payData.cardNumber,
      expiryMonth: payData.expiryMonth,
      expiryYear: payData.expiryYear,
      cvv: payData.cvv,
      avsZip: payData.avsZip,
      avsStreet: payData.avsStreet
    };
    return axios({
      method: 'POST',
      url: 'https://sandbox.api.mxmerchant.com/checkout/v3/payment',
      headers: {
        Authorization: `Basic ${this.auth}`,
        'content-type': 'application/json'
      },
      params: {
        echo: 'true'
      },
      data,
      responseType: 'json'
    })
    .then(res => res.data)
    .catch(error => error);
  }
  refundFull(paymentId) {
    if (paymentId === undefined) return new Error('Payment ID Required');
    return axios({
      method: 'DELETE',
      url: `https://sandbox.api.mxmerchant.com/checkout/v3/payment/${paymentId}`,
      headers: {
        Authorization: `Basic ${this.auth}`,
        'content-type': 'application/json'
      },
      params: {
        force: 'true'
      },
      responseType: 'json'
    })
    .then(res => res.data)
    .catch(error => error);
  }
}

module.exports = new PaymentHandler();
