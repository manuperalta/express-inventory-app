const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const ProviderSchema = new Schema(
    {
        name: { type: String, required: true, maxLength: 100 },
        CUIT: { type: String, required: true, maxLength:100}
    })

ProviderSchema
    .virtual('url').get(function () {
        return '/catalog/providers/' + this._id;
    })
module.exports = mongoose.model('Provider', ProviderSchema)