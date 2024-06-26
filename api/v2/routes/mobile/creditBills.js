const express = require('express');
const router = express.Router();
const pool = require('../../mysqlConfig');

// get credit bills for employees
router.get('/mycreditbills/:userid', (req, res) => {
    try{
        console.log('/mycreditbills/:userid url called')
        pool.getConnection((err, connection) => {
            if(err) throw err;
            
            const payment_status = 'PENDING'
            const payment_method = 'Credit'

            connection.query('SELECT * FROM bills WHERE employee_id = ? AND payment_status = ? AND payment_method= ?', [req.params.userid, payment_status, payment_method], (err, rows) => {
                connection.release()    //return the connection to the pool

                if(!err){
                    res.send(rows)
                }
                else{
                    console.log(err)
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