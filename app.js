const express = require('express')
const bodyParser = require('body-parser')
const mysql = require('mysql')
const morgan = require('morgan')
const cors = require('cors')
// image upload
const { v4: uuidv4 } = require('uuid');
const fs = require('fs')
const util = require('util')
const unlinkFile = util.promisify(fs.unlink)
const multer  = require('multer')
const upload = multer({ dest: 'uploads/' })

const { uploadFile, getFileStream, deleteFile, uploadBase64 } = require('./s3');
const { param } = require('express/lib/request');

const app = express()
app.use(morgan('dev'))
app.use(cors())

app.use(bodyParser.urlencoded({ extended: false, limit: '10mb' }))
app.use(bodyParser.json({ limit: '10mb' }))

// MySQL
const pool = mysql.createPool({
    connectionLimit: 10,
    host:'scs-appservice-database.cuies1xmg40c.ap-south-1.rds.amazonaws.com',
    user:'scs2021admin',
    password:'nodejs#$#878',
    database:'scsappdbservices'

    // host:'localhost',
    // user:'root',
    // password:'',
    // database:'SCSbilling'

    // username and password
    // scs2021admin
    // nodejs#$#878
    
    // dbname
    // scsappdbservices

    // aws database
    // host:'scs-appservice-database.cuies1xmg40c.ap-south-1.rds.amazonaws.com',
    // user:'scs2021admin',
    // password:'nodejs#$#878',
    // database:'scsappdbservices'
})

// app login
app.post('/login', (req, res) => {
    try {
        console.log('/login url called')
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
                    res.send({userData:userData,status:200})
                  }else{
                    console.log('Nothing match');
                    res.send({status:300})
                  }
            }
            else{
                console.log(err)
            }
        })

        console.log(req.body)
    })
    }
    catch (error) {
        console.log(error)
        res.status(500).send({status:300})
    }
})

// add bill
app.post('/addbill', (req, res) => {
    try{
        console.log('/addbill url called')
    pool.getConnection( async (err, connection) => {
        if(err) throw err;
        
        const params = req.body

        const Sersign = param.s_sign
        const Cussign = param.c_sign

        let s_sign_name = uuidv4()
        let c_sign_name = uuidv4()

        buf1 = Buffer.from(req.body.Bill.s_sign.replace(/^data:image\/\w+;base64,/, ""),'base64')
        const result1 = await uploadBase64(buf1, s_sign_name)
        if(result1 === 0){
            buf2 = Buffer.from(req.body.Bill.c_sign.replace(/^data:image\/\w+;base64,/, ""),'base64')
            const result2 = await uploadBase64(buf2, c_sign_name)
            if(result2 === 0){
                params.Bill.s_sign = s_sign_name
                params.Bill.c_sign = c_sign_name

                if(params.Bill.customer_phoneno == 0 || params.Bill.customer_phoneno == '0' || params.Bill.customer_phoneno == ''){
                    params.Bill.customer_phoneno = null;
                }
                connection.query('INSERT INTO bills SET ?', params.Bill, (err, rows) => {
                    // connection.release()    //return the connection to the pool

                    const insert_id = rows.insertId

                    if(!err){
                        connection.query('UPDATE employee SET last_invoice_id = ? WHERE id = ?', [params.last_invoice_id, params.Bill.employee_id], (err, rows) => {
                            
                            if(!err){

                                connection.query('INSERT INTO machine (machineModel, partNo, bill_id) VALUES ?', 
                                [params.machineDetails.map(item => [item.machineModel, item.partNo, insert_id ])],
                                (err, mrows) => {
                                    connection.release()    //return the connection to the pool
                        
                                    if(!err){
                                        res.send({message:"Successfully inserted bill details and machine details", status:200})
                                    }
                                    else{
                                        console.log(err)
                                        res.send({message:"some error", status:500})
                                    }
                                })
                            }
                        })
                        
                    }
                    else{
                        console.log(err)
                        res.send({message:"some error", status:500})
                    }
                })
            }
            else{
                
            }            
        }
        else{
            
        }

    })
    }
    catch (error) {
        console.log(error)
        res.status(500).send({status:300})
    }
})

