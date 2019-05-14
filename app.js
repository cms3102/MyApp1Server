var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const mysql = require('mysql');
const io = require('socket.io')();
const moment = require('moment')

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var chatRouter = require('./routes/chat');
const fileRouter = require('./routes/file');

var app = express();

const client = mysql.createConnection({
  user:'root',
  password:'qwe123!@#',
  database:'myapp1'
})

function handleDBConnection(){

  client.connect((err) => {
    if(err){
      console.log('error when connecting to db : ', err)
      setTimeout(handleDBConnection(), 5000)
    }
  })

  // DB 연결 후 시간 초과로 끊어지면 재접속 처리
  client.on('error', (err) => {
    console.log('database error : ', err)
    if(err.code === 'PROTOCOL_CONNECTION_LOST'){
      handleDBConnection();
    }else{
      throw err;
    }
  })

}

handleDBConnection();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/chat', chatRouter);
app.use('/upload', fileRouter)

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

let connectionList = []

io.sockets.on('connection', function(socket){

  console.log('클라이언트 접속함 : ' + socket.id)
  // console.log('현재 대화방1 : ' + socket.adapter.rooms)
  // console.log('현재 대화방2 : ' + socket.rooms)
  // console.log('현재 소켓들 : ' + socket.adapter.sids)

  socket.on('makeConnection', function(data){
    console.log('makeConnection 실행 됨')
    console.log('connectionList size : ' + connectionList.length)
    console.log('소켓 있는지 확인 : ' + connectionList.find(item => item.socketId === socket.id))
    connectionList.forEach(element => {
      console.log(element.socketId)
    });
    if(!connectionList.find(item => item.socketId === socket.id)){
      connectionList.push({socketId:socket.id, socket:socket, userId:data})
      console.log('소켓 추가함')
      console.log('connectionList size : ' + connectionList.length)
    }
  })
  
  // socket.on('joinRoom', function(chatRoomId){
  //   console.log('클라이언트 채팅방 접속함')
  //   socket.join(chatRoomId) 
  // })

  socket.on('sendMessage', function (message, chatRoomId, senderId, senderName, senderPic) {
    console.log('넘어온 채팅 데이터 : ' + message  + " / " + chatRoomId + " / " + senderId  + " / " + senderName + " / " + senderPic)
    // io.sockets.in(chatRoomId).emit('receiveMessage', message, chatRoomId, senderId, sender_name);
    // console.log('내가 들어 있는 방 : ' + Object.keys(socket.rooms)[1])
    // const targetRoom = Object.keys(socket.rooms).find(item => item === chatRoomId)

    client.query('select user_id, member_count from chatrooms where chatroom_id = ?', [chatRoomId], function(error, results, fields){
      
      if(error){
        throw error
      }

      if(results.length > 0){

        const date = moment().format('YYYY.MM.DD HH:mm')
        console.log('현재 시간 : ' + date)

        results.forEach(element => {

          console.log("채팅방 유저 아이디 검색 결과 : " + element.user_id)
          let targetRoom = connectionList.find(item => item.userId === element.user_id)
          console.log('타겟 찾음 targetRoom : ' + targetRoom.userId)
          io.sockets.in(targetRoom.socketId).emit('receivePushMessage', message, chatRoomId, senderId, senderName, senderPic, date, element.member_count)

        });

      }

    })

  })

  socket.on('sendReaderInfo', function(userId, chatRoomId, messageIdx){
    console.log('sendReaderInfo 넘어온 reader 데이터 : ' + userId  + " / " + chatRoomId + "/" + messageIdx)
    client.query('select user_id, member_count from chatrooms where chatroom_id = ?', [chatRoomId], function(error, results, fields){
      
      if(error){
        throw error
      }

      if(results.length > 0){

        results.forEach(element => {

          console.log("채팅방 유저 아이디 검색 결과 : " + element.user_id)
          let targetRoom = connectionList.find(item => item.userId === element.user_id)
          console.log('타겟 찾음 targetRoom : ' + targetRoom)
          console.log('타겟 찾음 targetRoom : ' + targetRoom.userId)
          io.sockets.in(targetRoom.socketId).emit('receiveReaderInfo', userId, chatRoomId, messageIdx)

        });

      }

    })
  })

  socket.on('disconnect', function(){
      for (let index = 0; index < connectionList.length; index++) {
        const element = connectionList[index];
        if(element.socketId === socket.id){
          connectionList.splice(index, 1)
        }
      }
      console.log('현재 connectionList 크기 : ' + connectionList.length)
  })

})

app.io = io

module.exports = app;
