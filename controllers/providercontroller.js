const Provider = require('../models/provider');
const Item = require('../models/item');
const Category = require('../models/category');
const async = require('async')
const { body, validationResult } = require('express-validator')

exports.provider_list = (req, res, next) => {
    Provider.find()
        .sort({ 'name': 1 })
        .exec(function (err, list_providers) {
            if (err) { return next(err); }
            //Successful, so render
            res.render('provider_list', { title: 'Provider List', provider_list: list_providers })
        })
};
exports.provider_detail = (req, res, next) => {
    async.parallel({
        provider: (callback) => { Provider.findById(req.params.id).exec(callback) },
        item_list: (callback) => { Item.find({ 'provider': req.params.id }).exec(callback) }
    },
        (err, results) => {
            if (err) { return next(err); }
            //Success. Render provider detail form
            console.log(results.item_list)
            res.render('provider_detail', { provider: results.provider, items: results.item_list })
        });
}
exports.provider_create_get = (req, res, next) => {
    res.render('provider_form', { title: 'Create Provider' })
}

exports.provider_create_post = [
    body('name', 'Name must not be empty').trim().isLength({ min: 1 }).escape(),
    body('cuit', 'CUIT must not be empty').trim().isLength({ min: 11, max: 11 }).withMessage('CUIT must be exactly 11 digits').isNumeric().withMessage('CUIT must contain only numbers.'),
    (req, res, next) => {
        //Extract validation results from request
        const errors = validationResult(req)
        //Create a new provider object with escaped and trimmed data
        let provider = new Provider({
            name: req.body.name,
            CUIT: req.body.cuit
        })
        if (!errors.isEmpty) {
            //There are errors. Rerender the form passing the provider's values
            //and an error array.
            res.render('provider_form', { title: 'Create Provider', provider: provider, errors: errors })
        }
        else {
            //Form data is valid. Save new provider in database.
            provider.save((err) => {
                if (err) { return next(err) }
                //No errors. Provider has entered database. Render new provider's page.
                res.redirect(provider.url)
            })
        }
    }
]

exports.provider_delete_get = (req, res, next) => {
    async.parallel({
        providerToDelete: (callback) => { Provider.findById(req.params.id).exec(callback) },
        itemsInProvider: (callback) => { Item.find({ 'provider': req.params.id }).exec(callback) }
    },
        (err, results) => {
            if (err) { return next(err); }
            res.render('provider_delete',
                {
                    provider: results.providerToDelete,
                    items: results.itemsInProvider
                })
        }

    )
}

exports.provider_delete_post = (req, res, next) => {
    Provider.findByIdAndDelete(req.body.providerid, function deleteProvider(err, results) {
        if (err) { return next(err) }
        //Success. Redirect to provider list:
        res.redirect('/catalog/providers')
    })
}

exports.provider_update_get = (req, res, next) => {
    Provider.findById(req.params.id, function (err, provider) {
        if (err) { return next(err) }
        //Success finding provider. Render form:
        res.render('provider_form', { title: 'Update Provider', provider: provider })
    })
}

exports.provider_update_post = [
    body('name', 'Name must not be empty').trim().isLength({ min: 1 }).escape(),
    body('cuit', 'CUIT must not be empty').trim().isLength({ min: 11, max: 11 }).withMessage('CUIT must be exactly 11 digits').isNumeric().withMessage('CUIT must contain only numbers.'),
    (req, res, next) => {
        //Extract validation results from request
        const errors = validationResult(req)
        //Create a new provider object with escaped and trimmed data
        let provider = new Provider({
            name: req.body.name,
            CUIT: req.body.cuit,
            _id: req.params.id // We need to assign the old ID to the provider object. Otherwise, a new ID will be assigned automatically
        })
        if (!errors.isEmpty) {
            //There are errors. Rerender the form passing the provider's values
            //and an error array.
            res.render('provider_form', { title: 'Create Provider', provider: provider, errors: errors })
        }
        else {
            //Form data is valid. Update provider data:
            Provider.findByIdAndUpdate(req.params.id, provider, {}, (err, updatedProvider) => {
                if (err) { return next(err) }
                //No errors. Provider has been updated. Go to provider's page:
                console.log(provider)
                console.log(updatedProvider)
                res.redirect(provider.url)
            })
        }
    }
]