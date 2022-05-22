const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const CategorySchema = new Schema(
    {
        name: { type: String, required: true, maxLength: 100 },
        description: { type: String, required: true, maxLength: 300 }
    })

CategorySchema
    .virtual('url').get(function () {
        return '/catalog/categories/' + this._id;
    })

module.exports = mongoose.model('Category', CategorySchema)    