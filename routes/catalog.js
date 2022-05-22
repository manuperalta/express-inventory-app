const express = require('express');
const router = express.Router();

const item_controller = require('../controllers/itemcontroller');
const category_controller = require('../controllers/categorycontroller');
const provider_controller = require('../controllers/providercontroller');
const multer = require('multer');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, '../public/images')
    },
    filename: function (req, file, cb) {
        cb(null, req.params.id)
    }
})
const upload = multer({ storage: storage })

//INDEX ROUTE
router.get('/', item_controller.index);


//ITEM ROUTES

//GET requests for list of items
router.get('/items', item_controller.item_list)

//GET request to create new item
router.get('/items/create', item_controller.item_create_get)

//POST request to create new item
router.post('/items/create', item_controller.item_create_post)

//GET request to update an existing item
router.get('/items/:id/update', item_controller.item_update_get)

//POST request to finalize said item's update
router.post('/items/:id/update', item_controller.item_update_post)

//POST request to upload item image
router.post('/items/:id/upload', item_controller.upload_image_post)

//GET request to delete an existing item
router.get('/items/:id/delete', item_controller.item_delete_get)

//POST request to delete said item
router.post('/items/:id/delete', item_controller.item_delete_post)

//GET request to see an item's details
router.get('/items/:id', item_controller.item_detail);

//CATEGORY ROUTES

//GET request for list of categories
router.get('/categories', category_controller.category_list);

//GET request to get category form
router.get('/categories/create', category_controller.category_create_get)

//POST request to create new category
router.post('/categories/create', category_controller.category_create_post)

//Get request to delete a category
router.get('/categories/:id/delete', category_controller.category_delete_get)

//Post request to delete a category
router.post('/categories/:id/delete', category_controller.category_delete_post)

//Get request to see a category's details
router.get('/categories/:id', category_controller.category_detail);

//PROVIDER ROUTES

//GET request to get provider form
router.get('/providers/create', provider_controller.provider_create_get)

//POST request to create new provider
router.post('/providers/create', provider_controller.provider_create_post)

//GET request for list of providers
router.get('/providers', provider_controller.provider_list);

//GET request to update provider
router.get('/providers/:id/update', provider_controller.provider_update_get);

//POST request to update provider
router.post('/providers/:id/update', provider_controller.provider_update_post)

//GET request for a provider's details
router.get('/providers/:id', provider_controller.provider_detail)

module.exports = router;