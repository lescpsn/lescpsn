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

var buildJsx = function (src, dest) {
    browserify("./static/jsx/" + src, {debug: true})
        .external('react')
        .external('react-dom')
        .transform(babelify, {presets: ["react"]})
        .bundle()
        .on("error", function (err) {
            console.log("Error : " + err.message);
        })
        .pipe(source(dest))
        .pipe(gulp.dest('static/js/'));
};

gulp.task('admin-withdraw', buildJsx.bind(this, 'admin-withdraw.jsx', 'admin-withdraw.js'));
gulp.task('ds-management', buildJsx.bind(this, 'ds-management.jsx', 'ds-management.js'));
gulp.task('price', buildJsx.bind(this, 'price.jsx', 'price.js'));
gulp.task('product', buildJsx.bind(this, 'product.jsx', 'product.js'));
gulp.task('route-supply', buildJsx.bind(this, 'route-supply.jsx', 'route-supply.js'));
gulp.task('route-interface', buildJsx.bind(this, 'route-interface.jsx', 'route-interface.js'));
gulp.task('product-supply', buildJsx.bind(this, 'product-supply.jsx', 'product-supply.js'));
gulp.task('product_user', buildJsx.bind(this, 'product_user.jsx', 'product_user.js'));
gulp.task('query_order', buildJsx.bind(this, 'query_order.jsx', 'query_order.js'));
gulp.task('special', buildJsx.bind(this, 'special.jsx', 'special.js'));
gulp.task('user-supply', buildJsx.bind(this, 'user-supply.jsx', 'user-supply.js'));
gulp.task('withdraw', buildJsx.bind(this, 'withdraw.jsx', 'withdraw.js'));
gulp.task('data-routing', buildJsx.bind(this, 'data-routing.jsx', 'data-routing.js'));
gulp.task('fuel_card-single_recharge', buildJsx.bind(this, 'fuel_card/single_recharge.jsx', 'fuel_card/single_recharge.js'));
gulp.task('fuel_card-big_recharge', buildJsx.bind(this, 'fuel_card/big_recharge.jsx', 'fuel_card/big_recharge.js'));
gulp.task('fuel_card-order_list', buildJsx.bind(this, 'fuel_card/order_list.jsx', 'fuel_card/order_list.js'));
gulp.task('finance2', buildJsx.bind(this, 'finance2.jsx', 'finance2.js'));
gulp.task('callback', buildJsx.bind(this, 'services/callback.jsx', 'callback.js'));
gulp.task('single-card', buildJsx.bind(this, 'single-card.jsx', 'single-card.js'));
gulp.task('service-interface', buildJsx.bind(this, 'service-interface.jsx', 'service-interface.js'));
gulp.task('product-query', buildJsx.bind(this, 'product-query.jsx', 'product-query.js'));

gulp.task('browserify:watch', function () {
    gulp.watch('./static/jsx/admin-withdraw.jsx', ['admin-withdraw']);
    gulp.watch('./static/jsx/ds-management.jsx', ['ds-management']);
    gulp.watch('./static/jsx/price.jsx', ['ds-price']);
    gulp.watch('./static/jsx/query_order.jsx', ['query_order']);
    gulp.watch('./static/jsx/route-interface.jsx', ['route-interface']);
    gulp.watch('./static/jsx/route-supply.jsx', ['route-supply']);
    gulp.watch('./static/jsx/special.jsx', ['special']);
    gulp.watch('./static/jsx/withdraw.jsx', ['withdraw']);
    gulp.watch('./static/jsx/data-routing.jsx', ['data-routing']);
    gulp.watch('./static/jsx/product_user.jsx', ['product_user']);
    gulp.watch('./static/jsx/fuel_card/order_list.jsx', ['fuel_card-order_list']);
    gulp.watch('./static/jsx/fuel_card/single_recharge.jsx', ['fuel_card-single_recharge']);
    gulp.watch('./static/jsx/fuel_card/big_recharge.jsx', ['fuel_card-big_recharge']);
    gulp.watch('./static/jsx/finance2.jsx', ['finance2']);
    gulp.watch('./static/jsx/services/callback.jsx', ['callback']);
    gulp.watch('./static/jsx/service-interface.jsx', ['service-interface']);
    gulp.watch('./static/jsx/single-card.jsx', ['single-card']);
    gulp.watch('./static/jsx/product-query.jsx', ['product-query']);
});

gulp.task('default', ['build-all', 'browserify:watch']);

gulp.task('build-all', [
    'admin-withdraw',
    'ds-management',
    'price',
    'product',
    'product-supply',
    'product_user',
    'query_order',
    'special',
    'user-supply',
    'withdraw',
    'route-supply',
    'route-interface',
    'special',
    'finance2',
    'callback',
    'single-card',
    'service-interface',
    'product-query'
]);
