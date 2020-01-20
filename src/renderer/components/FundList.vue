<template>
  <div class="list" @click="display=false;searchWordList=[]">
    <div class="searchBox">
      <div class="search">
        <input
          type="text"
          ref="input"
          placeholder="请输入基金代码、名称或简写"
          v-model="keyword"
          @click.stop
          @focus="handleInput(keyword)"
          @input="handleInput(keyword)"
          @keyup.enter="handleSearch(keyword)"
        />
        <span class="searchBtn" @click="handleSearch(keyword)">搜索</span>
      </div>
      <div class="searchList" v-show="!display && searchWordList.length" @click.stop>
        <ul>
          <li v-for="(item, i) in searchWordList" :key="i" @click="handleSearch(item.value)">
            <span v-html="item.__value"></span>
            <span class="Delete" @click.stop @click="handleDelete('searchWordList', item.value)">X</span>
          </li>
        </ul>
      </div>
      <div class="searchList" v-show="display" @click.stop>
        <ul v-if="!!searchlist.length">
          <li v-for="(item, i) in searchlist" :key="i">
            <div>
              <span v-html="item.__name"></span>
              <span class="ellipsis" :title="item.NAME" v-html="item.__code"></span>
            </div>
            <span
              class="add"
              v-if="!isAdd('fundlist', item.CODE)"
              @click="handleAddFund(item.CODE)"
            >添加</span>
            <span class="disabled" v-else>已添加</span>
          </li>
        </ul>
        <div v-else class="notFound">
          没有找到与
          <font color="red">{{this.keyword}}</font>
          相关的内容
        </div>
      </div>
    </div>
    <div class="time" v-if="time">
      行情信息&nbsp;&nbsp;
      <span style="color: #999">更新于{{time}}</span>
    </div>
    <div v-if="quotes.length" class="quotes" ref="quotes">
      <div
        v-for="(it, i) in [1, 2]"
        :key="i === 0 ? ~~flag : ~~!flag"
        :class="['quotesItem', {out: i === 0}]"
      >
        <div
          class="item"
          v-for="(item, j) in quotes.slice(i === 0 ? getPreNum(previous) : getPreNum(current), i === 0 ? previous : current)"
          :key="j"
        >
          <div>{{item.f14}}</div>
          <div
            :class="{red: item.f3 > 0, green: item.f3 < 0, gray: item.f3 === 0}"
            :style="{ 'display': 'flex', 'flex-direction': 'column'}"
          >
            <span
              style="margin-right: 5px"
            >{{`${Number(item.f2).toFixed(2)} ${item.f3 &gt; 0 ? '↑' : (item.f3 &lt; 0 ? '↓' : '─') }`}}</span>
            <div class="quotesAmp">
              <span
                :style="{'font-size': '10px', 'display': 'block', 'margin-right': '5px' }"
              >{{`${item.f4 > 0 ? '+' : ''}${item.f4}`}}</span>
              <span style="font-size: 10px">{{`${Number(item.f3).toFixed(2)}%`}}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <section v-if="fundList.length">
      <table>
        <thead>
          <tr>
            <td>序号</td>
            <td>代码</td>
            <td>名称</td>
            <td>涨跌幅</td>
            <td>操作</td>
          </tr>
        </thead>
        <tbody v-if="fundList.length">
          <tr v-for="(item, i) in fundList" :key="i">
            <td>{{i+1}}</td>
            <td>{{item.fundcode}}</td>
            <td class="ellipsis" :title="item.name">{{item.name}}</td>
            <td
              :class="{red: item.gszzl > 0, green: item.gszzl < 0, gray: item.gszzl === 0}"
            >{{`${item.gszzl}%`}}</td>
            <td class="delete" @click="handleDelete('fundlist', item.fundcode)">删除</td>
          </tr>
        </tbody>
      </table>
    </section>
    <div v-else class="empty">
      <span v-if="loading">加载中...</span>
      <span v-else>未添加任何基金</span>
    </div>
  </div>
</template>

<script>
import update from "immutability-helper";
import * as Api from "@common/Api";
import { ipcRenderer } from "electron";

const NUM = 3;

