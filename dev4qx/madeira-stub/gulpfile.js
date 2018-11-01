var gulp = require('gulp');
var browserify = require('browserify');
var babelify = require('babelify');
var source = require('vinyl-source-stream');

gulp.task('browserify-vendor', function () {
    browserify({debug: true})
        .require('./node_modules/react/react.js', {expose: 'react'})
        .require('./node_modules/react-dom/index.js', {expose: 'react-dom'})
        .bundle()
        .on("error", function (err) {
            console.log("Error : " + err.message);
        })
        .pipe(source('vendor.js'))
        .pipe(gulp.dest('static/js/'));
});

gulp.task('browserify', function () {
    browserify("jsx/app.jsx", {debug: true})
        .external('react')
        .external('react-dom')
        .transform(babelify, {presets: ["react"]})
        .bundle()
        .on("error", function (err) {
            console.log("Error : " + err.message);
        })
        .pipe(source('app.js'))
        .pipe(gulp.dest('static/js/'));
});

gulp.task('browserify:watch', function () {
    gulp.watch('jsx/*.jsx', ['browserify']);
});

gulp.task('default', ['browserify', 'browserify:watch']);