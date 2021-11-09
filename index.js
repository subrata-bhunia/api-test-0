const express=require("express");
const mysql = require("mysql") 
const morgan =require('morgan')
const bodyParser = require('body-parser')
const PORT = 9999 ;
const CompanyCode = 122 ;
// --------------
const jwt = require('jwt-encode');
const e = require("express");
const secret = `${CompanyCode}`;
const app=express();
// --------------
app.use(morgan("combined"))
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.raw());
// ------------
app.listen(PORT,()=>{
    console.log("Test")
})
// -------------
app.get("/",(req,res)=>{
    console.log("connected");
    res.json({msg:"Welcome To Testing Site"})
})
// --------------MYSQL -------------------------------------------------------------------------------------------


const dbconfig= {
    host:"us-cdbr-east-04.cleardb.com",
    user:'b168f7c038f1fc',
    database:'heroku_21e0c4c276037de',
    password:"759b8bb3"
}

var connection;

function handleClose(){
    connection = mysql.createConnection(dbconfig);

    connection.connect(function(err) {              // The server is either down
        if(err) {                                     // or restarting (takes a while sometimes).
          console.log('error when connecting to db:', err);
          setTimeout(handleClose, 2000); // We introduce a delay before attempting to reconnect,
        }                                     // to avoid a hot loop, and to allow our node script to
      }); 

      connection.on('error', function(err) {
        console.log('db error', err);
        if(err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
            handleClose();                         // lost due to either server restart, or a
        } else {                                      // connnection idle timeout (the wait_timeout
          throw err;                                  // server variable configures this)
        }
      });
}
handleClose();

/*
    |                       |
    |       Customers       |    
    |                       |
*/

// Customer Login
app.post('/userLogin',(req,res)=>{
    const phone=req.body.phone;
    const password = req.body.password;
    // connection
    const queryString="SELECT password FROM `customers` WHERE phone = ?;"
    const queryString2="SELECT * FROM `customers` WHERE phone = ?;"
    connection.query(queryString,[phone],(err,pass)=>{
        if(pass.length == 0){
            res.json({msg:"Check phone Number 😒"})
            res.end()
        }else{
            if(JSON.stringify(pass[0].password)==`"${password}"` ){
                connection.query(queryString2,[phone],(err,rows)=>{
                    if(err){
                        res.send(err)
                    }else{
                        var {customerNumber, shopName, contactLastName, contactFirstName, phone}=rows[0];
                        var data ={customerNumber, shopName, contactLastName, contactFirstName, phone}
                        var token = jwt(data,secret)
                        res.status(200).json({token,success:true})
                    }
                })
            }else{
                res.json({msg:"Check User Name and Password 😒"})
            }
        }
    })
})

// Customer SignUp
app.post('/userSignup',(req,res)=>{
    const {shopName,password,phone,contactFirstName,contactLastName}=req.body;
    var customerNumber = `${Math.floor(Math.random() * 9999)}`
    // connection
    const queryString="INSERT INTO `customers` (`customerNumber`, `shopName`, `contactLastName`, `contactFirstName`, `phone`,`password`) VALUES (?, ?, ?, ?, ?, ?)"
    const queryString2="SELECT * FROM `customers` WHERE customerNumber = ?;"
    connection.query(queryString,[customerNumber,shopName,contactLastName,contactFirstName,phone,password],(err)=>{
        if(err){
            // res.json({error:err,status:"Error"})
            err.code == "ER_DUP_ENTRY" ? res.json({msg:"Number already registered 👍"}) :null
        } else {
            connection.query(queryString2,[customerNumber],(ee,rr)=>{
                res.json({data:rr,msg:"SignUp Successful👌",status:"Success"})
            })
        }
    })
})


// All customer list



app.get('/customer',(req,res)=>{

    // ---------------------
    
    // 
    const queryString="SELECT * FROM `customers`;"
    connection.query(queryString,(e,row)=>{
        if(e){
            res.send(e);
            res.end()
        }else{
           res.json(row)
           res.end()
        }
    })

})
//  customer list by credit limit
app.post('/customers',(req,res)=>{
    const high=req.query.h;
    const low=req.query.l;
    // ---------------------

    // 
    const queryString="SELECT * FROM `customers` WHERE (`creditLimit` BETWEEN ? AND ?);"
    connection.query(queryString,[low,high],(e,row)=>{
        console.log("connected db");
        res.json(row);
    })
})

