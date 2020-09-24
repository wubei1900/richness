 import JSONP from 'jsonp';

 var urls = {
     getFundList: 'http://fundgz.1234567.com.cn/js/',
     fundSearch: 'http://fundsuggest.eastmoney.com/FundSearch/api/FundSearchAPI.ashx',
     quoteCenter: 'http://push2.eastmoney.com/api/qt/clist/get?pi=0&pz=10&po=1&np=1&fields=f1,f2,f3,f4,f12,f13,f14&fltt=2&invt=2&ut=433fd2d0e98eaf36ad3d5001f088614d&fs=i:1.000001,i:0.399001,i:0.399006,i:1.000300,i:1.000016,i:0.399905'
 }

 function serializeQuery(params = {}) {
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
             if (err || !data) {
                 reject(`jsonp ${url}：${err} \n`);
             } else if (data.ErrCode) {
                 reject(`jsonp ${url}：code(${data.ErrCode})，${data.ErrMsg} \n`);
             } else {
                 resolve(data);
             }
         });
     });
 }

 export function getFundList(id) {
     const url = urls.getFundList + id + '.js' + serializeQuery();
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
 export function getQuoteCenter() {
     const _ = Date.now();
     const url = urls.quoteCenter + '&cb=callback_' + _ + '&_=' + _
     return jsonp(url, {
         name: 'callback_' + _
     });
 }