export default {
  data() {
    return {
      display: false,
      keyword: "",
      fundList: [],
      quotes: [],
      searchlist: [],
      loading: true,
      previous: 0,
      current: 0,
      flag: false,
      time: "",
      searchWordList: []
    };
  },
  methods: {
    getUpdateTime() {
      const now = new Date();
      const h = now.getHours();
      const m = now.getMinutes();
      const s = now.getSeconds();
      const setComplete = v => (v > 9 ? v : "0" + v);
      if (h >= 15 || (h <= 9 && m < 25)) {
        // clearInterval(this.interval);
        // clearInterval(this.quotesInterval);
        return "15:00:00  [闭市]";
      }
      return `${setComplete(h)}:${setComplete(m)}:${setComplete(s)}`;
    },
    async handleSyncFund(mounted = false) {
      this.loading = true;
      const datas = await this.getFundList();
      let quotes = await Api.getQuoteCenter();
      this.loading = false;
      this.fundList = this.parseData(datas);
      this.quotes = this.parseData(quotes.data.diff);
      this.time = this.getUpdateTime();
      this.sendIpcMsg();
      if (mounted) {
        const len = this.quotes.length;
        this.previous = len;
        this.current = len <= NUM ? len : NUM;
      }
      return Promise.resolve();
    },
    getPreNum(num) {
      const mod = num % NUM;
      return mod ? num - mod : num - NUM;
    },
    handleSwitchQuotes() {
      const len = this.quotes.length;
      this.flag = !this.flag;
      this.previous = this.current;
      this.current =
        (this.current + NUM) % len < NUM
          ? len
          : (this.current + NUM) % len === NUM
          ? NUM
          : this.current + NUM;
    },
    getFundList() {
      return new Promise((resolve, reject) => {
        const fundList = this.getItem("fundlist");
        const datas = [];
        const func = async index => {
          if (index >= fundList.length) {
            return resolve(datas);
          }
          try {
            const data = await Api.getFundList(fundList[index]);
            datas.push(data);
            func(index + 1);
          } catch (error) {
            console.warn(error);
            func(index + 1);
          }
        };
        func(0);
      });
    },
    handleInput(keyword) {
      this.searchWordList = [];
      if (!keyword.trim().length) {
        return;
      }
      this.display = false;
      const searchWordList = this.getItem("searchWordList");
      searchWordList.forEach(str => {
        if (str.indexOf(keyword) !== -1) {
          this.searchWordList.push({
            __value: this.brightKeyword(str),
            value: str
          });
        }
      });
    },
    setSearchWordList(str) {
      const searchWordList = this.getItem("searchWordList");
      if (searchWordList.indexOf(str) === -1) {
        this.setItem("searchWordList", [...searchWordList, str]);
      }
    },
    async handleSearch(keyword) {
      if (this.loading) {
        return;
      }
      this.$refs.input.focus();
      this.keyword = keyword;
      this.setSearchWordList(keyword);
      const value = keyword.trim();
      if (value.length) {
        const data = await Api.fundSearch({ key: keyword, m: 1 });
        const resultList = data.Datas.map(item =>
          update(item, {
            __code: { $set: this.brightKeyword(item.CODE) },
            __name: { $set: this.brightKeyword(item.NAME) }
          })
        );
        this.searchlist = this.parseData(resultList);
        this.display = true;
      } else {
        this.display = false;
        this.searchlist = [];
      }
    },
    handleDelete(key, value) {
      const list = this.getItem(key);
      this.setItem(
        key,
        list.filter(f => f !== value)
      );
      if (key == "fundlist") {
        this.fundList = this.fundList.filter(f => f.fundcode !== value);
      } else {
        this.$refs.input.focus();
        this.searchWordList = this.searchWordList.filter(
          f => f.value !== value
        );
      }
    },
    handleAddFund(id) {
      const fundList = this.getItem("fundlist");
      if (fundList.indexOf(id) === -1) {
        this.setItem("fundlist", [...fundList, id]);
        Api.getFundList(id).then(data => {
          this.fundList.push(data);
        });
      }
    },
    isAdd(key, value) {
      const fundList = this.getItem(key);
      const index = fundList.indexOf(value);
      return !!~index;
    },
    brightKeyword(value) {
      const keyword = this.keyword;
      if (~value.indexOf(keyword)) {
        const reg = new RegExp(keyword);
        return value.replace(reg, `<font color='red'>${keyword}</font>`);
      }
      return value;
    },
    getItem(key) {
      return JSON.parse(localStorage.getItem(key)) || [];
    },
    setItem(key, items) {
      localStorage.setItem(key, JSON.stringify(items));
    },
    parseData(data) {
      return JSON.parse(JSON.stringify(data));
    },
    setQuotesInterval() {
      if (this.previous !== this.current) {
        this.quotesInterval = setInterval(this.handleSwitchQuotes, 5000);
      }
    },
    sendIpcMsg() {
      let msg = "";
      const quotes = this.quotes;
      const current = this.current;
      quotes.slice(this.getPreNum(current), current).forEach(item => {
        msg += `${item.f14} ${Number(item.f2).toFixed(2)}${
          item.f3 > 0 ? "↑" : item.f3 < 0 ? "↓" : "─"
        } ${Number(item.f3).toFixed(2)}%\n`;
      });
      ipcRenderer.send("setToolTip", msg);
    }
  },
  async mounted() {
    await this.handleSyncFund(true);
    this.setQuotesInterval();
    this.interval = setInterval(this.handleSyncFund, 15000);
  },
  destroyed() {
    clearInterval(this.interval);
    clearInterval(this.quotesInterval);
  }
};
</script>
<style>
.list {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 20px;
  height: 100%;
}

