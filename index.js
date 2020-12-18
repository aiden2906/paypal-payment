require('dotenv').config();
const express = require('express');
const paypal = require('paypal-rest-sdk');
const app = express();
const path = require('path');
const items = require('./item.json');

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
  const itemss = items.map(i => {
    delete i.description;
    delete i.src;
    return i;
  })
  const create_payment_json = {
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
          items: itemss,
        },
        amount: {
          currency: 'USD',
          total: items.reduce((c, i) => c + i.quantity * i.price, 0) + '',
        },
        description: 'The payment transaction description.',
      },
    ],
  };

  paypal.payment.create(create_payment_json, function (error, payment) {
    if (error) {
      res.render('cancel.ejs', {
        error: error.response.details,
      });
    } else {
      const redirect_url = payment.links.find((i) => i.rel === 'approval_url').href;
      if (redirect_url) {
        res.redirect(redirect_url);
      }
    }
  });
});

app.get('/cancel', function (req, res) {
  res.render('cancel.ejs');
});

app.get('/success', (req, res) => {
  const { PayerID: payer_id, paymentId: payment_id } = req.query;
  const execute_payment_json = {
    payer_id,
    transactions: [
      {
        amount: {
          currency: 'USD',
          total: items.reduce((c, i) => c + i.quantity * i.price, 0) + '',
        },
      },
    ],
  };

  paypal.payment.execute(payment_id, execute_payment_json, function (error, payment) {
    if (error) {
      res.render('cancel.ejs');
    } else {
      res.render('success.ejs');
    }
  });
});

app.listen(process.env.PORT, () => {
  console.log(`Example app listening at http://localhost:${process.env.PORT}`);
});
