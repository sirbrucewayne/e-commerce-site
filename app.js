var express=require('express');
var path=require('path');
var fs = require('fs');
var bodyParser = require('body-parser');
var session = require('express-session');
var urlencodedParser = bodyParser.urlencoded({ extended: false})
var dir=require('process').cwd();
var async = require('async');
var multer=require('multer');
var fileUpload=require('express-fileupload');
var dialog=require('dialog');
var underscore=require('underscore');
var fs = require('fs');

var app=express();

const mongoose=require('mongoose');
mongoose.connect("mongodb://localhost:27017/shoppingdb", { useNewUrlParser: true });
var db=mongoose.connection;
db.on('error',console.log.bind(console,"connection error"));
db.once('open',function(callback){
	console.log("connection established");
});

//schemas
var uniqueValidator = require('mongoose-unique-validator');
/*Admin Schema*/
const AdminSchema=mongoose.Schema({
	name:String,
	email:String,
	password:String
});
var adminModelRef=mongoose.model("admin",AdminSchema);

/*var admin1=new adminModelRef({
	name:"admin",
	email:"admin123@gmail.com",
	password:"admin"
	});

admin1.save(function(err,admin){
	if(err) throw err;
	else{
		console.log("Admin record added")
	}
});
 if u want, add more admin records through "db.collectionName.insert({key:value})" manually
*/


/*customer schema*/
const cusSchema=mongoose.Schema({
	name:String,
	email:{
		type:String,
		unique:true
	},
	password:String,
	address:String,
	gender:String,
	contact:Number
});
var cusModelRef=mongoose.model("cusModel",cusSchema);
cusSchema.plugin(uniqueValidator); 

/*Category schema*/
const catSchema=mongoose.Schema({
	title:String,
	subCat:[{subcatid:String,title:String}]
});
var catModelRef=mongoose.model("catModel",catSchema);

/*Brand schema*/
const brandSchema=mongoose.Schema({
	title:String,
	subBrand:[{subbrandid:String,title:String}]
});
var brandModelRef=mongoose.model("brandModel",brandSchema);

/*Cart schema*/
const cartSchema=mongoose.Schema({
	email:String,
	products:[{pname:String,price:String,quantity:Number}]
});
var cartModelRef=mongoose.model("cartModel",cartSchema);

/*product schema */
const productSchema=mongoose.Schema({
	name:String,
	description:String,
	price:String,
	size:[String],
	keywords:[String],
	image:String,
	category:String,
	subcategory:String,
	brand:String
});
var productModelRef=mongoose.model("productModel",productSchema);


/*order schema*/
const orderSchema=mongoose.Schema({
	email:String,
	products:[{pid:String,price:String,qty:String,size:String}],
	payStatus:String,
	timestamp:String
});
var orderModelRef=mongoose.model("orderModel",orderSchema);

/*--------------------------------------------------------------------------------------------------------------------------*/

app.use(express.static(require('path').join(__dirname + '/Public')));

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.engine('ejs',require('ejs').renderFile);
app.set('view engine','ejs');

app.use(session({
  cookieName: 'session',
  secret: 'random_string_goes_here',
  duration:  10 * 1000,
  activeDuration: 10 * 1000
}));

app.get('/',async function(req,res){
		let parentCategoriesJson=await catModelRef.find({});
		let parentBrandsJson=await brandModelRef.find({});
		let productJson=await productModelRef.find({});
		parentCategories=JSON.parse(JSON.stringify(parentCategoriesJson));
		parentBrands=JSON.parse(JSON.stringify(parentBrandsJson));
		product=JSON.parse(JSON.stringify( productJson));

		res.render('start',{
			parentCategories:parentCategories,
			parentBrands:parentBrands,
			product:product
		});

});

app.get('/home/cart',async function(req,res){
	let cartInfo = await cartModelRef.findOne({email:req.session.user.email});
	console.log(cartInfo);
	res.render('cart',{
	cartInfo:cartInfo
	});
});


