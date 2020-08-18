const axios = require('axios').default;
const config = require('../../config/config.js');

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
          number: payData.number,
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
    .catch(error => new Error(error));
  }
  finalizePayment(finData) {
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
        paymentToken: finData.paymentToken,
        tenderType: 'Card',
        amount: finData.amount,
        authCode: finData.authCode,
        authOnly: false,
      },
      responseType: 'json'
    })
    .then(res => res.data)
    .catch(error => new Error(error));
  }
}

module.exports = new PaymentHandler();
