const fs = require('fs')
const S3 = require('aws-sdk/clients/s3')
require('dotenv').config()

const bucketName = process.env.AWS_BUCKET_NAME
const region = process.env.AWS_BUCKET_REGION
const accessKeyId = process.env.AWS_ACCESS_KEY
const secretAccessKey = process.env.AWS_SECRET_KEY

const s3 = new S3({
    region,
    accessKeyId,
    secretAccessKey
})

function uploadBase64(buf, keyName){
    
    var data = {
        Key: `sign/${keyName}`,
        Bucket: bucketName,
        Body: buf,
        ContentEncoding: 'base64',
        ContentType: 'image/jpeg'
    };

    let flag = 0;
    s3.putObject(data, function(err, data){
        if (err) { 
          console.log(err);
          console.log('Error uploading data: ', data); 
          flag = 1;
        } else {
          console.log('successfully uploaded the image!');
          flag =0;
        }
    });

    return flag
}
exports.uploadBase64 = uploadBase64

// upload image file to s3
function uploadFile(file){
    const fileStream = fs.createReadStream(file.path)

    const uploadParams = {
        Bucket: bucketName,
        Body: fileStream,
        Key: `sign/${file.filename}`
    }

    return s3.upload(uploadParams).promise()
}

exports.uploadFile = uploadFile

// get image file from s3
function getFileStream(fileKey){
    const downloadParams = {
        Key: `sign/${fileKey}`,
        Bucket: bucketName
    }

    return s3.getObject(downloadParams).createReadStream()
}

exports.getFileStream = getFileStream

// delete image file in s3
function deleteFile(fileKey){
    const deleteParams = {
        Key: fileKey,
        Bucket: bucketName
    }

    return s3.deleteObject(deleteParams).createReadStream()
}

exports.deleteFile = deleteFile