app.get('/home',async function(req,res){
	if(req.session.user&&req.session){
		
		console.log(req.session.user.email);
		let userInfo = await cusModelRef.findOne({email:req.session.user.email});
		/*await functions only inside a async function. This await function makes the section of the code halts till it gets the desired 
		result. Basically, it serializes the execution till the required result is obtained.*/
		let parentCategoriesJson=await catModelRef.find({});
		let parentBrandsJson=await brandModelRef.find({});
		let productJson=await productModelRef.find({});
		parentCategories=JSON.parse(JSON.stringify(parentCategoriesJson));
		parentBrands=JSON.parse(JSON.stringify(parentBrandsJson));
		product=JSON.parse(JSON.stringify( productJson));

		res.render('home',{
			userInfo:userInfo,
			userName:req.session.user.name,
			parentCategories:parentCategories,
			parentBrands:parentBrands,
			product:product
		});
		
	}
	else{
		console.log('Login Again');
		res.redirect('/login');
	}
});	
app.get('/adminDashboard',async function(req,res){
	if(req.session.user&&req.session){
		let parentCategories=await catModelRef.find({});
		let parentBrands=await brandModelRef.find({});
		//console.log(parentCategories);
		res.render('dashboard',{
			parentCategories:parentCategories,
			parentBrands:parentBrands,
			adminName:req.session.user
		});
	}
	else{
		console.log('Login Again');
		res.redirect('/login');
	}
});
app.get('/register',async function(req,res){
	let parentCategoriesJson=await catModelRef.find({});
		let parentBrandsJson=await brandModelRef.find({});
		let productJson=await productModelRef.find({});
		parentCategories=JSON.parse(JSON.stringify(parentCategoriesJson));
		parentBrands=JSON.parse(JSON.stringify(parentBrandsJson));
		product=JSON.parse(JSON.stringify( productJson));

		
		res.render('register',{
			emailTaken:'',
			parentCategories:parentCategories,
			parentBrands:parentBrands,
			product:product
		});
});

app.get('/login',async function(req,res){
	let parentCategoriesJson=await catModelRef.find({});
		let parentBrandsJson=await brandModelRef.find({});
		let productJson=await productModelRef.find({});
		parentCategories=JSON.parse(JSON.stringify(parentCategoriesJson));
		parentBrands=JSON.parse(JSON.stringify(parentBrandsJson));
		product=JSON.parse(JSON.stringify( productJson));

		
		res.render('login',{
			userEmailTaken:'',
	        userCredentials:'',
			parentCategories:parentCategories,
			parentBrands:parentBrands,
			product:product
		});
});

var adminPattern=/admin*/
app.post('/login',urlencodedParser,function(req,res){

    if(req.body.email.match(adminPattern)){
    	adminModelRef.findOne({email:req.body.email},function(err,result){
    		if(err) throw err;
			if(!result){
				chechCustomerList();
			}
			else{
				adminModelRef.findOne({email:req.body.email,password:req.body.password},function(err2,result2){
					if(err2) throw err2;
					if(!result2){
						res.render('login',{
								userEmailTaken:'',
								userCredentials:'Insufficient Credentials'
						});
					}
					else{
						req.session.user=result2.name;
						res.redirect('/adminDashboard');
					}
				});
			}
	    	});
    }
    else{

    	checkCustomerList();
    }
    function checkCustomerList(){

	cusModelRef.findOne({email:req.body.email},function(err,result){
		if(err) throw err;
		if(!result){
			res.render('login',{
					userEmailTaken:'Email does not exists',
					userCredentials:''
			});
		}
		else{
			cusModelRef.findOne({email:req.body.email,password:req.body.password},function(err2,result2){
				if(err2) throw err2;
				if(!result2){
					res.render('login',{
							userEmailTaken:'',
							userCredentials:'Insufficient Credentials'
					});
				}
				else{
					req.session.user=result2;
					res.redirect('/home');
				}
			});
		}
	});

}

});
app.post('/register',urlencodedParser,function(req,res){
	var cusObj=new cusModelRef({
		name:req.body.name,
		email:req.body.email,
		password:req.body.password,
		address:req.body.address,
		gender:req.body.gender,
		contact:req.body.contact
	});
	
    cusObj.save(function(err,cusModel){
    	if(err) 
    	{
    		//throw err;
    		console.log(err);
    		res.render('register',{
    			emailTaken:'User with this emailId already exists'
    		})
    	}
    	else
    	{	
    		console.log("record inserted");
    		res.redirect('/');
		}
    });

    
});

