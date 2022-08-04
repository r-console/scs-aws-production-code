const express = require('express');
const router = express.Router();
const { Console } = require('console');
const fs = require("fs");
const pool = require('../../mysqlConfig');

router.get('/totalbillscount/:branchid', (req, res) => {
    try{
        pool.getConnection((err, connection) => {
            if(!err){
                
                connection.query(`SELECT count(*) as total_bills FROM bills JOIN employee ON employee.id = bills.employee_id 
                                AND employee.branch_id = ?`, [req.params.branchid], (err, rows) => {
                    connection.release()    //return the connection to the pool

                    if(!err){
                        res.send({total:rows[0].total_bills,status:200})
                    }
                    else{
                        console.log(err)
                        res.send({status:300})
                    }
                })
            }else{
                res.send({msg:'Database not connected',status:300})
                console.log('Database not connected')
            }
        })
    }
    catch (error) {
        console.log(error)
        res.status(500).send({status:300})
    }
})

// dashboard box2
router.get('/monthbillscount/:branchid/:month', (req, res) => {
    try{
        pool.getConnection((err, connection) => {
            if(!err){
                
                connection.query(`SELECT count(*) as month_bills FROM bills JOIN employee 
                                ON bills.employee_id = employee.id AND employee.branch_id = ? AND MONTH(bill_date) = ?`, 
                                [req.params.branchid, req.params.month], (err, rows) => {
                    connection.release()    //return the connection to the pool

                    if(!err){
                        res.send({total:rows[0].month_bills,status:200})
                    }
                    else{
                        console.log(err)
                        res.send({status:300})
                    }
                })
            }else{
                res.send({msg:'Database not connected',status:300})
                console.log('Database not connected')
            }
        })
    }
    catch (error) {
        console.log(error)
        res.status(500).send({status:300})
    }
})

// dashboard box3
router.get('/totalpendingcount/:branchid', (req, res) => {
    try{
        pool.getConnection((err, connection) => {
            if(!err){
                
                let pend = "PENDING";
                connection.query(`SELECT count(*) as total_bills FROM bills JOIN employee ON employee.id = bills.employee_id 
                                AND employee.branch_id = ? AND bills.payment_status = ?`, [req.params.branchid,pend], (err, rows) => {
                    connection.release()    //return the connection to the pool

                    if(!err){
                        res.send({total:rows[0].total_bills,status:200})
                    }
                    else{
                        console.log(err)
                        res.send({status:300})
                    }
                })
            }else{
                res.send({msg:'Database not connected',status:300})
                console.log('Database not connected')
            }
        })
    }
    catch (error) {
        console.log(error)
        res.status(500).send({status:300})
    }
})

// recieved
router.get('/totalrecievedcount/:branchid', (req, res) => {
    try{
        pool.getConnection((err, connection) => {
            if(!err){
                
                let rec = "RECEIVED";
                connection.query(`SELECT count(*) as total_bills FROM bills JOIN employee ON employee.id = bills.employee_id 
                                AND employee.branch_id = ? AND bills.payment_status = ?`, [req.params.branchid,rec], (err, rows) => {
                    connection.release()    //return the connection to the pool

                    if(!err){
                        res.send({total:rows[0].total_bills,status:200})
                    }
                    else{
                        console.log(err)
                        res.send({status:300})
                    }
                })
            }else{
                res.send({msg:'Database not connected',status:300})
                console.log('Database not connected')
            }
        })
    }
    catch (error) {
        console.log(error)
        res.status(500).send({status:300})
    }
})

// completed
router.get('/totalcompletedcount/:branchid', (req, res) => {
    try{
        pool.getConnection((err, connection) => {
            if(!err){
                
                let rec = "COMPLETED";
                connection.query(`SELECT count(*) as total_bills FROM bills JOIN employee ON employee.id = bills.employee_id 
                                AND employee.branch_id = ? AND bills.payment_status = ?`, [req.params.branchid,rec], (err, rows) => {
                    connection.release()    //return the connection to the pool

                    if(!err){
                        res.send({total:rows[0].total_bills,status:200})
                    }
                    else{
                        console.log(err)
                        res.send({status:300})
                    }
                })
            }else{
                res.send({msg:'Database not connected',status:300})
                console.log('Database not connected')
            }
        })
    }
    catch (error) {
        console.log(error)
        res.status(500).send({status:300})
    }
})

// dasdhboard box4
router.get('/todaybillscount/:branchid', (req, res) => {
    try{
        pool.getConnection((err, connection) => {
            if(err) throw err;
            
            connection.query(`SELECT count(*) as total FROM bills JOIN employee 
                        ON bills.employee_id = employee.id AND employee.branch_id = ? AND DATE(bill_date) = CURDATE()`, [req.params.branchid], (err, rows) => {
                connection.release()    //return the connection to the pool

                if(!err){
                    res.send({total:rows[0].total,status:200})
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