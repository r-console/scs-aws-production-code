const express = require('express');
const router = express.Router();
const { Console } = require('console');
const fs = require("fs");
const pool = require('../../mysqlConfig');

router.put('/paymentstatus/:id', (req, res) => {
    try{
        console.log('/paymentstatus/:id url called')
        pool.getConnection((err, connection) => {
            if(err) throw err;
            
            connection.query('UPDATE bills SET payment_status = ? WHERE id = ?', 
                            [req.body.pay_status, req.params.id],
                            (err, rows) => {
                connection.release()    //return the connection to the pool

                if(!err){
                    res.send({status:200})
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

//new
router.put('/billpayment/:id', (req, res) => {
    try{
        console.log('/billpayment/:id url called')
        pool.getConnection((err, connection) => {
            if(err) throw err;
            
            connection.query('UPDATE bills SET payment_status = ?, paid_amount=?, discount_amount =?, admin_message=? WHERE id = ?', 
                            [req.body.pay_status, req.body.paid_amount, req.body.discount_amount, req.body.admin_message, req.params.id],
                            (err, rows) => {
                connection.release()    //return the connection to the pool

                if(!err){
                    res.send({status:200})
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

router.post('/getempamounts/:id', (req, res) => {
    try{
        console.log('/getempamounts/:id url called')
    pool.getConnection((err, connection) => {
        if(!err){
            console.log(req.body)
            if(req.body.month != 'ALL'){
                connection.query(`SELECT e.id as id,e.username,e.employee_name, SUM(b.s_charge) AS total_amount,
                                SUM(b.paid_amount) AS paid, 
                                SUM(b.discount_amount) AS discount,
                                payment_status
                                FROM bills b
                                JOIN employee e ON b.employee_id = e.id AND e.branch_id = ? 
                                AND YEAR(bill_date) = ? AND MONTH(bill_date) = ?
                                GROUP BY employee_id,payment_status
                                ORDER BY employee_id`, [req.params.id,req.body.year,req.body.month], (err, rows) => {
                    connection.release()    //return the connection to the pool

                    if(!err){
                        if (rows.length != 0) {
                            res.status(200).send({empbills:rows,status:200})
                        }
                        else{
                            res.send({status:300})
                        }
                    }
                    else{
                        console.log(err)
                    }
                })
            }else{
                connection.query(`SELECT e.id as id,e.username,e.employee_name, SUM(b.s_charge) AS total_amount,
                                SUM(b.paid_amount) AS paid, 
                                SUM(b.discount_amount) AS discount,
                                payment_status
                                FROM bills b
                                JOIN employee e ON b.employee_id = e.id AND e.branch_id = ?
                                AND YEAR(bill_date) = ?
                                GROUP BY employee_id,payment_status
                                ORDER BY employee_id`, [req.params.id,req.body.year], (err, rows) => {
                    connection.release()    //return the connection to the pool

                    if(!err){
                        if (rows.length != 0) {
                            res.status(200).send({empbills:rows,status:200})
                        }
                        else{
                            res.send({status:300})
                        }
                    }
                    else{
                        console.log(err)
                    }
                })
            }
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

// all bills group by employee
router.post('/getallempamounts', (req, res) => {
    try{
        console.log('/getallempamounts url called')
    pool.getConnection((err, connection) => {
        if(!err){
            console.log(req.body)
            if(req.body.month != 'ALL'){
                connection.query(`SELECT e.id as id,e.username,e.employee_name, SUM(b.s_charge) AS total_amount,
                                SUM(b.paid_amount) AS paid, 
                                SUM(b.discount_amount) AS discount,
                                payment_status
                                FROM bills b
                                JOIN employee e ON b.employee_id = e.id
                                AND YEAR(bill_date) = ? AND MONTH(bill_date) = ?
                                GROUP BY employee_id,payment_status
                                ORDER BY employee_id`, [req.body.year,req.body.month], (err, rows) => {
                    connection.release()    //return the connection to the pool

                    if(!err){
                        if (rows.length != 0) {
                            res.status(200).send({empbills:rows,status:200})
                        }
                        else{
                            res.send({status:300})
                        }
                    }
                    else{
                        console.log(err)
                    }
                })
            }else{
                connection.query(`SELECT e.id as id,e.username,e.employee_name, SUM(b.s_charge) AS total_amount,
                                SUM(b.paid_amount) AS paid, 
                                SUM(b.discount_amount) AS discount,
                                payment_status
                                FROM bills b
                                JOIN employee e ON b.employee_id = e.id
                                AND YEAR(bill_date) = ?
                                GROUP BY employee_id,payment_status
                                ORDER BY employee_id`, [req.body.year], (err, rows) => {
                    connection.release()    //return the connection to the pool

                    if(!err){
                        if (rows.length != 0) {
                            res.status(200).send({empbills:rows,status:200})
                        }
                        else{
                            res.send({status:300})
                        }
                    }
                    else{
                        console.log(err)
                    }
                })
            }
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

module.exports = router;