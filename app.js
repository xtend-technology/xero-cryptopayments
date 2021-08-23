const express = require('express')
const exphbs  = require('express-handlebars');
const bodyParser = require('body-parser')
const app = express()
const port = process.env.PORT || 3000

const Coinpayments = require("coinpayments");
const { verify } = require('coinpayments-ipn');
const CoinpaymentsIPNError = require('coinpayments-ipn/lib/error');


// Express middleware
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

//Body-parser middleware
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json());

//Router middleware
app.use('/payment', require('./routes/payment'))


//Static file system
app.use(express.static('public'))

app.get('/', (req, res) => {
res.redirect('/payment_form')
})

app.get('/payment_form', (req, res) => {

    const client = new Coinpayments({
        "key": process.env.COINPAYMENTS_KEY,
        "secret": process.env.COINPAYMENTS_SECRET 
    })
    // && key != 'LTCT' to remove test coin
    client.rates({accepted: 2})
    .then((result) =>{
        const coins = []
        Object.keys(result).forEach(key => {
        if(result[key].accepted ===1 && key != 'LTCT'){
            coins.push(key)
        }
        
        })
        console.log(coins)
        res.render('payment', {
            invoice_number: req.query.invoiceNo,
            amount: req.query.amount,
            coins: coins
        })
        
        })

    .catch((err) => {res.json(err)})

    
})



app.get('/error', (req, res) => {
    res.render('error')
})

//Test git change
app.listen(port, () => console.log(`Example app listening on port ${port}!`))