const express = require('express')
const router = express.Router()
const multer = require('multer')
const mysql = require('mysql')

const client = mysql.createConnection({
    user:"root",
    password:"qwe123!@#",
    database:"myapp1"
})


const storage = multer.diskStorage({
    destination(req, file, callback){
        callback(null, 'public/files/images/profiles')
    },
    filename(req, file, callback){
        callback(null, req.body.user_id.replace('@','').replace('.','') + '.' + file.originalname.split('.')[1])
    }
})

const upload = multer({
    storage,
    limits:{
        files: 5,
        fileSize: 1024*1024
    }
})

router.post('/images', upload.array('image',1), (req, res) => {
    console.log('파일 업로드 요청 서버에서 받음')
    console.log('업로드할 파일 정보 : ' + '192.168.0.13:3000' + req.files[0].path.substring(6).replace(/\\/g, '/'))
    const imageUri = 'http://192.168.0.13:3000' + req.files[0].path.substring(6).replace(/\\/g,'/')

    res.json(imageUri)
})

module.exports = router;