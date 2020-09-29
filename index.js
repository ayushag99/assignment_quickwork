// Importing dependencies
const express = require('express');
const app = express();

// Setting up constants and enviroment variables
const PORT = process.env.PORT || 3000;


// ROUTES

// HERE:
// @desc    Testing Route
// @type    GET
// @path    /
app.get('/',(req,res)=>[
    res.send("App is running fine...")
])





app.listen(PORT, ()=>{console.log(`App is running on port ${PORT}...`)})