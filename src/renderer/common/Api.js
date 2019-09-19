 import JSONP from 'jsonp';

 var urls = {
     getFund: 'http://fundgz.1234567.com.cn/js/',
     fundSearch: 'http://fundsuggest.eastmoney.com/FundSearch/api/FundSearchAPI.ashx'
 }

 function serializeQuery(params) {
     params['_'] = Date.now();
     return '?' + Object.keys(params).map(key => {
         const val = params[key];
         if (val !== undefined) {
             return encodeURIComponent(key) + '=' + encodeURIComponent(val)
         } else {
             return '';
         }
     }).join('&');
 }

 function jsonp(url, params) {
     return new Promise((resolve, reject) => {
         JSONP(url, params, (err, data) => {
             if (err) {
                 console.error(`jsonp -- ${url}：${err} \n`);
                 resolve(null);
             } else if (data.ErrCode) {
                 console.error(`jsonp -- ${url}：code(${data.ErrCode})：${data.ErrMsg} \n`);
                 resolve(data);
             } else {
                 resolve(data);
             }
         });
     });
 }

 export function getFund(id) {
     const url = urls.getFund + id + '.js' + serializeQuery({});
     return jsonp(url, {
         name: 'jsonpgz'
     });
 }

 export function fundSearch(params) {
     const url = urls.fundSearch + serializeQuery(params);
     return jsonp(url, {
         name: 'callback_' + Date.now()
     });
 }