const Provider = require('../models/provider')
const Category = require('../models/category');
const Item = require('../models/item')
const async = require('async')
const { body, validationResult } = require('express-validator')
exports.category_list = function (req, res, next) {
    Category.find()
        .sort({ 'name': 1 })
        .exec((err, list_categories) => {
            if (err) { return next(err); }
            //Successful, so render
            res.render('category_list', { title: 'Category List', category_list: list_categories })
        })
};

exports.category_detail = (req, res, next) => {
    async.parallel({
        category: (callback) => { Category.findById(req.params.id).exec(callback) },
        category_items: (callback) => { Item.find({ 'category': req.params.id }).exec(callback) }
    },
        (err, results) => {
            if (err) { return next(err) }
            //Successful, so render
            res.render('category_detail', {
                title: 'Category Detail',
                category: results.category,
                items: results.category_items
            });
        }
    );
}

exports.category_create_get = (req, res, next) => {
    res.render('category_form', { title: 'Create Category' })
}

exports.category_create_post = [
    body('name', 'Name must not be empty').trim().isLength({ min: 1 }).escape(),
    body('description', 'Description must not be empty').trim().isLength({ min: 1 }).escape(),
    (req, res, next) => {
        //Extract validation results from request
        const errors = validationResult(req)
        //Create new category object with form data
        let category = new Category({
            name: req.body.name,
            description: req.body.description
        })
        if (!errors.isEmpty()) {
            //There are errors. Render form again passing all values
            res.render({ title: 'Create Category', category: category })
        }
        else {
            //Form data is invalid. Save new category in database
            category.save((err) => {
                if (err) { return next(err) }
                //No errors. New category has been saved to database. Redirect to its url.
                res.redirect(category.url)
            })
        }
    }
]

exports.category_delete_get = (req, res, next) => {
    async.parallel({
        categoryToDelete: (callback) => { Category.findById(req.params.id).exec(callback) },
        itemsInCategory: (callback) => { Item.find({ 'category': req.params.id }).exec(callback) }
    },
        (err, results) => {
            if (err) { return next(err); }
            res.render('category_delete',
                {
                    category: results.categoryToDelete,
                    items: results.itemsInCategory
                })
        }

    )
}

exports.category_delete_post = (req, res, next) => {
    Category.findByIdAndDelete(req.body.categoryid, function deleteCategory(err, results) {
        if (err) { return next(err) }
        //Success. Redirect to category list:
        res.redirect('/catalog/categories')
    })
}

exports.category_update_get = (req, res, next) => {
    Category.findById(req.params.id, function (err, category) {
        if (err) { return next(err) }
        //Success finding category. Render form:
        res.render('category_form', { title: 'Update Category', category: category })
    })
}

exports.category_update_post = [
    body('name', 'Name must not be empty').trim().isLength({ min: 1 }).escape(),
    body('description', 'Description must not be empty').trim().isLength({ min: 1 }).escape(),
    (req, res, next) => {
        //Extract validation results from request
        const errors = validationResult(req)
        //Create new category object with form data
        let category = new Category({
            name: req.body.name,
            description: req.body.description,
            _id: req.params.id //The current category ID. If we do not set this, a new ID will be assigned to it.
        })
        if (!errors.isEmpty()) {
            //There are errors. Render form again passing all values
            res.render({ title: 'Create Category', category: category })
        }
        else {
            //Form data is invalid. Update category:
            Category.findByIdAndUpdate(req.params.id, category, {}, (err, updatedCategory) => {
                if (err) { return next(err) }
                //No errors. Category has been updated. Redirect to its url.
                res.redirect(category.url)
            })
        }
    }

]