app.post('/dashboard/category',urlencodedParser,function(req,res){
	var catObj=new catModelRef({
		title:req.body.category,
	});
	catObj.save(function(err,catModel){
		if(err){
			throw err;
		}
		else{
			res.redirect('/adminDashboard');
		}
	})
});

app.post('/dashboard/subcategory',urlencodedParser,async function(req,res){

	var catTitle=req.body.category;
	var catId=await catModelRef.findOne({title:catTitle}).select('_id');
	
	var subcatId=await catModelRef.findOne({title:catTitle}).select('subCat -_id');
		var len=subcatId.subCat.length;		
		var newsubcat={subcatid:len,title:req.body.subcategory}
		
		catModelRef.findOneAndUpdate({_id:catId},{$push:{subCat:newsubcat}},function(err,catModel){
			if(err) throw err;
			else{
				res.redirect('/adminDashboard');	
			}
		});
	
})
app.post('/dashboard/brand',urlencodedParser,function(req,res){
	var brandObj=new brandModelRef({
		title:req.body.brand,
	});
	brandObj.save(function(err,brandModel){
		if(err){
			throw err;
		}
		else{
			res.redirect('/adminDashboard');
		}
	})
});
app.post('/dashboard/subbrand',urlencodedParser,async function(req,res){

	var brandTitle=req.body.brand;
	var brandId=await brandModelRef.findOne({title:brandTitle}).select('_id');
	
	var subbrandId=await brandModelRef.findOne({title:brandTitle}).select('subBrand -_id');
		var len=subbrandId.subBrand.length;		
		var newsubbrand={subbrandid:len,title:req.body.subbrand}
		
		brandModelRef.findOneAndUpdate({_id:brandId},{$push:{subBrand:newsubbrand}},function(err,brandModel){
			if(err) throw err;
			else{
				res.redirect('/adminDashboard');	
			}
		});
	
});

app.get('/home/cartadd',async function(req,res){
	let product=await productModelRef.find({name:req.query.product});
	var uid=req.session.user.email;
console.log(product.price);
console.log(product);
	cartModelRef.findOne({email:uid},function(err,result){
		if(!result){
			var cartObj=new cartModelRef({
			email:uid,
			products:[{pname:req.query.product,price:product[0].price,quantity:1}]
			});
			cartObj.save(function(err,cartModel){
				if(err){
				throw err;
				}else{
				res.redirect('/home');
				}
			});	
		}else{
		    var newcart={pname:req.query.product,price:product[0].price,quantity:1}			
		    cartModelRef.findOneAndUpdate({email:uid},{$push:{products:newcart}},function(err,cartModel){
			if(err) throw err;
			else{
				res.redirect('/home');	
			}
		    });
		}	
        });
});

app.get('/home/updateqty',async function(req,res){
	var uid=req.session.user.email;
	console.log(req.query.qty);
	console.log(req.query.pid);
	let cartInfo = await cartModelRef.findOne({email:req.session.user.email});
	console.log(cartInfo);
	for(var i=0;i<cartInfo.products.length;i++){
		if(cartInfo.products[i]._id==req.query.pid){
			cartInfo.products[i].quantity=req.query.qty;
		}
	}
	console.log(cartInfo);
	cartModelRef.findOne({email:uid},function(err,result){			
		cartModelRef.updateOne({email:uid},{$set:{products:cartInfo.products}},{new: true},function(err,cartModel){
			if(err) throw err;
			else{
				res.redirect('/home');	
			}
		});
        });
});


