const express = require('express');
const router = express.Router();
const { Console } = require('console');
const fs = require("fs");
const pool = require('../../mysqlConfig');

router.get('/total/:id', (req, res) => {
    try{
        console.log('/total/:id url called')
        pool.getConnection((err, connection) => {
            if(err) throw err;
            
            connection.query('SELECT count(*) as total FROM bills WHERE employee_id = ?', [req.params.id], (err, rows) => {
                connection.release()    //return the connection to the pool

                if(!err){
                    res.send({total:rows[0].total})
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

router.get('/month/:id', (req, res) => {
    try{
        console.log('/month/:id/:month url called')
        pool.getConnection((err, connection) => {
            if(err) throw err;
            
            connection.query('SELECT count(*) as tot FROM bills WHERE employee_id = ? AND MONTH(bill_date) = MONTH(CURDATE()) AND YEAR(bill_date) = YEAR(CURDATE())', [req.params.id], (err, rows) => {
                connection.release()    //return the connection to the pool

                if(!err){
                    // const total = rows.length;
                    res.send({total:rows[0].tot})
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

router.get('/today/:id', (req, res) => {
    try{
        console.log('/today/:id url called')
        pool.getConnection((err, connection) => {
            if(err) throw err;
            
            connection.query('SELECT count(*) as tot FROM bills WHERE employee_id = ? AND DATE(bill_date) = CURDATE()', [req.params.id], (err, rows) => {
                connection.release()    //return the connection to the pool

                if(!err){
                    // const total = rows.length;
                    res.send({total:rows[0].tot})
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