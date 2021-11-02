const express=require("express");
const mysql = require("mysql") 
const morgan =require('morgan')

// --------------
const app=express();
// --------------
app.use(morgan("combined"))
// ------------
app.listen(3001,()=>{
    console.log("Test")
})
// -------------
app.get("/test",(req,res)=>{
    console.log("connected");
    res.send("Test")
})
// --------------MYSQL ----------

app.get('/:id',(req,res)=>{
    const userId=req.params.id;
    // ---------------------
    const con= mysql.createConnection({
        host:"localhost",
        user:'root',
        database:'classicmodels'
    })
    // 
    const queryString="SELECT * FROM `customers` WHERE `customerNumber`=?;"
    con.query(queryString,[userId],(e,row,fil)=>{
        console.log("connected db");
        res.json(row);
    })
})