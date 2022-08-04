const express = require('express');
const router = express.Router();
const { Console } = require('console');
const fs = require("fs");
const pool = require('../../mysqlConfig');

router.post('/getbillsrange/:userid', (req, res) => {
    try{
        console.log('/getbillsrange/:userid url called')
        pool.getConnection((err, connection) => {
            if(err) throw err;
            
            console.log(req.body)
            
            connection.query('SELECT * FROM bills WHERE employee_id = ? AND ( bill_date >= ? AND bill_date <= ?)', 
                            [req.params.userid, req.body.date1,req.body.date2], (err, rows) => {
                connection.release()    //return the connection to the pool

                if(!err){
                    res.send(rows)
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
});

// get searched record from post method
router.post('/getbill/:id', (req, res) => {
    try{
        console.log('/getbill/:id url called')
        pool.getConnection((err, connection) => {
            if(err) throw err;
            
            console.log(req.body)

            if(req.body.search != '')
            {
                connection.query(`SELECT * FROM employee WHERE id = ?`, 
                                [req.params.id], (err, rowdata) => {
                                    console.log(rowdata[0].branch_id)
                    if(rowdata[0].employee_name == "HO" || rowdata[0].employee_name == "BO"){
                        connection.query(`SELECT b.*,e.branch_id,e.employee_name FROM bills b
                                        JOIN employee e ON b.employee_id = e.id
                                        WHERE b.invoice_id = ? AND e.branch_id = ?`, 
                                        [req.body.search, rowdata[0].branch_id], (err, rows) => {
                        connection.release()    //return the connection to the pool

                            if(!err){
                                console.log('first box')
                                console.log(rows)
                                if (rows.length != 0) {
                                    res.send(rows[0])
                                }
                                else{
                                    res.send({status:300})
                                }
                            }
                            else{
                                console.log(err)
                                res.send({status:300})
                            }
                        })
                    }
                    else{
                        connection.query(`SELECT * FROM bills WHERE (customer_phoneno = ? OR invoice_id = ? OR customer_name= ?)  AND employee_id = ?`, 
                                        [req.body.search,req.body.search,req.body.search,req.params.id], (err, rows) => {
                        connection.release()    //return the connection to the pool

                            if(!err){
                                console.log(rows)
                                if (rows.length != 0) {
                                    res.send(rows[0])
                                }
                                else{
                                    res.send({status:300})
                                }
                            }
                            else{
                                console.log(err)
                                res.send({status:300})
                            }
                        })
                    }
            })
            }
            else{
                res.send({status:300})
            }
        })
    }
    catch (error) {
        console.log(error)
        res.status(500).send({status:300})
    }
});

// get blob file s_sign
router.get('/getsersign/:id', (req, res) => {
    try{
        console.log('/getsersign/:id url called')
        pool.getConnection((err, connection) => {
            if(err) throw err;
            
            console.log('s_sign called')
            connection.query('SELECT s_sign FROM bills WHERE id = ?', [req.params.id], (err, rows) => {
                connection.release()    //return the connection to the pool

                if(!err){
                    console.log('s_sign work fine')
                    res.send(rows[0].s_sign)
                }
                else{
                    console.log('s_sign error')
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

// get blob file c_sign
router.get('/getcussign/:id', (req, res) => {
    try{
        console.log('/getcussign/:id url called')
        pool.getConnection((err, connection) => {
            if(err) throw err;
            
            console.log('c_sign called')
            connection.query('SELECT c_sign FROM bills WHERE id = ?', [req.params.id], (err, rows) => {
                connection.release()    //return the connection to the pool

                if(!err){
                    res.send(rows[0].c_sign)
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
});

// get machine derails
router.get('/getmachinedetails/:id', (req, res) => {
    try{
        console.log('/getmachinedetails/:id url called')
        pool.getConnection((err, connection) => {
            if(err) throw err;
            
            connection.query('SELECT * FROM machine WHERE bill_id = ?', [req.params.id], (err, rows) => {
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
});

router.get('/branch/:id', (req, res) => {
    try{
        console.log('/branch/:id url called')
        pool.getConnection((err, connection) => {
        if(err) throw err;
        
        connection.query('SELECT branch_name FROM branch WHERE id = ?', [req.params.id], (err, rows) => {
            connection.release()    //return the connection to the pool

            if(!err){
                if (rows.length != 0) {
                    res.send({branch_name:rows[0].branch_name})
                }
                else{
                    res.send({status:300})
                }
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