var Imagename="default";
app.post('/dashboard/product',urlencodedParser,function(req,res){
	var name=req.body.name;
	Imagename=name;
	console.log(Imagename);
    var sizes=[];
    if(req.body.size_s){sizes.push(req.body.size_s);}
    if(req.body.size_m){sizes.push(req.body.size_m);}
    if(req.body.size_l){sizes.push(req.body.size_l);}
    if(req.body.size_xl){sizes.push(req.body.size_xl);}
    if(req.body.size_eight){sizes.push(req.body.size_eight);}
    if(req.body.size_nine){sizes.push(req.body.size_nine);}
    if(req.body.size_ten){sizes.push(req.body.size_ten);}
	if(req.body.size_eleven){sizes.push(req.body.size_eleven);}

	var keywords=req.body.keywords.split(",");
    var proObj=new productModelRef({
    	name:name,
		description:req.body.description,
		price:req.body.price,
		size:sizes,
		keywords:keywords,
		image:name+'.jpeg',
		category:req.body.category,
		subcategory:req.body.subcategory,
		brand:req.body.brand
    });
   
    proObj.save(function(err,productModel){
    	if(err) throw err;
    	else
    	{
    		res.redirect('/adminDashboard');
    	}
    })
});
app.post('/dashboard/proimage',urlencodedParser,async function(req,res){
	
	console.log(Imagename);
	var storage = multer.diskStorage({destination: function (req, file, cb) { cb(null, './Public/productImages')},
							  		   filename: function (req, file, cb) {cb(null, Imagename + '.jpeg')}});

    var upload = multer({ storage: storage }).single('image'); //single --> here indicates that we are uploading a single image
    upload(req,res,function(err){
    	if(err){
    		throw err;
    	}
    	else
    	{
    		console.log("image upload success!");
    		res.redirect('/adminDashboard');
    	}
    })
});

app.post('/home/category',urlencodedParser,async function(req,res){
	
	let userInfo = await cusModelRef.findOne({email:req.session.user.email});
	let parentCategoriesJson=await catModelRef.find({});
	let parentBrandsJson=await brandModelRef.find({});
	parentCategories=JSON.parse(JSON.stringify(parentCategoriesJson));
	parentBrands=JSON.parse(JSON.stringify(parentBrandsJson));

	var product=await productModelRef.find({category:req.body.category});
	product=JSON.parse(JSON.stringify(product));
	//console.log(product);
	res.render('home',{
		product:product,
		userInfo:userInfo,
		userName:req.session.user.name,
		parentCategories:parentCategories,
		parentBrands:parentBrands,
	})
});

app.post('/home/subcategory',urlencodedParser,async function(req,res){
	
	let userInfo = await cusModelRef.findOne({email:req.session.user.email});
	let parentCategoriesJson=await catModelRef.find({});
	let parentBrandsJson=await brandModelRef.find({});
	parentCategories=JSON.parse(JSON.stringify(parentCategoriesJson));
	parentBrands=JSON.parse(JSON.stringify(parentBrandsJson));

	var product=await productModelRef.find({subcategory:req.body.subcat,category:req.body.cat});
	product=JSON.parse(JSON.stringify(product));
	//console.log(product);
	res.render('home',{
		product:product,
		userInfo:userInfo,
		userName:req.session.user.name,
		parentCategories:parentCategories,
		parentBrands:parentBrands,
	})
});

app.post('/home/brand',urlencodedParser,async function(req,res){
	
	let userInfo = await cusModelRef.findOne({email:req.session.user.email});
	let parentCategoriesJson=await catModelRef.find({});
	let parentBrandsJson=await brandModelRef.find({});
	parentCategories=JSON.parse(JSON.stringify(parentCategoriesJson));
	parentBrands=JSON.parse(JSON.stringify(parentBrandsJson));

	var product=await productModelRef.find({brand:req.body.brand});
	product=JSON.parse(JSON.stringify(product));
	//console.log(product);
	res.render('home',{
		product:product,
		userInfo:userInfo,
		userName:req.session.user.name,
		parentCategories:parentCategories,
		parentBrands:parentBrands,
	})
});

