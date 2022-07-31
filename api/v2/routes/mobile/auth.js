const express = require('express');
const router = express.Router();
const { Console } = require('console');
const fs = require("fs");
const pool = require('../../mysqlConfig');

// const myLogger = new Console({
//     stdout: fs.createWriteStream("access.txt"),
//     stderr: fs.createWriteStream("errors.txt"),
// });

router.post('/login', (req, res, next) => {
    try{
        console.log(`mobile /login ${req.body}`)
        myLogger.log(`mobile /login ${req.body}`);
        pool.getConnection((err, connection) => {
            if(err) throw err;
            
            const { username, password } = req.body

            connection.query('SELECT * FROM employee WHERE username = ? AND password = ?', [username, password], (err, rows) => {
                connection.release()    //return the connection to the pool

                if(!err){
                    if (rows.length != 0) {
                        const userData = {
                            id: rows[0].id,
                            name: rows[0].employee_name,
                            branch: rows[0].branch_id,
                            last_invoice_id:rows[0].last_invoice_id
                        }
                        res.status(200).send({userData:userData,status:200})
                    }else{
                        console.log('user not found');
                        myLogger.error("mobile /login user not found");
                        res.status(300).send({status:300})
                    }
                }
                else{
                    res.status(500).send({status:500})
                }
            })
            
        })
    }
    catch (error) {
        myLogger.error("mobile /login catch error");
        console.log(error)
        res.status(500).send({status:300})
    }
});

router.post('/test', (req, res, next) => {
    console.log(req.body)
    res.status(200).send({msg:200})
})

module.exports = router;