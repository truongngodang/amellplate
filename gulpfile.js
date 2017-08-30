'use strict';

const page = ['index6'];

// Define Gulp Plugins

const   gulp = require('gulp'),
        del = require('del'),
        browserSync = require('browser-sync').create(),
        reload = browserSync.reload,
        plumber = require('gulp-plumber'),
        fileSystem = require('fs'),
        gulpSequence = require('gulp-sequence'),
        replace = require('gulp-replace'),
        rename = require('gulp-rename'),
        include = require("gulp-include"),

        pug = require('gulp-pug'),
        yaml = require('gulp-yaml'),
        mergeJson = require('gulp-merge-json'),
        w3cjs = require('gulp-w3cjs'),
        html_prettify = require('gulp-html-prettify'),
        html_minify = require('gulp-minify-html'),

        sass = require('gulp-sass'),
        sassGlob = require('gulp-sass-glob'),
        css_minify = require('gulp-minify-css'),
        autoprefixer = require('gulp-autoprefixer');

// _______________________________SETUP_______________________________________


// Brower sync
gulp.task('browser-sync', function () {
    return browserSync.init({
        server: {
            baseDir: 'dist'
        },
        open: false
    });
});

// Clean
gulp.task('clean', function () {
    return del(['dist']);
});

// _______________________________VENDOR______________________________________

gulp.task('vendor', function () {
    del(['dist/vendor/*']);
    gulp.src('app/vendor/*/**')
        .pipe(gulp.dest('dist/vendor'));
});

gulp.task('vendor-export', function () {
    gulp.src('app/vendor/*/**')
        .pipe(gulp.dest('dist/release/vendor'))
        .pipe(gulp.dest('dist/compress/.temp/vendor'))
});

// _______________________________BUILD HTML___________________________________

const views_options = {
    prettify: {
        'indent_size': 4,
        'unformatted': ['pre', 'code'],
        'indent_with_tabs': false,
        'preserve_newlines': true,
        'brace_style': 'expand',
        'end_with_newline': true,
        'indent_char': ' ',
        'space_before_conditional': true,
        'wrap_attributes': 'auto'
    }
};

gulp.task('yaml-json', function () {
    return gulp.src(['app/**/*.yml'])
        .pipe(plumber())
        .pipe(yaml({ schema: 'DEFAULT_SAFE_SCHEMA' }))
        .pipe(mergeJson({
            fileName: 'data.json',
            json5: false
        }))
        .pipe(plumber.stop())
        .pipe(gulp.dest('.tmp'));
});

gulp.task('views', function () {
    const data = JSON.parse(fileSystem.readFileSync('.tmp/data.json'));
    return gulp.src('app/*.pug')
        .pipe(plumber())
        .pipe(pug({pretty: true, locals: data}))
        .pipe(w3cjs())
        .pipe(w3cjs.reporter())
        .pipe(html_prettify(views_options.prettify))
        .pipe(plumber.stop())
        .pipe(gulp.dest('dist'))
        .pipe(reload({stream: true}));
});

gulp.task('build-html', function (cb) {
    return gulpSequence(
        'yaml-json',
        'views',
        cb
    );
});

gulp.task('views-export-1', function () {
    const data = JSON.parse(fileSystem.readFileSync('.tmp/data.json'));
    return gulp.src(['app/*.pug', '!app/sample.pug'])
        .pipe(pug({pretty: true, locals: data}))
        .pipe(html_prettify(views_options.prettify))
        .pipe(gulp.dest('production/release'));
});

gulp.task('views-export-2', function () {
    const data = JSON.parse(fileSystem.readFileSync('.tmp/data.json'));
    return gulp.src(['app/*.pug', '!app/sample.pug'])
        .pipe(replace('layouts/master', 'layouts/master-compress'))
        .pipe(pug({pretty: false, locals: data}))
        .pipe(html_minify())
        .pipe(gulp.dest('production/compress'));
});

gulp.task('build-html-export', function (cb) {
    return gulpSequence(
        'yaml-json',
        'views-export-1',
        'views-export-2',
        cb
    );
});

// _______________________________BUILD CSS_________________________________

const AUTOPREFIXER_BROWSERS = [
    'ie >= 1',
    'ie_mob >= 1',
    'ff >= 1',
    'chrome >= 1',
    'safari >= 1',
    'opera >= 1',
    'ios >= 1',
    'android >= 1',
    'bb >= 1'
];

gulp.task('build-css', function () {
    return gulp
        .src('app/css/*.scss')
        .pipe(plumber())
        .pipe(sassGlob())
        .pipe(sass.sync({
            outputStyle: 'expanded',
            precision: 10,
            includePaths: ['.']
        }).on('error', sass.logError))
        .pipe(plumber.stop())
        .pipe(autoprefixer({
            browsers: AUTOPREFIXER_BROWSERS,
            cascade: false
        }))
        .pipe(gulp.dest('dist/css'))
        .pipe(css_minify())
        .pipe(rename({suffix:'.min'}))
        .pipe(gulp.dest('dist/css'))
        .pipe(reload({stream: true}));
});

gulp.task('styles-export', function () {
    return gulp
        .src('app/css/*.scss')
        .pipe(sassGlob())
        .pipe(sass.sync({
            outputStyle: 'expanded',
            precision: 10,
            includePaths: ['.']
        }).on('error', sass.logError))
        .pipe(autoprefixer({
            browsers: AUTOPREFIXER_BROWSERS,
            cascade: false
        }))
        .pipe(gulp.dest('dist/release/css'))
        .pipe(css_minify())
        .pipe(rename({suffix:'.min'}))
        .pipe(gulp.dest('dist/release/css'))
        .pipe(gulp.dest('dist/compress/.temp/css'));
});

gulp.task("compress-css", function() {
    gulp.src("app/css/compressed.css")
        .pipe(include({
            hardFail: true,
            includePaths: [
                "dist/compress/.temp"
            ]
        }))
        .pipe(css_minify())
        .on('error', console.log)
        .pipe(gulp.dest("dist/compress/css"));
});

// _______________________________BUILD JS_________________________________