// customer Search By Id
app.get('/customer/searchById/:id',(req,res)=>{

    const userId=req.params.id;

    // ---------------------
    // 
    const queryString="SELECT * FROM `customers` WHERE `customerNumber`=?;"
    connection.query(queryString,[userId],(e,row)=>{
        console.log("connected db");
        res.json(row);
    })
})






/*
    |                       |
    |       Employees       |    
    |                       |
*/
// All Employee
app.get('/employees',(req,res)=>{

    // ---------------------
    // 
    const queryString="SELECT * FROM `employees`;"
    connection.query(queryString,(e,row)=>{
        console.log("connected db");
        res.json(row);
    })
})
// Employee Lis By Company
app.get('/:office_id/employees',(req,res)=>{

    const office_id = req.params.office_id
    // ---------------------
    // 
    const queryString="SELECT `employeeNumber`,`firstName`,`lastName`,`jobTitle` FROM `employees` WHERE `officeCode`=?;"
    connection.query(queryString,[office_id],(e,row)=>{
        console.log("connected db");
        res.json(row);
    })
})
// Report
app.post('/employeesToreport',(req,res)=>{
    const emp_id=req.query.emp_id;
    // ---------------------
    // 
    const queryString="SELECT * FROM `employees` WHERE `employees`.`employeeNumber` IN (SELECT `employees`.`reportsTo` FROM `employees` WHERE employees.employeeNumber = ?)"
    connection.query(queryString,[emp_id],(e,row)=>{
        console.log("connected db");
        res.json(row);
    })
})
// Change Reporter Id
app.put('/reportTochange',(req,res)=>{
    const emp_id=req.query.emp_id;
    const rep_id = req.query.rep_id;
    const queryString= "UPDATE employees SET employees.reportsTo = ? WHERE employees.employeeNumber = ?;"
    const queryString2 = "SELECT firstName,lastName FROM `employees` WHERE `employees`.`employeeNumber` IN (SELECT `employees`.`reportsTo` FROM `employees` WHERE employees.employeeNumber = ?)"
    connection.query(queryString,[rep_id,emp_id],(e)=>{
        console.log("connected db");
        if(e){
            res.send(e)
        } else {
            connection.query(queryString2,[emp_id],(ee,rr)=>{
                res.json(rr)
            })
        }
    })
})
// Change Office Id
app.put('/officeChange',(req,res)=>{
    const emp_id=req.query.emp_id;
    const office_id = req.query.officeCode;
    const queryString= "UPDATE employees SET employees.officeCode = ? WHERE employees.employeeNumber = ?;"
    const queryString2 = "SELECT * FROM `employees` WHERE `employees`.`employeeNumber` = ?;";
    connection.query(queryString,[office_id,emp_id],(e)=>{
        console.log("connected db");
        if(e){
            res.send(e)
        } else {
            connection.query(queryString2,[emp_id],(ee,rr)=>{
                res.json(rr)
            })
        }
    })
})
// Change Extension
app.put('/extensionChange',(req,res)=>{
    const emp_id=req.query.emp_id;
    const extension = req.query.ext;
    const queryString= "UPDATE employees SET employees.extension = ? WHERE employees.employeeNumber = ?;"
    const queryString2 = "SELECT * FROM `employees` WHERE `employees`.`employeeNumber` = ?;";
    connection.query(queryString,[extension,emp_id],(e)=>{
        console.log("connected db");
        if(e){
            res.send(e)
        } else {
            connection.query(queryString2,[emp_id],(ee,rr)=>{
                res.json(rr)
            })
        }
    })
})
// Change Job Title
app.put('/jobTitleChange',(req,res)=>{
    const emp_id=req.query.emp_id;
    const jobTitle = req.query.jobTitle;
    const queryString= "UPDATE employees SET employees.jobTitle = ? WHERE employees.employeeNumber = ?;"
    const queryString2 = "SELECT * FROM `employees` WHERE `employees`.`employeeNumber` = ?;";
    connection.query(queryString,[jobTitle,emp_id],(e)=>{
        console.log("connected db");
        if(e){
            res.send(e)
        } else {
            connection.query(queryString2,[emp_id],(ee,rr)=>{
                res.json(rr)
            })
        }
    })
})

