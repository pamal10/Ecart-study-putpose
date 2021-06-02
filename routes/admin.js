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
    image.mv('./public/product-images/' + id + '.jpg', (err, done) => {
      if (!err) {
        res.render('admin/add-products')

      }else{
        console.log('error')
      }
    })

  })

})
router.get('/delete-products/',(req,res)=>{
  let proId=req.query.id
  console.log(proId)
  productHelpers.deleteProduct(proId).then(()=>{
    res.redirect('/admin/')
  })

})


module.exports = router;
