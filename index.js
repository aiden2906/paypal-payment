const express = require('express');
const paypal = require('paypal-rest-sdk');
const app = express();
const fs = require('fs');
const path = require('path');
const PORT = 3000;
const BASE_URL = 'http://localhost:3000';

paypal.configure({
  mode: 'sandbox',
  client_id: 'AaqMWtRUWg04_HBVeXN4kWQxYTgL6vOXOVEXYudHfWByO_TlrarP77wPL60uCdEHVbbDPCKuZyUSru1Q',
  client_secret: 'ECVZfSVx1vOhAsyiPxNmSRojk7_EtL6lZTQHbxFtWJ07Yo2BSHHd7fIE-3TLYN6gWQDL5miv5tRMqQC0',
});

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get('/pay', (req, res) => {
  var create_payment_json = {
    intent: 'sale',
    payer: {
      payment_method: 'paypal',
    },
    redirect_urls: {
      return_url: `${BASE_URL}/success`,
      cancel_url: `${BASE_URL}/failed`,
    },
    transactions: [
      {
        item_list: {
          items: [
            {
              name: 'item',
              sku: 'item',
              price: '1.00',
              currency: 'USD',
              quantity: 1,
            },
          ],
        },
        amount: {
          currency: 'USD',
          total: '1.00',
        },
        description: 'This is the payment description.',
      },
    ],
  };

  paypal.payment.create(create_payment_json, function (error, payment) {
    if (error) {
      throw error;
    } else {
      const redirect_url = payment.links.find((i) => i.rel === 'approval_url').href;
      if (redirect_url) {
        res.redirect(redirect_url);
      }
    }
  });
});

app.get('/success', (req, res) => {
  const { PayerID: payer_id, paymentId: payment_id } = req.query;
  var execute_payment_json = {
    payer_id,
    transactions: [
      {
        amount: {
          currency: 'USD',
          total: '1.00',
        },
      },
    ],
  };

  paypal.payment.execute(payment_id, execute_payment_json, function (error, payment) {
    if (error) {
      console.log(error.response);
      throw error;
    } else {
      res.send(payment);
    }
  });
});

app.listen(PORT, () => {
  console.log(`Example app listening at http://localhost:${PORT}`);
});
