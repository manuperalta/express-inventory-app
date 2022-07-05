const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const fs = require('fs')
const path = require('node:path')

const ItemSchema = new Schema(
    {
        name: { type: String, required: true, maxLength: 100 },
        description: { type: String, required: true, maxLength: 100 },
        provider: { type: Schema.Types.ObjectId, ref: 'Provider' },
        category: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
        quant_in_stock: { type: Number, required: true },
        price: { type: Number, required: true }
    })

ItemSchema
    .virtual('url').get(function () {
        return '/catalog/items/' + this._id;
    })
ItemSchema
    .virtual('isInStock').get(function () {
        if (this.quant_in_stock > 0) return true
        else return false;
    })
ItemSchema
    .virtual('unescaped-description').get(function () {
        let txt = new DOMParser().parseFromString(this.description, "text/html");
        return txt.documentElement.textContent;
    })
ItemSchema
    .virtual('imgName').get(function () {
        let image = '';
        let item = this;
        files = fs.readdirSync(path.join(__dirname, '..', 'public', 'images'));
        files.forEach(file => {
            if (file.includes(item._id.toString())) return image = file;
        })
        return image;
    })
module.exports = mongoose.model('Item', ItemSchema)