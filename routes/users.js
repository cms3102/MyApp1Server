var express = require('express');
var router = express.Router();
const mysql = require('mysql');

const client = mysql.createConnection({
  user:"root",
  password:"qwe123!@#",
  database:"myapp1"
});

/* GET users listing. */
router.get('/', function(req, res, next) {
  
});

router.post('/friends', (req, res) => {
  console.log('친구 목록 요청 서버에서 받음')
  client.query("select * from users", function(error, results, fields){
    if(error) {throw error}
    res.json(results)
    console.log("친구 목록 서버에서 보내짐")
  })
})

router.post('/signup', (req, res) => {
  console.log("signup 진입")
  let user = req.body
  console.log('req.body : ' + user.user_id)
  client.query("insert into users(user_id, user_pw, user_name, user_pic) values(?,?,?,?)",[user.user_id, user.user_pw, user.user_name, user.user_pic], function(error, results, fields){
    if(error){
      client.rollback(function(error){
        if(error){
          throw error
        } else {
          console.log("DB 롤백 성공")
        }
      })
      throw error
    } else {
      res.json("회원 가입 성공")
    }
  })
})

router.post('/login', (req, res) => {
  console.log('login 진입')
  console.log('아이디 : ' + req.body.user_id + ' 비번 : ' + req.body.user_pw)
  // if(req.cookies){
  //   console.log('쿠키 정보 : ' + req.cookies)
  // }
  let user_id = req.body.user_id
  let user_pw = req.body.user_pw

  client.query("select * from users where user_id=? and user_pw=?",[user_id, user_pw], function(error, results, fields){
    console.log(results.length)
    if(error){
      console.log(error)
      throw error
    } else {
      if(results.length > 0){
        // res.cookie("user", user_id, {
        //   expires: new Date(Date.now() + 900000),
        //   httpOnly: true
        // })
        res.json("true/" + results[0].user_name)
      } else {
        res.json("false")
      }
    }
  } )
  
})

router.post('/statemessage', (req, res) => {
  console.log('상태 메시지 저장 실행 : ' + req.body.state_message + ' / ' + req.body.user_id)
  client.query("update users set state_message = ? where user_id = ?", [req.body.state_message, req.body.user_id], function(error, results, fields){
    if(error){
      res.json("false")
      throw error
    }
    res.json("true")
  })
})

module.exports = router;
