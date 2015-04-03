var express     = require('express');
var bodyParser  = require('body-parser');
var logger      = require('./logger');
var mongoose    = require('mongoose');
var locks       = require('locks');
// connect the mongoose to mongolab, see webtech projects
mongoose.connect('mongodb://agencare:Hockey10!@ds049641.mongolab.com:49641/stockmarket');

var app = express();        // create an express app
var mutex = locks.createMutex();

// use everything we required
app.use(logger);
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(express.static('public'));

var companiesSchema = mongoose.Schema({
    name: String,
    symbolURL: String,
    openPrice: {type: Number, default: 0},
    currentPrice: {type: Number, default: 0},
    changeValue: {type: Number, default: 0},
    changeIcon: {type: String, default: 'images/noChange.png'},
    changePercentage: {type: Number, default: 0},
    changeDirection: {type: Number, default: 0},
    shareVolume: {type: Number, default: 0},
    buyOrders: [{type: mongoose.Schema.Types.ObjectId, ref: 'BuyOrders'}],
    saleOrders: [{type: mongoose.Schema.Types.ObjectId, ref: 'SaleOrders'}],
    transactions: [{type: mongoose.Schema.Types.ObjectId, ref: 'Transactions'}]
});

var buyOrdersSchema = mongoose.Schema({
    timeStamp: Date,
    size: Number,
    price: Number,
    company: {type: mongoose.Schema.Types.ObjectId, ref: 'Companies'}
});

var saleOrdersSchema = mongoose.Schema({
    timeStamp: Date,
    size: Number,
    price: Number,
    company: {type: mongoose.Schema.Types.ObjectId, ref: 'Companies'}
});

var transactionsSchema = mongoose.Schema({
    timeStamp: Date,
    size: Number,
    price: Number,
    company: {type: mongoose.Schema.Types.ObjectId, ref: 'Companies'}
});

var Companies = mongoose.model('Companies', companiesSchema);
var BuyOrders = mongoose.model('BuyOrders', buyOrdersSchema);
var SaleOrders = mongoose.model('SaleOrders', saleOrdersSchema);
var Transactions = mongoose.model('Transactions', transactionsSchema);

app.get('/companies', function(request, response) {
    Companies.find(function(error, companies) {
        if (error) response.send(error);
        response.json({companies: companies});
    });
});

app.get('/buyOrders', function(request, response) {
    BuyOrders.find(function(error, buyOrders) {
        if (error) response.send(error);
        response.json({buyOrders: buyOrders});
    });
});

app.get('/saleOrders', function(request, response) {
    SaleOrders.find(function(error, saleOrders) {
        if (error) response.send(error);
        response.json({saleOrders: saleOrders});
    });
});

app.post('/companies', function(request, response) {
    var newCompany = new Companies(request.body.company);

    mutex.lock(function() {
        newCompany.save(function (error) {
            if (error) response.send(error);
            response.status(201).json({company: newCompany});
            mutex.unlock();
        });
    });
});

app.post('/buyOrders', function(request, response) {
    var buyOrder = new BuyOrders({
        timeStamp: request.body.buyOrder.timeStamp,
        size: request.body.buyOrder.size,
        price: request.body.buyOrder.price,
        company: request.body.buyOrder.price
    });

    mutex.lock(function () {
        buyOrder.save(function (error) {
            if (error) response.send(error);
            response.status(201).json({buyOrders: buyOrder});
            mutex.unlock();
        });
    });
});

app.post('/saleOrders', function(request, response) {
    var saleOrder = new SaleOrders({
        timeStamp: request.body.saleOrder.timeStamp,
        size: request.body.saleOrder.size,
        price: request.body.saleOrder.price,
        company: request.body.saleOrder.price
    });

    mutex.lock(function () {
        saleOrder.save(function (error) {
            if (error) response.send(error);
            response.status(201).json({saleOrders: saleOrder});
            mutex.unlock();
        });
    });
});

app.post('/transactions', function(request, response) {
    var transaction = new Transactions(request.body.transaction);

    mutex.lock(function () {
        transaction.save(function (error) {
            if (error) response.send(error);
            response.status(201).json({transaction: transaction});
            mutex.unlock();
        });
    });
});

app.put('/companies/:company_id', function(request, response) {
    Companies.findById(request.params.company_id, function (error, company) {
        if (error) response.send(error);

        company.name = request.body.company.name;
        company.symbolURL = request.body.company.symbolURL;
        company.openPrice = request.body.company.openPrice;
        company.currentPrice = request.body.company.currentPrice;
        company.changeValue = request.body.company.changeValue;
        company.changePercentage = request.body.company.changePercentage;
        company.changeDirection = request.body.company.changeDirection;
        company.shareVolume = request.body.company.shareVolume;

        mutex.lock(function () {
            company.save(function (error) {
                if (error) response.send(error);
                response.status(201).json({company: company});
                mutex.unlock();
            });
        });
    });
});

// this function is correct
app.delete('/buyOrders/:buyOrder_id', function(request, response) {
    mutex.lock(function () {
        BuyOrders.remove({
            _id: request.params.buyOrder_id
        }, function (error, buyOrders) {
            response.status(201).json({buyOrders: BuyOrders});
            mutex.unlock();
        });
    });
});

// this function is correct
app.delete('/saleOrders/:saleOrder_id', function(request, response) {
    mutex.lock(function () {
        console.log("Locking the database");
        SaleOrders.remove({
            _id: request.params.saleOrder_id
        }, function (error, saleOrders) {
            response.status(201).json({saleOrders: SaleOrders});
            mutex.unlock();
        });
    });
});

app.listen(3000, function() {
    console.log("Magic happens on port 3000!");
});
