<template>
  <div class="list" @click="display=false">
    <div class="searchBox">
      <div class="search">
        <input
          type="text"
          ref="input"
          placeholder="请输入基金代码、名称或简写"
          v-model="keyword"
          @input="display=false"
          @keyup.enter="handleSearch"
        />
        <span class="searchBtn" @click="handleSearch">搜索</span>
      </div>
      <div class="searchList" v-show="display" @click.stop>
        <ul v-if="!!searchlist.length">
          <li v-for="(item, i) in searchlist" :key="i">
            <div>
              <span v-html="item.__name"></span>
              <span class="ellipsis" :title="item.NAME" v-html="item.__code"></span>
            </div>
            <span class="add" v-if="!isAdd(item.CODE)" @click="handleAdd(item.CODE)">添加</span>
            <span class="disabled" v-else>已添加</span>
          </li>
        </ul>
        <div v-else>{{`没有找到与${this.keyword}相关的内容`}}</div>
      </div>
    </div>
    <section>
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
        <tbody v-if="list.length">
          <tr v-for="(item, i) in list" :key="i">
            <td>{{i+1}}</td>
            <td>{{item.fundcode}}</td>
            <td class="ellipsis" :title="item.name">{{item.name}}</td>
            <td :class="{red: item.gszzl > 0, green: item.gszzl < 0}">{{`${item.gszzl}%`}}</td>
            <td class="delete" @click="handleDelete(item.fundcode)">删除</td>
          </tr>
        </tbody>
        <tbody v-else class="empty">
          <tr>
            <td>未添加任何基金</td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<script>
import update from "immutability-helper";
import * as Api from "@common/Api";
export default {
  data() {
    return {
      display: false,
      keyword: "",
      list: [],
      searchlist: []
    };
  },
  methods: {
    handleSyncFund() {
      const list = this.getItem();
      const datas = [];
      const func = index => {
        if (index >= list.length) {
          this.list = JSON.parse(JSON.stringify(datas));
          return Promise.resolve(datas);
        }
        return Api.getFund(list[index]).then(
          data => {
            data && datas.push(data);
            return func(index + 1);
          },
          () => func(index + 1)
        );
      };
      return func(0);
    },
    async handleSearch() {
      const keyword = this.keyword;
      const value = keyword.trim();
      if (value.length) {
        const data = await Api.fundSearch({ key: keyword, m: 1 });
        const resultList = data.Datas.map(item =>
          update(item, {
            __code: { $set: this.brightKeyword(item.CODE) },
            __name: { $set: this.brightKeyword(item.NAME) }
          })
        );
        this.searchlist = JSON.parse(JSON.stringify(resultList));
        this.display = true;
      } else {
        this.display = false;
        this.searchlist = [];
        this.$refs.input.focus();
      }
    },
    handleDelete(id) {
      const list = this.getItem();
      this.setItem(list.filter(f => f !== id));
      this.list = this.list.filter(f => f.fundcode !== id);
    },
    handleAdd(id) {
      if (!this.isAdd(id)) {
        const list = this.getItem();
        this.setItem([...list, id]);
        Api.getFund(id).then(data => {
          this.list.push(data);
        });
      }
    },
    isAdd(id) {
      const list = this.getItem();
      const index = list.indexOf(id);
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
    getItem() {
      return JSON.parse(localStorage.getItem("fundlist")) || [];
    },
    setItem(items) {
      localStorage.setItem("fundlist", JSON.stringify(items));
    }
  },
  mounted() {
    this.handleSyncFund();
    this.interval = setInterval(this.handleSyncFund, 15000);
  },
  destroyed() {
    clearInterval(this.interval);
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

.list > .searchBox > .searchList li:hover {
  background: #eeeeee;
}

.list > .searchBox > .searchList li div {
  display: flex;
  flex-direction: center;
  align-items: center;
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

.list section {
  margin-top: 10px;
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

.list .empty tr {
  display: table;
  margin-top: 10px;
  width: 100%;
  font-size: 15px;
}

.list .empty tr td {
  border: none;
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