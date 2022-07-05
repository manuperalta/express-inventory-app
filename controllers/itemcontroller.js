const Item = require('../models/item.js')
const Category = require('../models/category.js')
const Provider = require('../models/provider.js')
const async = require('async');
const { body, validationResult } = require('express-validator')
const multer = require('multer');
const path = require('path'); //This is used to save uploaded files with their original extensions
const fs = require('fs');
const item = require('../models/item.js');

// Configuring storage engine:

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/images')
    },
    filename: function (req, file, cb) {
        const whitelist = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/webp'
        ]
        if (whitelist.includes(file.mimetype))
            return cb(null, req.params.id + path.extname(file.originalname));
        else
            return cb(new Error('Error: Uploaded file is not an image'));

    }
})
const upload = multer({ storage: storage })
const uploadSingle = upload.single('item_image')

exports.index = function (req, res) {

    async.parallel({
        item_count: function (callback) {
            Item.countDocuments({}, callback); // Pass an empty object as match condition to find all documents of this collection
        },
        item_inStock_count: function (callback) {
            Item.countDocuments({ isInStock: 'true' }, callback);
        },
        provider_count: function (callback) {
            Provider.countDocuments({}, callback);
        },
        category_count: function (callback) {
            Category.countDocuments({}, callback);
        }
    }, function (err, results) {
        res.render('index', { title: 'Inventory App Homepage', error: err, data: results });
    });
};

exports.item_list = (req, res, next) => {
    Item.find()
        .populate('provider').populate('category')
        .sort({ 'name': 1 })
        .exec((err, list_items) => {
            if (err) { return next(err); }
            let files = fs.readdirSync(path.join(__dirname, '..', '/public', '/images'));
            //Successful, so render
            res.render('item_list', { title: 'Item List', item_list: list_items })
        })
};

exports.item_detail = (req, res, next) => {
    Item.findById(req.params.id)
        .populate('category')
        .exec((err, item) => {
            if (err) { return next(err); }
            //Success. Search if there is an image for this item in /public/images:
            let files = fs.readdirSync(path.join(__dirname, '..', '/public', '/images'))
            let filenameRegex = new RegExp(item._id);
            let img_filename = files.find((file) => filenameRegex.test(file))
            //Render page, whether image exists or not:
            res.render('item_detail', { item: item, img_filename: img_filename })
        })
}

exports.item_create_get = (req, res, next) => {
    async.parallel({
        providers: function (cb) { Provider.find({}).exec(cb) },
        categories: function (cb) { Category.find({}).exec(cb) }
    },
        function (err, results) {
            if (err) { return next(err) }
            //Success, render item form passing all cats and provs
            res.render('item_form', {
                title: 'Create Item',
                providers: results.providers,
                categories: results.categories
            })
        })
};

exports.item_create_post = [
    //Convert categories to array (according to tutorial, but req.body.category is already an array apparently)
    //I don't understand the point of this function
    // (req, res, next) => {
    //     console.log(req.body.category) //<-------------------------This logs an array
    //     if (!(req.body.category instanceof (Array))) {
    //         if (typeof req.body.category === 'undefined')
    //             req.body.category = [];
    //         else
    //             req.body.category = new Array(req.body.category);
    //         console.log(req.body.category) //<---------------------This logs the exact same array, so is this function unnecessary?
    //     }
    //     next();
    // },
    //Now we validate and sanitize all fields
    body('name', 'Name must not be empty.').trim().isLength({ min: 1 }).escape(),
    body('provider', 'Provider must not be empty.').trim().isLength({ min: 1 }).escape(),
    body('description', 'Description must not be empty.').trim().isLength({ min: 1 }).escape(),
    body('price', 'Price must not be empty').trim().isLength({ min: 1 }).isCurrency().withMessage('Price must be a currency type').escape(),
    body('quant_in_stock', 'Quantity must not be empty').isInt({ min: 0, max: 99 }).withMessage('Quantity must be between 0 and 99'),
    body('category.*').escape(),
    //Process request after validation and sanitization
    (req, res, next) => {
        //Extract validation errors from request
        const errors = validationResult(req)
        //Create Item object with escaped and trimmed data
        let item = new Item({
            name: req.body.name,
            provider: req.body.provider,
            description: req.body.description,
            price: req.body.price,
            quant_in_stock: req.body.quant_in_stock,
            category: req.body.category
        })
        if (!errors.isEmpty()) {
            //There are errors. Render the form again passing the item's values
            //and all error messages.
            //Before render, we need to get all providers and categories again to display them.
            async.parallel({
                providers: (callback) => { Provider.find().exec(callback) },
                categories: (callback) => { Category.find().exec(callback) },
            },
                (err, results) => {
                    if (err) { return next(err) }
                    //Mark selected categories as checked
                    for (i = 0; i < results.categories.length; i++) {
                        if (item.category.indexOf(results.categories[i]._id) > -1) {
                            results.categories[i].checked = true;
                        }
                    }
                    res.render('item_form', {
                        title: 'Create Item',
                        providers: results.providers,
                        categories: results.categories,
                        item: item,
                        errors: errors.array()
                    });
                });
            return;
        }
        else {
            //Form data is valid. Save new item in database:
            item.save((err, results) => {
                if (err) { return next(err) }
                //No errors. Save successful. Render new item's page.
                res.redirect(item.url)
            })
        }
    }
]

