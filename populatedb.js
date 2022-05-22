#! /usr/bin/env node

console.log('This script populates some test items, providers and categories to your database. Specified database as argument - e.g.: populatedb mongodb+srv://cooluser:coolpassword@cluster0.a9azn.mongodb.net/local_library?retryWrites=true');

// Get arguments passed on command line
var userArgs = process.argv.slice(2);
/*
if (!userArgs[0].startsWith('mongodb')) {
    console.log('ERROR: You need to specify a valid mongodb URL as the first argument');
    return
}
*/
var async = require('async')
var Item = require('./models/item')
var Provider = require('./models/provider')
var Category = require('./models/category')


var mongoose = require('mongoose');
var mongoDB = userArgs[0];
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.Promise = global.Promise;
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

var providers = []
var categories = []
var items = []

function providerCreate(name, cuit, cb) {
  providerdetail = { name: name, CUIT: cuit }

  var provider = new Provider(providerdetail);

  provider.save(function (err) {
    if (err) {
      cb(err, null)
      return
    }
    console.log('New Provider: ' + provider);
    providers.push(provider)
    cb(null, provider)
  });
}

function categoryCreate(name, cb) {
  var category = new Category({ name: name });

  category.save(function (err) {
    if (err) {
      cb(err, null);
      return;
    }
    console.log('New Category: ' + category);
    categories.push(category)
    cb(null, category);
  });
}

function ItemCreate(name, description, provider, category, quant_in_stock, price, cb) {
  Itemdetail = {
    name: name,
    description: description,
    provider: provider,
    category: category,
    quant_in_stock: quant_in_stock,
    price: price
  }
  if (category != false) Itemdetail.category = category

  var item = new Item(Itemdetail);
  item.save(function (err) {
    if (err) {
      cb(err, null)
      return;
    }
    console.log('New Item: ' + item);
    items.push(item)
    cb(null, Item)
  });
}


function createCategoryProviders(cb) {
  async.series([
    function (callback) {
      providerCreate('Bad Solutions', '20137872529', callback);
    },
    function (callback) {
      providerCreate('Good Solutions', '20112345559', callback);
    },
    function (callback) {
      providerCreate('Average Solutions', '30701239870', callback);
    },
    function (callback) {
      providerCreate('The Boring Company', '20133713370', callback);
    },
    function (callback) {
      providerCreate('The Fun Company', '70123456543', callback);
    },
    function (callback) {
      categoryCreate("Paper", callback);
    },
    function (callback) {
      categoryCreate("Tools", callback);
    },
    function (callback) {
      categoryCreate("Toys", callback);
    },
  ],
    // optional callback
    cb);
}


function createItems(cb) {
  async.parallel([
    function (callback) {
      ItemCreate('Stapler', '5mm', providers[0], [categories[1],], 2, 300, callback);
    },
    function (callback) {
      ItemCreate('White Notebook', '100 pages', providers[0], [categories[0],], 5, 340, callback);
    },
    function (callback) {
      ItemCreate('Black Notebook', '200 pages', providers[0], [categories[0],], 4, 600, callback);
    },
    function (callback) {
      ItemCreate('Scissors', 'For left-handed people', providers[1], [categories[1],], 5, 120, callback);
    },
    function (callback) {
      ItemCreate('Pencil', 'Mechanical', providers[1], [categories[1],], 100, 5, callback);
    },
    function (callback) {
      ItemCreate('Test Item 1', 'Summary of test Item 1', providers[4], [categories[0], categories[1]], 4, 230, callback);
    },
    function (callback) {
      ItemCreate('Test Item 2', 'Summary of test Item 2', providers[4], [categories[0],], 4, 120, callback)
    }
  ],
    // optional callback
    cb);
}


async.series([
  createCategoryProviders,
  createItems,
],
  // Optional callback
  function (err, results) {
    if (err) {
      console.log('FINAL ERR: ' + err);
    }
    else {
      console.log('Providers: ' + providers);

    }
    // All done, disconnect from database
    mongoose.connection.close();
  });
