require('dotenv').config();
const express = require('express');
const paypal = require('paypal-rest-sdk');
const app = express();
const path = require('path');
const items = require('./item.json');
const fs = require('fs');

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

paypal.configure({
  mode: process.env.PAYPAL_MODE,
  client_id: process.env.PAYPAL_CLIENT_ID,
  client_secret: process.env.PAYPAL_CLIENT_SECRET,
});

app.get('/', (req, res) => {
  res.render('index.ejs', {
    items,
  });
});

app.post('/pay', (req, res) => {
  var create_payment_json = {
    intent: 'sale',
    payer: {
      payment_method: 'paypal',
    },
    redirect_urls: {
      return_url: `${process.env.BASE_URL}/success`,
      cancel_url: `${process.env.BASE_URL}/cancel`,
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
      res.render('cancel.handlebars');
    } else {
      const redirect_url = payment.links.find((i) => i.rel === 'approval_url').href;
      if (redirect_url) {
        res.redirect(redirect_url);
      }
    }
  });
});

app.get('/cancel', function (req, res) {
  res.render('cancel.handlebars');
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
      app.render('cancel.handlebars');
    } else {
      res.render('success.handlebars');
    }
  });
});

app.listen(process.env.PORT, () => {
  console.log(`Example app listening at http://localhost:${process.env.PORT}`);
});