exports.item_delete_get = (req, res, next) => {
    Item.findById(req.params.id).exec((err, item) => {
        if (err) { return next(err) }
        res.render('item_delete', { title: 'Delete Item', item: item })
    })
}

exports.item_delete_post = (req, res, next) => {
    Item.findByIdAndRemove(req.body.itemid, function deleteItem(err, results) {
        if (err) { return next(err) }
        //Delete successful. Redirect to home page:
        res.redirect('/catalog/items')
    })
}

exports.item_update_get = (req, res, next) => {
    async.parallel({
        item: (callback) => { Item.findById(req.params.id).exec(callback) },
        providers: (callback) => { Provider.find().exec(callback) },
        categories: (callback) => { Category.find().exec(callback) }
    },
        (err, results) => {
            if (err) { return next(err) }
            if (results.item == null) {//The item does not exist in the database.
                var err = new Error('Item not found');
                err.status = 404;
                return next(err);
            }
            //Mark selected categories as checked
            for (i = 0; i < results.categories.length; i++) {
                if (results.item.category.indexOf(results.categories[i]._id) > -1) {
                    results.categories[i].checked = true;
                }
            }
            if (err) { return next(err) }
            res.render('item_form', {
                title: 'Update Item',
                item: results.item,
                providers: results.providers,
                categories: results.categories
            });
        }
    );
}

exports.item_update_post = [
    //Convert categories to array (according to tutorial, but req.body.category is already an array apparently)
    //I don't understand the point of this function
    // (req, res, next) => {
    //     console.log(req.body.category) //<-------------------------This logs an array
    //     if (!(req.body.category instanceof (Array))) {
    //         if (typeof req.body.category === 'undefined')
    //             req.body.category = [];
    //         else
    //             req.body.category = new Array(req.body.category);
    //         console.log(req.body.category) //<---------------------This logs the exact same array, so is this function unnecessary?
    //     }
    //     next();
    // },
    //Now we validate and sanitize all fields
    body('name', 'Name must not be empty.').trim().isLength({ min: 1 }).escape(),
    body('provider', 'Provider must not be empty.').trim().isLength({ min: 1 }).escape(),
    body('description', 'Description must not be empty.').trim().isLength({ min: 1 }).escape(),
    body('price', 'Price must not be empty').trim().isLength({ min: 1 }).isCurrency().withMessage('Price must be a currency type').escape(),
    body('quant_in_stock', 'Quantity must not be empty').isInt({ min: 0, max: 99 }).withMessage('Quantity must be between 0 and 99'),
    body('category.*').escape(),
    //Process request after validation and sanitization
    (req, res, next) => {
        //Extract validation errors from request
        const errors = validationResult(req)
        //Create Item object with escaped and trimmed data.
        let item = new Item({
            name: req.body.name,
            provider: req.body.provider,
            description: req.body.description,
            price: req.body.price,
            quant_in_stock: req.body.quant_in_stock,
            category: (typeof req.body.category === 'undefined' ? [] : req.body.category),
            _id: req.params.id //the item's current ID. This is required; otherwise, a new ID will be assigned to the item
        })
        if (!errors.isEmpty()) {
            //There are errors. Render the form again passing the item's values
            //and all error messages.
            //Before render, we need to get all providers and categories again to display them.
            async.parallel({
                providers: (callback) => { Provider.find().exec(callback) },
                categories: (callback) => { Category.find().exec(callback) },
            },
                (err, results) => {
                    if (err) { return next(err) }
                    //Mark selected categories as checked
                    for (i = 0; i < results.categories.length; i++) {
                        if (item.category.indexOf(results.categories[i]._id) > -1) {
                            results.categories[i].checked = true;
                        }
                    }
                    res.render('item_form', {
                        title: 'Create Item',
                        providers: results.providers,
                        categories: results.categories,
                        item: item,
                        errors: errors.array()
                    });
                });
            return;
        }
        else {
            //Form data is valid. Save new item in database:
            Item.findByIdAndUpdate(req.params.id, item, {}, (err, theItem) => {
                if (err) { return next(err) }
                //No errors. Save successful. Render new item's page.
                res.redirect(item.url)
            })
        }
    }
]

exports.upload_image_post =
    (req, res, next) => {
        uploadSingle(req, res, (err) => {
            if (err) { return next(err) }
            res.send('Image Uploaded!')
        })
    }