// add multiple offline billdata
app.post('/addofflinebill', (req, res) => {
    try{
        console.log('/addofflinebill url called')
    pool.getConnection((err, connection) => {
        if(err) throw err;
        
        const params = req.body.offlineBills
        let inserted = 0;
        // console.log(params)
        params.map( async (item)=>{
            
            let s_sign_name = uuidv4()
            let c_sign_name = uuidv4()

            buf1 = Buffer.from(item.Bill.s_sign.replace(/^data:image\/\w+;base64,/, ""),'base64')
            const result1 = await uploadBase64(buf1, s_sign_name)
            if(result1 === 0){
                buf2 = Buffer.from(item.Bill.c_sign.replace(/^data:image\/\w+;base64,/, ""),'base64')
                const result2 = await uploadBase64(buf2, c_sign_name)
                if(result2 === 0){
                    item.Bill.s_sign = s_sign_name
                    item.Bill.c_sign = c_sign_name
          
                    connection.query('INSERT INTO bills SET ?', item.Bill, (err, rows) => {
                        if(!err){

                            let iv_id = item.last_invoice_id;
                            let ins_bill_id = rows.insertId;

                            connection.query('UPDATE employee SET last_invoice_id = ? WHERE id = ?', [iv_id, item.Bill.employee_id], (err, rows) => {
                                if(!err){
                                    connection.query('INSERT INTO machine (machineModel, partNo, bill_id) VALUES ?', 
                                    [item.machineDetails.map(item => [item.machineModel, item.partNo, ins_bill_id ])],
                                    (err, mrows) => {
                                        if(err){
                                            console.log(err)
                                            inserted = 1;
                                        }
                                    })
                                }
                            })
                        }
                        else{
                            console.log(err)
                            inserted = 1;
                        }
                    })
                }
            }
        })

        if(inserted == 0){
            res.send({message:"Successfully inserted bill details and machine details", status:200})
        }
        else{
            res.send({message:"some error", status:500})
        }

    })
    }
    catch (error) {
        console.log(error)
        res.status(500).send({status:300})
    }
})

