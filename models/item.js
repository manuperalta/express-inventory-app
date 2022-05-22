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
    .virtual('extension').get(function () {
        let ext = '';
        fs.readdir(path.join(__dirname,'..','public','images'), (err, files) => {
            console.log(files)
            if (err) { console.log(err) }
            else {
                const ItemIDRegex = new RegExp(this._id);
                console.log(ItemIDRegex)
                files.forEach(file => {
                    console.log(file)
                    console.log(ItemIDRegex.test(file))
                    if (ItemIDRegex.test(file)){ ext = path.extname(file) }
                })
                console.log(ext)
            }
            console.log(ext);
        })
        console.log(ext)
        return ext;
    })
module.exports = mongoose.model('Item', ItemSchema)