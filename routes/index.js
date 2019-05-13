var express = require('express');

// 라우터를 로드
var router = express.Router();


// 라우터의 속성을 수정
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

// 수정된 라우터를 다시 module.exports에 할당
module.exports = router;
