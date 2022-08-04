const express = require('express');
const router = express.Router();
const { Console } = require('console');
const fs = require("fs");
const pool = require('../../mysqlConfig');
const multer  = require('multer')
const { v4: uuidv4 } = require('uuid');
const upload = multer({ dest: 'uploads/' })

const { uploadFile, getFileStream, deleteFile, uploadBase64 } = require('../../s3');

router.post('/images', upload.single('file'), async(req,res)=> {
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
router.get('/images/:key', (req, res)=>{
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
router.get('/deleteimage/:key', async (req, res)=>{
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
router.get('/getimage/ssign/:id', async (req, res)=>{
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

router.get('/getimage/csign/:id', async (req, res)=>{
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

router.post('/uploadimgs3', (req, res) => {
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

module.exports = router;