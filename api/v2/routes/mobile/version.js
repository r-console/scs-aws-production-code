const express = require('express');
const router = express.Router();
const { Console } = require('console');
const fs = require("fs");
const pool = require('../../mysqlConfig');

// const myLogger = new Console({
//     stdout: fs.createWriteStream("access.txt"),
//     stderr: fs.createWriteStream("errors.txt"),
// });

// version check
router.get('/versioncheck', (req, res) => {
    try{
        console.log('/versioncheck url called')
        pool.getConnection((err, connection) => {
            if(err) throw err;
            
            connection.query(`SELECT * FROM app_version`, (err, rows) => {
                connection.release()    //return the connection to the pool

                if(!err){
                    res.status(200).send({version:rows[0],status:200})
                }
                else{
                    console.log(err)
                    res.send({status:300})
                }
            })
        })
    }
    catch (error) {
        console.log(error)
        res.status(500).send({status:300})
    }
})

module.exports = router;