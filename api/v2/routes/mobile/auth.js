const express = require('express');
const router = express.Router();

// const mysql = require('mysql')

const pool = require('../../mysqlConfig');

router.post('/login', (req, res, next) => {
    try{
        console.log(`/login ${req.body}`)
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
                        console.log('Nothing match');
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
        console.log(error)
        res.status(500).send({status:300})
    }
});

function calculateFibonacciValue(number) {
    var s = 0;
    var returnValue;

    if (number == 0) {
        return (s);
    }
    if (number == 1) {
        s += 1;
        return (s);
    }
    else {
        return (calculateFibonacciValue(number - 1) + calculateFibonacciValue(number - 2));
    }
}

router.post('/err/:id', (req, res, next) => {
    let n = req.params.id
    let a = calculateFibonacciValue(n)
    res.send({val:a})
})

router.post('/hello', (req, res, next) => {
    res.status(200).send({msg:'hello'})
})

module.exports = router;