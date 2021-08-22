require('dotenv').config()
const express = require('express')
const router = express.Router()
const Coinpayments = require("coinpayments");
const { verify } = require('coinpayments-ipn');
const CoinpaymentsIPNError = require('coinpayments-ipn/lib/error');
const client = new Coinpayments({
    "key": process.env.COINPAYMENTS_KEY,
    "secret": process.env.COINPAYMENTS_SECRET 
})
const nodemailer = require("nodemailer");


router.post('/', (req, res) => {

    const options = {
        currency1: 'AUD',
        currency2: req.body.coin,
        amount: req.body.amount,
        buyer_email: req.body.email,
        invoice: req.body.inv
    }
    
    console.log(options.invoice)
    
client.createTransaction(options)
    .then((result) => {
    
    console.log(options.currency2);
    
    res.render('payment_submitted', {
        amount: result.amount,
        coin: options.currency2,
        invoice: options.invoice,
        payment_url: result.status_url,
        
    })
})
    .catch((err) => {
    res.redirect('/error')
    console.log(err)
});
})

// router.get('/', (req, res) => {
//     client.getTxList()
//         .then((result) =>{res.json(result)})
//         .catch((err) => {res.json(err)});
// })

// router.get('/:id', (req, res) => {
    
//         const options = {
//         txid: req.params.id
//     }
    
//     client.getTx(options)
//         .then((result) =>{res.json(result)})
//         .catch((err) => {res.json(err)});
// })

router.post('/ipn', (req, res, next) => {
    console.log('got something')
//    console.log(req.headers)
//    console.log(req.body)
      if(!req.get(`HMAC`) || !req.body || !req.body.ipn_mode || req.body.ipn_mode !== `hmac` || process.env.MERCHANT_ID !== req.body.merchant) {
    return next(new Error(`Invalid request`));
  }

  let isValid, error;

  try {
    isValid = verify(req.get(`HMAC`), process.env.IPN_SECRET, req.body);
  } catch (e) {
    error = e;
  }
  
  if (error && error instanceof CoinpaymentsIPNError) {
    return next(error);
  }
  
  if (!isValid) {
    return next(new Error(`Hmac calculation does not match`));
  }

  return next();
}, async (req, res, next) => {
  console.log(`Process payment notification`);
    if(req.body.status == 100) {
       console.log('Payment complete. Can send to Xero invoice')
       console.log(`Transaction ID. ${req.body.txn_id}`) 
        console.log(`Received ${req.body.amount1} ${req.body.currency1}. Paid via ${req.body.amount1} ${req.body.currency1}. Can send to Xero invoice`)
        
        
    const date = new Date()
    const dateFormatted = date.toISOString().split('T')[0] 
    const invNumFormatted = JSON.stringify(req.body.invoice)

    //Send invoice to payee

    async function main() {
      
      // create reusable transporter object using the default SMTP transport
      let transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: true, // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_USER, 
          pass: process.env.EMAIL_PASSWORD 
        }
      });
    
      // send mail with defined transport object
      let info = await transporter.sendMail({
        from: `"${process.env.EMAIL_SENDER_NAME}" <${process.env.EMAIL_SENDER}>`, // sender address
        to: `${process.env.EMAIL_RECEIVER}`, // list of receivers
        subject: "Crypto payment received", // Subject line
        text: `You received a crypto payment of ${req.body.amount1} for inv ${invNumFormatted}`, // plain text body
        html: `<p>You received a crypto payment of ${req.body.amount1} for invoice ${invNumFormatted}</p>`, // html body
      });
    
      console.log("Message sent: %s", info.messageId);
      // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
    
      // Preview only available when sending through an Ethereal account
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
      // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
    }
    
    main().catch(console.error);
  

        
       } else {
       console.log('Notification received but payment incomplete. ')
       console.log(`Transaction ID. ${req.body.txn_id}`)
//       console.log(`IPN type. ${req.body.ipn_type}`)
           console.log(`Status. ${req.body.status_text}`)

           //Send email to payee

        

       }
    
    res.statusCode = 200
    res.send()
    
  return next();
})

module.exports = router