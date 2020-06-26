
// Настройки
const folder_main    = `lp_multipleLanders/`;
const file_html_list     = [
'wha_i3b.html','fb_i1.html',
]

const root_path     = `L:/Dropbox/CPA/server/healthy-step.server/landers/dating/`;
const folder_html   = 'html/'
const folder_css    = 'css/'
const folder_js     = 'js/'

const unique_script_path_param  = '../'

const offer_link__replace       = true;
const offer_link                = 'https://hot-mine.com/index.php?lp=1'



//  ! Добавить функцию
//  ! "copy all files .gif .jpg .webp"



// ————————————————————————————————————————————————————————————————————————————————————————————————————————
// Инициализация ресурсов
const fs = require('fs');
const fsp = require('fs').promises;
const cheerio = require('cheerio');
const javascriptObfuscator = require('javascript-obfuscator');
const minify = require('html-minifier').minify;
const cleanCSS = require('clean-css');

const _secure       = '_secure/';
const folder_secure = _secure+folder_main


// Подготовить папку _secure 
// 1. Проверить что она существует, 
if ( fs.existsSync(root_path+folder_secure) ) {
        //    если существует - ок
        console.log('"folder_secure" exists')
} 
else {
        //    если не сущ. - создать новую + файловая структура
        console.log('Creating new "folder_secure"')
        fs.mkdir(root_path+folder_secure, ()=>console.log('created "folder_secure"'))
        fs.mkdir(root_path+folder_secure+folder_html, ()=>console.log('created "folder_html"'))
}


// Открыть Лендинг
file_html_list.forEach((landing) => {
    var landing_name = landing.replace('.html','')
    
    var file_html_open = fs.readFileSync(root_path+folder_main+folder_html+landing, 'utf-8');
    // сохранить HTML лендинга в переменную
    const $ = cheerio.load(file_html_open);
    
    // -------------  JS
    // Получить список js-файлов, используемых в лендинге
    var js_files_array = [];
    $('#script').each((i, el) => {
        js_files_array.push($(el).attr('src').replace(unique_script_path_param+folder_js,'')
        )
    })
    
    // собрать единый js-файл
    var js_file_merged = '';
    js_files_array.forEach((file)=>{
        var data = fs.readFileSync(root_path+folder_main+folder_js+file, 'utf-8');
        js_file_merged += '\n\r';
        js_file_merged += data;
    }) 
    
    // Обфускатить собранный файл
    var js_file_obfuscated = javascriptObfuscator.obfuscate(js_file_merged, {
        compact: true,
        controlFlowFlattening: true,
        controlFlowFlatteningThreshold: 0.05,
        deadCodeInjection: true,
        deadCodeInjectionThreshold: 0.15,
        debugProtection: false,
        debugProtectionInterval: false,
        disableConsoleOutput: true,
        log: false,
        mangle: false,
        renameGlobals: true,
        rotateStringArray: true,
        stringArray: true,
        stringArrayEncoding: 'base64',
        stringArrayThreshold: 0.8,
        unicodeEscapeSequence: false
    })._obfuscatedCode;

    var js_file_obfuscated = '<script>/*! jQuery v3.5.1 | (c) JS Foundation and other contributors | jquery.org/license */\n'+js_file_obfuscated+'</script>'
    
    // Заменить скрипты в html-файле лендинга на обфускаченный
    $('#script').remove()
    
    // Запись JS-кода в HTML
    $('body').append(js_file_obfuscated)

    
    // ------------ CSS
    // Получить список css-файлов, используемых в лендинге
    var css_files_array = [];
    $('#css').each((i, el) => {
        css_files_array.push($(el).attr('href').replace(unique_script_path_param+folder_css,''))
    })

    
    // собрать единый css-файл
    var css_file_merged = '';
    css_files_array.forEach((file)=>{
        var data = fs.readFileSync(root_path+folder_main+folder_css+file, 'utf-8');
        css_file_merged += data;
    })

    // Почистить CSS
    var css_minify_options = { /* options */ };
    var css_file_minified = new cleanCSS(css_minify_options).minify(css_file_merged).styles;

    // Заменить скрипты в html-файле лендинга на обфускаченный
    $('#css').remove()
    
    // Запись нового CSS-файла    
    $('head').append('<style>'+css_file_minified+'</style>')

  
    // ------------  HTML final
    // Сохранение html в переменной
    var html_file_updated = $.html();
    
    // замена offer link, если лендинг внешний
    if ( offer_link__replace == true ) { 
        html_file_updated = html_file_updated.replace('{offer_link}', offer_link) 
    }
    
    // Минифай финального html-файла
    var minify_options = {
        removeComments: true,
        removeCommentsFromCDATA: true,
        collapseWhitespace:true,
    }
    var html_file_minified = minify(html_file_updated, minify_options);

    var lpProtection = '<?php $key="db0e971cbbbf0ecf9aa38cd1c0e8a3a9";$a=@$_GET["lpkey"];$b=substr($a,0,2).substr($a,4,2).substr($a,8,2).substr($a,12,2).substr($a,16,2);$c=substr($a,2,2).substr($a,6,2).substr($a,10,2).substr($a,14,2);$d=md5($key.$_SERVER["HTTP_USER_AGENT"].$b);$d=substr($d,2,2).substr($d,7,2).substr($d,12,2).substr($d,24,2);if(time()>$b || $d!==$c){exit(0);}?>';
    var html_file_with_LpProtection = lpProtection+html_file_minified;

    var html_file_minified_name = landing_name+'.php';
    fs.writeFileSync(root_path+folder_secure+folder_html+html_file_minified_name, html_file_with_LpProtection, 'utf-8')


}); // end of 'file_html_list . forEach'





// Заливка всего на FTP (поверх того, что было)
