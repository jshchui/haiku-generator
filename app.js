var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var hbs = require('express-handlebars');
var bodyParser = require('body-parser');

// if (process.env.NODE_ENV !== 'production') {
//   require('dotenv').load();
// }

var app = express();
// const PORT = process.env.PORT || 3000;

// view engine setup
app.engine('hbs', hbs({extname: 'hbs', defaultLayout: 'layout', layoutsDir: __dirname + '/views/layouts/'}));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');


// limits picture file size, max 1mb
var options = {
  inflate: true,
  limit: '1000kb',
  type: 'application/octet-stream'
};

app.use(bodyParser.json());
app.use(bodyParser.raw(options));
app.use(bodyParser.urlencoded({ extended: true }));


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

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

// app.listen(PORT, () => {
//   console.log(`server is listening on port ${PORT}`)
// })

module.exports = app;