app.post('/home/subcategory',urlencodedParser,async function(req,res){
	
	let userInfo = await cusModelRef.findOne({email:req.session.user.email});
	let parentCategoriesJson=await catModelRef.find({});
	let parentBrandsJson=await brandModelRef.find({});
	parentCategories=JSON.parse(JSON.stringify(parentCategoriesJson));
	parentBrands=JSON.parse(JSON.stringify(parentBrandsJson));

	var product=await productModelRef.find({subcategory:req.body.subbrand,brand:req.body.brand});
	product=JSON.parse(JSON.stringify(product));
	//console.log(product);
	res.render('home',{
		product:product,
		userInfo:userInfo,
		userName:req.session.user.name,
		parentCategories:parentCategories,
		parentBrands:parentBrands,
	})
});

app.get('/home/product',async function(req,res){
	//console.log(req.query);
	let userInfo= await cusModelRef.findOne({email:req.session.user.email});
	userInfo=JSON.parse(JSON.stringify(userInfo));
	let product=await productModelRef.find({name:req.query.product});
	//console.log(product[0].image);
	res.render('productDisplay',{
		product:product[0],
		userInfo:userInfo,
		userName:req.session.user.name
	});
});

app.get('/home/buyproduct',async function(req,res){
	let userInfo= await cusModelRef.findOne({email:req.session.user.email});
	userInfo=JSON.parse(JSON.stringify(userInfo));
	let product=await productModelRef.find({name:req.query.product});
	res.render('orderDisplay',{
		product:product[0],
		userInfo:userInfo,
		userName:req.session.user.name
	});
});

app.post('/home/buyproduct/order',urlencodedParser,async function(req,res){
	var timestamp=Date.now(); //returns the timestamp in milliseconds.
	var pid=await productModelRef.findOne({name:req.body.pname}).select('_id');
	var orderObj=new orderModelRef({
		email:req.session.user.email,
		products:[{pid:pid,price:req.body.total,qty:req.body.qty,size:req.body.size}],
		payStatus:"completed",
		timestamp:timestamp
	});
	orderObj.save(function(err,orderModel){
		if(err){
			throw err;
		}
		else{
			res.redirect('/home/payment');
		}
	})
	
});
app.get('/logout', function(req, res) {
  	req.session.destroy(function(err){
  		if(err){
  			console.log(err);
  		}
  		else {
  			res.redirect('/');
  		}
  	});
});
<<<<<<< HEAD
app.listen(3000);
=======

app.get('/home/search',async function(req,res){
	var para=req.query.searchParam;
	let searchFromProducts=await productModelRef.find({keywords:{$regex:"^"+para+"*",$options:'i'}});
	console.log(searchFromProducts);
	if(req.session&&req.session.user)
	{
		let userInfo = await cusModelRef.findOne({email:req.session.user.email});
		let parentCategoriesJson=await catModelRef.find({});
		let parentBrandsJson=await brandModelRef.find({});
		//let productJson=await productModelRef.find({});
		parentCategories=JSON.parse(JSON.stringify(parentCategoriesJson));
		parentBrands=JSON.parse(JSON.stringify(parentBrandsJson));
		//product=JSON.parse(JSON.stringify( productJson));

		res.render('home',{
			userInfo:userInfo,
			userName:req.session.user.name,
			parentCategories:parentCategories,
			parentBrands:parentBrands,
			product:searchFromProducts
		});
	}
	else{
		let parentCategoriesJson=await catModelRef.find({});
		let parentBrandsJson=await brandModelRef.find({});
		//let productJson=await productModelRef.find({});
		parentCategories=JSON.parse(JSON.stringify(parentCategoriesJson));
		parentBrands=JSON.parse(JSON.stringify(parentBrandsJson));
		//product=JSON.parse(JSON.stringify( productJson));

		res.render('start',{
			parentCategories:parentCategories,
			parentBrands:parentBrands,
			product:searchFromProducts
		});

	}
	
		
});
app.listen(3000);
>>>>>>> e6e7f02712279ab7e25fbc7fcc103a8260314534