// Add Employee 

app.post('/addEmployee',(req,res)=>{
    // ------------ //
    var employeeNumber= CompanyCode+`${Math.floor(Math.random() * 999)}`;
    const lastName= req.body.lastName;
    const firstName= req.body.firstName;
    const extension= req.body.extension;
    const email= req.body.email;
    const officeCode= req.body.officeCode;
    const reportsTo= req.body.reportsTo;
    const jobTitle= req.body.jobTitle;

    const queryString= "INSERT INTO `employees` (`employeeNumber`, `lastName`, `firstName`, `extension`, `email`, `officeCode`, `reportsTo`, `jobTitle`) VALUES (?, ?, ?, ?, ?, ?, ?, ?);"
    const queryString2="SELECT * FROM `employees` WHERE `employeeNumber`=? ;"
    connection.query(queryString,[employeeNumber,lastName,firstName,extension,email,officeCode,reportsTo === "NULL" ? null : reportsTo,jobTitle],(e)=>{
        console.log("connected db");
        if(e){
            res.send(e)
        } else {
            connection.query(queryString2,[employeeNumber],(ee,rr)=>{
                res.json(rr)
            })
        }
    })
})
// Delete Employee

app.delete('/deleteEmployee',(req,res)=>{
    const emp_id = req.query.emp_id;
    // -------------

    const queryString="DELETE FROM employees WHERE employeeNumber=?;";

    connection.query(queryString,[emp_id],(err)=>{
        if(err){
            res.json({msg:"error",error:err})
        }else{
            res.json({msg:"Delete Successfully 😂"})
        }
    })
})





/*
    |                       |
    |       Offices         |    
    |                       |
*/


// All Office List

app.get('/allOffices',(req,res)=>{
    // -------------

    const queryString="SELECT * FROM `offices`;";

    connection.query(queryString,(err,rows)=>{
        if(err){
            res.json({msg:"error",error:err})
        }else{
            res.json(rows)
        }
    })
})
// All Office List of Country(wise)

app.get('/allOfficesByCountry',(req,res)=>{
    const country = req.query.country ;
    // -------------

    const queryString="SELECT * FROM `offices` WHERE `country` = ?;";

    connection.query(queryString,[country],(err,rows)=>{
        if(err){
            res.json({msg:"error",error:err})
        }else{
            res.json(rows)
        }
    })
})

// Add Office

app.post('/addOffice',(req,res)=>{
    // ------------ //
    var officeCode = CompanyCode+`${Math.floor(Math.random() * 99)}`;
    const city= req.body.city;
    const phone= req.body.phone;
    const addressLine1= req.body.addressLine1;
    const addressLine2= req.body.addressLine2;
    const state= req.body.state;
    const country= req.body.country;
    const postalCode= req.body.postalCode;
    const territory= req.body.territory;

    const queryString= "INSERT INTO `offices` (`officeCode`, `city`, `phone`, `addressLine1`, `addressLine2`, `state`, `country`, `postalCode`, `territory`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);"
    const queryString2="SELECT * FROM `offices` WHERE `officeCode`= ? ;"
    connection.query(queryString,[officeCode,city,phone,addressLine1,addressLine2,state,country,postalCode,territory],(e)=>{
        console.log("connected db");
        if(e){
            res.send(e)
        } else {
            connection.query(queryString2,[officeCode],(ee,rr)=>{
                res.json(rr)
            })
        }
    })
})

// Delete Office

app.delete('/deleteOffice',(req,res)=>{
    const officeCode = req.query.officeCode;
    // -------------

    const queryString="DELETE FROM `offices` WHERE officeCode=?;";

    connection.query(queryString,[officeCode],(err)=>{
        if(err){
            res.json({msg:"error",error:err})
        }else{
            res.json({msg:"Delete Successfully 😂"})
        }
    })
})