// update last invoice id
app.put('/updateinvoice', (req, res) => {
    try{
    console.log('/updateinvoice url called')
    pool.getConnection((err, connection) => {
        if(err) throw err;
        
        const { employee_id, last_invoice_id } = req.body

        connection.query('UPDATE employee SET last_invoice_id = ? WHERE id = ?', [last_invoice_id, employee_id], (err, rows) => {
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
})

// branch
app.get('/branch/:id', (req, res) => {
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

// get employee bills data for dashboard
app.get('/dashboard/total/:id', (req, res) => {
    try{
        console.log('/dashboard/total/:id url called')
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

app.get('/dashboard/month/:id/:month', (req, res) => {
    try{
        console.log('/dashboard/month/:id/:month url called')
    pool.getConnection((err, connection) => {
        if(err) throw err;
        
        connection.query('SELECT id FROM bills WHERE employee_id = ? AND MONTH(bill_date) = ?', [req.params.id, req.params.month], (err, rows) => {
            connection.release()    //return the connection to the pool

            if(!err){
                const total = rows.length;
                res.send({total:total})
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

app.get('/dashboard/today/:id', (req, res) => {
    try{
        console.log('/dashboard/today/:id url called')
    pool.getConnection((err, connection) => {
        if(err) throw err;
        
        connection.query('SELECT id FROM bills WHERE employee_id = ? AND DATE(bill_date) = CURDATE()', [req.params.id], (err, rows) => {
            connection.release()    //return the connection to the pool

            if(!err){
                const total = rows.length;
                res.send({total:total})
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

// update pending status
app.put('/paymentstatus/:id', (req, res) => {
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
})

// get all records
app.get('/lastservices/:id', (req, res) => {
    try{
        console.log('/lastservices/:id url called')
    pool.getConnection((err, connection) => {
        if(err) throw err;
        
        connection.query('SELECT customer_name, customer_phoneno, invoice_id ,bill_date FROM bills WHERE (employee_id = ? AND bill_date BETWEEN NOW() - INTERVAL 30 DAY AND NOW() ) ORDER BY id DESC', [req.params.id], (err, rows) => {
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

app.post('/getbillsrange/:userid', (req, res) => {
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
})

// get searched record from post method
app.post('/getbill/:id', (req, res) => {
    try{
        console.log('/getbill/:id url called')
    pool.getConnection((err, connection) => {
        if(err) throw err;
        
        console.log(req.body)

        if(req.body.search != '')
        {
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
        else{
            res.send({status:300})
        }
    })
}
catch (error) {
    console.log(error)
    res.status(500).send({status:300})
}
})

// get blob file s_sign
app.get('/getsersign/:id', (req, res) => {
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
app.get('/getcussign/:id', (req, res) => {
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
})

// get machine derails
app.get('/getmachinedetails/:id', (req, res) => {
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
})

// get credit bills for employees
app.get('/mycreditbills/:userid', (req, res) => {
    try{
        console.log('/mycreditbills/:userid url called')
    pool.getConnection((err, connection) => {
        if(err) throw err;
        
        const payment_status = 'PENDING'

        connection.query('SELECT * FROM bills WHERE employee_id = ? AND payment_status = ?', [req.params.userid, payment_status], (err, rows) => {
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

// web login
app.post('/weblogin', (req, res) => {
    try{
        console.log('/weblogin url called')
    pool.getConnection((err, connection) => {
        if(err) throw err;
        
        const { username, password } = req.body

        connection.query('SELECT * FROM admin_table WHERE username = ? AND password = ?', [username, password], (err, rows) => {
            if(!err){
            if(rows.length != 0){
                if(rows[0].account_type == 1){
                    connection.query('SELECT branch_name FROM branch WHERE id = ?', [rows[0].branch_id], (err, data) => {
                        connection.release()    //return the connection to the pool
            
                        if(!err){
                            if(data.length != 0){
                                const userData = {
                                    id: rows[0].id,
                                    name: rows[0].name,
                                    username: rows[0].username,
                                    branch_id: rows[0].branch_id,
                                    account_type: rows[0].account_type,
                                    branch_name: data[0].branch_name
                                }
                                res.send({userData:userData,status:200})
                            }
                            else{
                                res.send({status:400})
                            }
                        }
                        else{
                            res.send({status:300})
                        }
                    })
                }
                else{
                    const userData = {
                        id: rows[0].id,
                        name: rows[0].name,
                        username: rows[0].username,
                        branch_id: rows[0].branch_id,
                        account_type: rows[0].account_type
                    }
                    res.send({userData:userData,status:200})
                }
            }else{
                res.send({status:300})
            }
            }
            else{
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

// add branch manager
app.post('/addmanager',(req, res)=>{
    try{
        console.log('/addmanager url called')
    pool.getConnection((err,connection)=>{
        if(err)throw err;
        console.log(`connected as id ${connection.threadId}`)

        const params=req.body
        connection.query('INSERT INTO admin_table SET ?',params,(err, rows)=>{
            connection.release();
            if(!err)
            {
                res.send({status:200})
            }
            else{
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

// add branch
app.post('/addbranch',(req, res)=>{
    try{
        console.log('/addbranch url called')
    pool.getConnection((err,connection)=>{
        if(err)throw err;
        console.log(`connected as id ${connection.threadId}`)

        const params=req.body
        connection.query('INSERT INTO branch SET ?',params,(err, rows)=>{
            connection.release();
            if(!err)
            {
                res.send({status:200})
            }
            else{
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

app.get('/getmanagers/:adminid', (req, res) => {
    try{
        console.log('/getmanagers/:adminid url called')
    pool.getConnection((err, connection) => {
        if(err) throw err;
        
        connection.query(`SELECT admin_table.*, branch.branch_name FROM admin_table JOIN branch ON branch.id = admin_table.branch_id AND admin_table.id <> ?`, [req.params.adminid], (err, rows) => {
            connection.release()    //return the connection to the pool

            if(!err){
                res.send({managers:rows,status:200})
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

// get all branches
app.get('/allbranchs', (req, res) => {
    try{
        console.log('/allbranchs url called')
    pool.getConnection((err, connection) => {
        if(!err){
            
            connection.query('SELECT * FROM branch', (err, rows) => {
                connection.release()    //return the connection to the pool

                if(!err){
                    if (rows.length != 0) {
                        res.send({branchs:rows,status:200})
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

// update branch name
app.put('/updatebranch', (req, res) => {
    try{
        console.log('/updatebranch url called')
    pool.getConnection((err, connection) => {
        if(!err){
            
            const data = req.body.currentBch

            connection.query('UPDATE branch SET branch_name = ?  WHERE id = ?', 
                            [data.branch_name, data.id],
                            (err, rows) => {
                connection.release()    //return the connection to the pool

                if(!err){
                    res.send({status:200})
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

// delete branch
app.delete('/delbranch/:branchid', (req, res) => {
    try{
        console.log('/delbranch/:branchid url called')
    pool.getConnection((err, connection) => {
        if(!err){
            
            connection.query('DELETE FROM branch WHERE id = ?', [req.params.branchid], (err, rows) => {
                connection.release()    //return the connection to the pool

                if(!err){
                    res.send({status:200})
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

app.delete('/delbill/:billid', (req, res) => {
    try{
        console.log('/delbill/:billid url called')
    pool.getConnection((err, connection) => {
        if(!err){
            connection.query('SELECT * FROM bills WHERE id = ?', [req.params.billid], (err, bill) => {
                if(!err){
                    
                    // await deleteFile(bill[0].s_sign)
                    // await deleteFile(bill[0].c_sign)

                    connection.query('DELETE FROM machine WHERE bill_id = ?', [req.params.billid], (err, rows) => {
                        
                        if(!err){
                            connection.query('DELETE FROM bills WHERE id = ?', [req.params.billid], (err, rows) => {
                                connection.release()    //return the connection to the pool
                
                                if(!err){
                                    res.send({status:200})
                                }
                                else{
                                    console.log(err)
                                    res.send({status:300})
                                }
                            })
                        }
                        else{
                            console.log(err)
                            res.send({status:300})
                        }
                    })
                }else{
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

app.put('/updatemanager', (req, res) => {
    try{
    pool.getConnection((err, connection) => {
        if(!err){
            
            const data = req.body.currentMng

            connection.query('UPDATE admin_table SET name = ?, username= ?, password=?  WHERE id = ?', 
                            [data.name, data.username, data.password, data.id],
                            (err, rows) => {
                connection.release()    //return the connection to the pool

                if(!err){
                    res.send({status:200})
                }
                else{
                    console.log(err)
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

// delete manager
app.delete('/delmanager/:managerid', (req, res) => {
    try{
    pool.getConnection((err, connection) => {
        if(!err){
            
            connection.query('DELETE FROM admin_table WHERE id = ?', [req.params.managerid], (err, rows) => {
                connection.release()    //return the connection to the pool

                if(!err){
                    res.send({status:200})
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
// admin section end

// manager accounts section
// dashboard box1
app.get('/totalbillscount/:branchid', (req, res) => {
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
app.get('/monthbillscount/:branchid/:month', (req, res) => {
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
app.get('/totalpendingcount/:branchid', (req, res) => {
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
app.get('/totalrecievedcount/:branchid', (req, res) => {
    try{
    pool.getConnection((err, connection) => {
        if(!err){
            
            let rec = "RECIEVED";
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
app.get('/totalcompletedcount/:branchid', (req, res) => {
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
app.get('/todaybillscount/:branchid', (req, res) => {
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

// get bills by branch
app.post('/getbranchbills', (req, res) => {
    try{
    pool.getConnection((err, connection) => {
        if(err) throw err;
        
        const params = req.body
        console.log(req.body)
        if(params.searchType != 'ALL'){
            if(params.searchText != '' && params.date1 !=null && params.date2 != null){
                connection.query(`SELECT bills.*, employee.employee_name FROM bills 
                                JOIN employee ON (bills.employee_id = employee.id) 
                                AND (employee.branch_id = ? AND (bills.bill_date >= ? AND bills.bill_date <= ?)) 
                                AND (bills.customer_name = ? OR bills.invoice_id = ? OR bills.customer_phoneno = ? OR employee.employee_name=?)
                                AND payment_status = ?`,
                                [params.branch_id, params.date1, params.date2, params.searchText, params.searchText, params.searchText, params.searchText, params.searchType,],
                                (err, rows) => {
                    connection.release()    //return the connection to the pool
    
                    if(!err){
                        res.send({bills:rows,status:200})
                    }
                    else{
                        console.log(err)
                        res.send({status:300})
                    }
                })
            }else if(params.searchText == '' && params.date2 != null && params.date2 !=null){
                connection.query(`SELECT bills.*, employee.employee_name FROM bills 
                                JOIN employee ON (bills.employee_id = employee.id) 
                                AND (employee.branch_id = ? AND (bills.bill_date >= ? AND bills.bill_date <= ?))
                                AND payment_status = ?`,
                            [params.branch_id, params.date1, params.date2, params.searchType],
                            (err, rows) => {
                    connection.release()    //return the connection to the pool
    
                    if(!err){
                        res.send({bills:rows,status:200})
                    }
                    else{
                        console.log(err)
                        res.send({status:300})
                    }
                })
            }
            else{
                connection.query(`SELECT bills.*, employee.employee_name FROM bills 
                                JOIN employee ON (bills.employee_id = employee.id) 
                                AND (employee.branch_id = ? AND (bills.customer_name = ? OR bills.customer_phoneno = ? OR bills.invoice_id = ? OR employee.employee_name=?))
                                AND payment_status = ?`,
                            [params.branch_id, params.searchText, params.searchText, params.searchText, params.searchText, params.searchType], 
                            (err, rows) => {
                    connection.release()    //return the connection to the pool
    
                    if(!err){
                        res.send({bills:rows,status:200})
                    }
                    else{
                        console.log(err)
                        res.send({status:300})
                    }
                })
            }
        }
        else{
            if(params.searchText != '' && params.date1 !=null && params.date2 != null){
                connection.query(`SELECT bills.*, employee.employee_name FROM bills 
                                JOIN employee ON (bills.employee_id = employee.id) 
                                AND (employee.branch_id = ? AND (bills.bill_date >= ? AND bills.bill_date <= ?)) 
                                AND (bills.customer_name = ? OR bills.invoice_id = ? OR bills.customer_phoneno = ? OR employee.employee_name=?)`,
                                [params.branch_id, params.date1, params.date2, params.searchText, params.searchText, params.searchText, params.searchText],
                                (err, rows) => {
                    connection.release()    //return the connection to the pool
    
                    if(!err){
                        res.send({bills:rows,status:200})
                    }
                    else{
                        console.log(err)
                        res.send({status:300})
                    }
                })
            }else if(params.searchText == '' && params.date2 != null && params.date2 !=null){
                connection.query(`SELECT bills.*, employee.employee_name FROM bills 
                                JOIN employee ON (bills.employee_id = employee.id) 
                                AND (employee.branch_id = ? AND (bills.bill_date >= ? AND bills.bill_date <= ?))`,
                            [params.branch_id, params.date1, params.date2], 
                            (err, rows) => {
                    connection.release()    //return the connection to the pool
    
                    if(!err){
                        res.send({bills:rows,status:200})
                    }
                    else{
                        console.log(err)
                        res.send({status:300})
                    }
                })
            }
            else{
                connection.query(`SELECT bills.*, employee.employee_name FROM bills 
                                JOIN employee ON (bills.employee_id = employee.id) 
                                AND (employee.branch_id = ? AND (bills.customer_name = ? OR bills.customer_phoneno = ? OR bills.invoice_id = ? OR employee.employee_name=?))`,
                            [params.branch_id, params.searchText, params.searchText, params.searchText, params.searchText], 
                            (err, rows) => {
                    connection.release()    //return the connection to the pool
    
                    if(!err){
                        res.send({bills:rows,status:200})
                    }
                    else{
                        console.log(err)
                        res.send({status:300})
                    }
                })
            }
        }
    })
}
catch (error) {
    console.log(error)
    res.status(500).send({status:300})
}
})

// get all bills admin account
app.post('/allbills', (req, res) => {
    try{
    pool.getConnection((err, connection) => {
        if(err) throw err;
        
        const params = req.body

        if(params.searchType !='ALL'){
            if(params.searchText != '' && (params.date1 !=null || params.date2 != null)){
                connection.query(`SELECT bills.*, employee.employee_name FROM bills 
                                JOIN employee ON (bills.employee_id = employee.id) 
                                AND (bills.bill_date >= ? AND bills.bill_date <= ?)
                                AND (bills.customer_name = ? OR bills.invoice_id = ? OR bills.customer_phoneno = ?)
                                AND payment_status = ?`,
                                [params.date1, params.date2, params.searchText, params.searchText, params.searchText,params.searchType],
                                (err, rows) => {
                    connection.release()    //return the connection to the pool
    
                    if(!err){
                        res.send({bills:rows,status:200})
                    }
                    else{
                        console.log(err)
                        res.send({status:300})
                    }
                })
            }else if(params.searchText == '' && (params.date2 != null || params.date2 !=null)){
                connection.query(`SELECT bills.*, employee.employee_name FROM bills 
                                JOIN employee ON (bills.employee_id = employee.id) 
                                AND bills.bill_date >= ? AND bills.bill_date <= ?
                                AND payment_status = ?`,
                            [params.date1, params.date2, params.searchType], 
                            (err, rows) => {
                    connection.release()    //return the connection to the pool
    
                    if(!err){
                        res.send({bills:rows,status:200})
                    }
                    else{
                        console.log(err)
                        res.send({status:300})
                    }
                })
            }
            else{
                connection.query(`SELECT bills.*, employee.employee_name FROM bills 
                                JOIN employee ON (bills.employee_id = employee.id) 
                                AND (bills.customer_name = ? OR bills.customer_phoneno = ? OR bills.invoice_id = ? )
                                AND payment_status = ?`,
                            [params.searchText, params.searchText, params.searchText, params.searchType], 
                            (err, rows) => {
                    connection.release()    //return the connection to the pool
    
                    if(!err){
                        res.send({bills:rows,status:200})
                    }
                    else{
                        console.log(err)
                        res.send({status:300})
                    }
                })
            }
        }
        else{
            if(params.searchText != '' && (params.date1 !=null || params.date2 != null)){
                connection.query(`SELECT bills.*, employee.employee_name FROM bills 
                                JOIN employee ON (bills.employee_id = employee.id) 
                                AND (bills.bill_date >= ? AND bills.bill_date <= ?)
                                AND (bills.customer_name = ? OR bills.invoice_id = ? OR bills.customer_phoneno = ?)`,
                                [params.date1, params.date2, params.searchText, params.searchText, params.searchText],
                                (err, rows) => {
                    connection.release()    //return the connection to the pool
    
                    if(!err){
                        res.send({bills:rows,status:200})
                    }
                    else{
                        console.log(err)
                        res.send({status:300})
                    }
                })
            }else if(params.searchText == '' && (params.date2 != null || params.date2 !=null)){
                connection.query(`SELECT bills.*, employee.employee_name FROM bills 
                                JOIN employee ON (bills.employee_id = employee.id) 
                                AND bills.bill_date >= ? AND bills.bill_date <= ?`,
                            [params.date1, params.date2], 
                            (err, rows) => {
                    connection.release()    //return the connection to the pool
    
                    if(!err){
                        res.send({bills:rows,status:200})
                    }
                    else{
                        console.log(err)
                        res.send({status:300})
                    }
                })
            }
            else{
                connection.query(`SELECT bills.*, employee.employee_name FROM bills 
                                JOIN employee ON (bills.employee_id = employee.id) 
                                AND (bills.customer_name = ? OR bills.customer_phoneno = ? OR bills.invoice_id = ? )`,
                            [params.searchText, params.searchText, params.searchText], 
                            (err, rows) => {
                    connection.release()    //return the connection to the pool
    
                    if(!err){
                        res.send({bills:rows,status:200})
                    }
                    else{
                        console.log(err)
                        res.send({status:300})
                    }
                })
            }
        }
    })
}
catch (error) {
    console.log(error)
    res.status(500).send({status:300})
}
})

// add employee
app.post('/addemp',(req, res)=>{
    try{
    pool.getConnection((err,connection)=>{
        if(err)throw err;
        console.log(`connected as id ${connection.threadId}`)

        const params=req.body.employee
        console.log(params)
        connection.query('INSERT INTO employee SET ?',params,(err, rows)=>{
            connection.release();
            if(!err)
            {
                res.send({status:200})
            }
            else{
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

// delete employee by id
app.delete('/deleteemp/:id', (req, res) => {
    try{
    pool.getConnection((err, connection) => {
        if(err) throw err;
        
        connection.query('DELETE FROM employee WHERE id = ?', [req.params.id], (err, rows) => {
            connection.release()    //return the connection to the pool

            if(!err){
                res.send({status:200})
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

// get employees by branch id
app.get('/getemp/:branchid', (req, res) => {
    try{
    pool.getConnection((err, connection) => {
        if(err) throw err;
        
        connection.query('SELECT * FROM employee WHERE branch_id = ?', [req.params.branchid], (err, rows) => {
            connection.release()    //return the connection to the pool

            if(!err){
                res.send({emp:rows,status:200})
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

// update employee details
app.put('/updateemp', (req, res) => {
    try{
    pool.getConnection((err, connection) => {
        if(err) throw err;
        
        const data = req.body.currentEmp

        connection.query('UPDATE employee SET employee_name = ?, username= ?, password=?  WHERE id = ?', 
                        [data.employee_name, data.username, data.password, data.id],
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
})
// manager accounts section end

// image
// upload image to s3 bucket
app.post('/images', upload.single('file'), async(req,res)=> {
    try{
        console.log('/images post url called')
    // const file = req.params.file
    // console.log(file)
    // const result = await uploadFile(file)
    // // await unlinkFile(file.path)
    // console.log(result)
    // const description = req.body.description
    // res.send({ imagePath: `images/${result.Key}` })
    // res.send("jo");

    const keyName = uuidv4();

    buf = Buffer.from(req.body.file.replace(/^data:image\/\w+;base64,/, ""),'base64')
    const result = uploadBase64(buf, keyName)
    if(result === 0){
        res.send({msg:'Image uploaded succeffuly', status:200, imagename: keyName})
    }
    else{
        res.send({msg:'Unable to upload image', status:300})
    }
}
catch (error) {
    console.log(error)
    res.status(500).send({status:300})
}
})

// get image from s3
app.get('/images/:key', (req, res)=>{
    try{
        console.log('/images/:key get url called')
    const key = req.params.key
    const readStream = getFileStream(key)
    readStream.pipe(res)
}
catch (error) {
    console.log(error)
    res.status(500).send({status:300})
}
})

// delete image in s3
app.get('/deleteimage/:key', async (req, res)=>{
    try{
        console.log('/deleteimage/:key url called')
    const key = req.params.key
    const result = await deleteFile(key)
    console.log(result)
    res.send(result)
}
catch (error) {
    console.log(error)
    res.status(500).send({status:300})
}
})


// get image and upload to s3
app.get('/getimage/ssign/:id', async (req, res)=>{
    try{
        console.log('/getimage/ssign/:id url called')
    pool.getConnection((err, connection) => {
        if(err) throw err;
        
        connection.query('SELECT s_sign from bills WHERE id = ?', [req.params.id],
                        (err, rows) => {
            connection.release()    //return the connection to the pool

            if(!err){
                res.send(rows[0].s_sign)
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

app.get('/getimage/csign/:id', async (req, res)=>{
    try{
        console.log('/getimage/csign/:id url called')
    pool.getConnection((err, connection) => {
        if(err) throw err;
        
        connection.query('SELECT c_sign from bills WHERE id = ?', [req.params.id],
                        (err, rows) => {
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
})

app.post('/uploadimgs3', (req, res) => {
    try{
        console.log('/uploadimgs3 url called')
    pool.getConnection( async (err, connection) => {
        if(err) throw err;
        
        let s_sign_name = uuidv4()
        let c_sign_name = uuidv4()

        console.log(req.body)

        buf1 = Buffer.from(req.body.s_sign.replace(/^data:image\/\w+;base64,/, ""),'base64')
        const result1 = await uploadBase64(buf1, s_sign_name)
        if(result1 === 0){
            buf2 = Buffer.from(req.body.c_sign.replace(/^data:image\/\w+;base64,/, ""),'base64')
            const result2 = await uploadBase64(buf2, c_sign_name)
            if(result2 === 0){
                connection.query('UPDATE bills SET s_sign = ?, c_sign = ? WHERE id = ?', [s_sign_name, c_sign_name, req.body.id], (err, rows) => {
                    connection.release()    //return the connection to the pool
        
                    if(!err){
                        res.send({status:200})
                    }
                    else{
                        console.log(err)
                    }
                })
                res.send({s_sign_name:s_sign_name,c_sign_name:c_sign_name})
            }
        }
    })
}
catch (error) {
    console.log(error)
    res.status(500).send({status:300})
}
})

const port = process.env.PORT || 9000
app.listen(port, ()=>{
    console.log(`Listen on port ${port}`)
})
