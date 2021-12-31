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