.list > .searchBox {
  position: relative;
}

.list > .searchBox .search {
  display: flex;
  flex-direction: row;
}

.list > .searchBox .add,
.list > .searchBox .search .searchBtn {
  display: flex;
  justify-content: center;
  cursor: pointer;
  height: 25px;
  line-height: 25px;
  align-items: center;
  border-radius: 0 5px 5px 0;
  width: 60px;
  color: #666;
  border-top: 1px solid #dce0e2;
  border-right: 1px solid #dce0e2;
  border-bottom: 1px solid #dce0e2;
}

.list > .searchBox .add {
  width: 40px;
  color: green;
  border: 1px solid #dce0e2;
  border-radius: 5px;
}

.list > .searchBox > .search > input {
  width: 270px;
  height: 25px;
  padding: 0 5px;
  border-radius: 5px 0px 0px 5px;
  border: 1px solid #dce0e2;
  outline-color: #00bbb8;
}

.list > .searchBox > .searchList {
  position: absolute;
  background-color: white;
  border-radius: 6px;
  border: 1px solid rgba(0, 0, 0, 0.2);
  box-shadow: 0 3px 9px rgba(0, 0, 0, 0.5);
  background-clip: padding-box;
  width: 330px;
  max-height: 250px;
  overflow: auto;
  margin-top: 2px;
}

.list > .searchBox > .searchList > ul {
  margin: 10px;
}

.list > .searchBox > .searchList li {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #dce0e2;
  padding: 5px;
  height: 35px;
}

.list > .searchBox > .searchList .Delete {
  display: none;
  color: #ffffff;
  border-radius: 50%;
  background: red;
  width: 16px;
  height: 16px;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.list > .searchBox > .searchList li:hover .Delete {
  display: flex;
}

.list > .searchBox > .searchList .notFound {
  height: 30px;
  line-height: 30px;
  text-align: center;
}

.list > .searchBox > .searchList li:hover {
  background: #eeeeee;
}

.list > .searchBox > .searchList li div {
  display: flex;
  flex-direction: center;
  align-items: center;
  justify-content: space-between;
}

.list > .searchBox > .searchList li div > span {
  display: inline-block;
  white-space: nowrap;
  margin-right: 10px;
  max-width: 160px;
}

.list .red {
  color: red;
}

.list .green {
  color: green;
}

.list .gray {
  color: #999999;
}

.list .time {
  width: 100%;
  display: flex;
  justify-content: flex-start;
  padding-top: 5px;
  padding-left: 10px;
}

.list .quotes {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 50px;
  min-height: 50px;
  overflow: hidden;
  padding: 0px 10px;
}

.list .quotes .quotesItem {
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  padding: 4px 0px;
  height: 100%;
}

.list .quotes .out {
  margin-top: -50px;
  transition: margin-top 1s;
}

.list .quotes .item {
  margin: 0px 2px;
  width: calc((100% - 24px) / 3);
}

.list .quotes .item .quotesAmp {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.list section {
  height: 100%;
}

.list table {
  height: 100%;
}

.list thead tr {
  display: table;
}

.list tbody {
  display: block;
  overflow-y: auto;
  height: 100%;
}

.list .empty {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  font-size: 15px;
  margin-top: 10px;
  flex: 1;
}

.list table thead td {
  background: #dce0e2;
}

.list table tr > td {
  padding: 2px;
  height: 20px;
  line-height: 20px;
  width: 50px;
  text-align: center;
  border: 1px solid #666666;
}

.list table thead tr > td:nth-child(3),
.list table tbody tr > td:nth-child(3) {
  max-width: 120px;
  min-width: 120px;
}

.list .delete {
  cursor: pointer;
  text-decoration: underline;
  color: red;
}
</style>