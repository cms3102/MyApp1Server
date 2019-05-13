var express = require('express');
var router = express.Router();
const mysql = require('mysql');

const client = mysql.createConnection({
    user:"root",
    password:"qwe123!@#",
    database:"myapp1"
});

router.post("/checkroom", (req, res) => {

    const member_count = req.body.member_count
    const chatroom_id = req.body.chatroom_id
    const memberList = req.body.memberList
    console.log('방 확인 서버 작업 : ' + member_count + " / " + memberList[0].user_id)

      if(member_count === 2){
        client.query("select chatroom_id from chatrooms where member_count = ? and user_id in (?, ?) group by chatroom_id having count(chatroom_id) = 2", [member_count, memberList[0].user_id, memberList[1].user_id], function(error, results, fields){
            if(error) {
                res.json("")
                throw error
            }
            console.log('results : ' + results.length)
            if(results.length >= 1){
                console.log('이미 방 있음')
                console.log(results)
                res.json(results)
                
            } else {
                console.log('방 생성 쿼리 실행')
                    client.query("insert into chatrooms(chatroom_id, user_id, member_count) values(?, ?, ?),(?, ?, ?)", [chatroom_id, memberList[0].user_id, member_count, chatroom_id, memberList[1].user_id, member_count], function(error, results, fields){
                        if(error){
                            console.log("DB 쿼리 실행 에러 발생 : " + error)
                            client.rollback(function(error){
                                if(error){
                                    console.log("DB 롤백 에러 발생 : " + error)
                                    throw error
                                } else {
                                    console.log("DB 롤백 성공")
                                }
                            })
                            res.json("")
                            throw error
                        } else {
                            res.json([{chatroom_id}])
                        }
                    })
            }
        })
    } 

})

router.post('/groupchat', (req, res) => {

    console.log(req.body.memberList.length + '인 서버 단체방 만들기 진입 : ')
    
    const chatroom_id = req.body.chatroom_id
    const member_count = req.body.member_count
    const participantList = req.body.memberList
    
    client.beginTransaction(function(error){
        if(error) {
            res.json("")
            throw error
        }
        participantList.forEach(member => {
            client.query('insert into chatrooms(chatroom_id, user_id, member_count) values(?, ?, ?)', [chatroom_id, member.user_id, member_count], function(error, results, fields){
                if(error){
                    console.log("DB 쿼리 실행 에러 발생 : " + error)
                    client.rollback(function(error){
                        if(error){
                            console.log("DB 롤백 에러 발생 : " + error)
                            res.json("")
                            throw error
                        } else {
                            console.log('DB 롤백 성공')
                        }
                    })
                    res.json("")
                    throw error
                } else {
                    console.log("단체 대화방 멤버 아이디 : " + member.user_id)
                }
    
            })
        });
        client.commit(function(error){
            if(error){
                console.log('DB 커밋 에러 발생 : ' + error)
                res.json("")
                throw error
            }
            console.log('DB 커밋 성공')
            res.json(chatroom_id)        
        })
    })
 
})

module.exports = router;