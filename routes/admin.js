var express = require('express');
const { render } = require('../app');
var router = express.Router();
var productHelpers = require('../helpers/product-helpers')

/* GET users listing. */
router.get('/', function (req, res, next) {
  productHelpers.getAllProducts().then((products) => {
    res.render('admin/view-products', { admin: true, products })

  })



});
router.get('/add-products', (req, res) => {
  res.render('admin/add-products')
})
router.post('/add-products', (req, res) => {
  //console.log(req.body)
  //console.log(req.files.image)
  


  productHelpers.addProduct(req.body, (id) => {
    let image = req.files.Image
    console.log(id)
    image.mv('./public/product-images/' + id + '.jpg', (err, done) => {
      if (!err) {
        res.render('admin/add-products')

      } else {
        console.log('error')
      }
    })

  })

})
router.get('/delete-products/', (req, res) => {
  let proId = req.query.id
  console.log(proId)
  productHelpers.deleteProduct(proId).then(() => {
    res.redirect('/admin/')
  })

})
router.get('/edit-products/', (req, res) => {
  productHelpers.getProductDetails(req.query.id).then((product) => {
    res.render('admin/edit-products', { admin: true, product })
  })

})
router.post('/edit-products/', (req, res) => {
  console.log(req.body);
  console.log(req.query.id);
  productHelpers.updateProductDetails(req.query.id, req.body).then(() => {
    res.redirect('/admin/')
  })
  if (req.files.Image) {
    req.files.Image.mv('./public/product-images/' + req.query.id + '.jpg')

  }

})

module.exports = router;
