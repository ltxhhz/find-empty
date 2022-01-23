console.log('index');
window.vueApp = new Vue({
  el: '#vue',
  components: {
    'notice-box': {
      data() {
        return {
          list: []
        }
      },
      template: `
      <div class="notice-box">
        <transition-group name="notice">
          <article class="message notice-item" :class="['is-'+(item.type??'primary')]" v-for="(item,index) in list" :key="item.id">
            <div class="message-header">
              <p>{{item.header??'提示'}}</p>
              <button class="delete" @click="close(index)"></button>
            </div>
            <div class="message-body">
              {{item.body}}
            </div>
          </article>
        </transition-group>
      </div>`,
      methods: {
        close() {
          this.list.shift()
        },
        show(opt, duration = 1500) {
          let len
          if (typeof opt == 'string') len = this.list.push({
            body: opt,
            id: randomString(6)
          })
          else {
            opt.id = randomString(6)
            len = this.list.push(opt)
          }
          if (duration != 0) {
            setTimeout(() => {
              this.close()
            }, duration);
          }
        }
      }
    }
  },
  data: {
    list: [/* {
      "name": "1034751990",
      "childFiles": [],
      "lastModify": "2022-01-23 14:56:24",
      "path": "E:\\测试\\1034751990",
      "childNum": 0,
      "checked": false,
      "id": "iabara",
      "confirm": false
    }, {
        "name": "1080647538",
        "childFiles": [],
        "lastModify": "2022-01-23 14:56:24",
        "path": "E:\\测试\\1080647538",
        "childNum": 0,
        "checked": false,
        "id": "2kyoip",
        "confirm": false
      } */],
    allCheck: false,
    loading: false,
    disable: true,
    confirm: false,
    deleting: false
  },
  template: `<div class="box">
      <div class="level">
        <div class="buttons level-left m-0">
          <button class="button is-primary mb-0" @click="selectInvert">反选</button>
          <button class="button is-success mb-0" @click="choose">一键选择</button>
          <button class="button mb-0" :class="['is-'+(confirm?'warning':'danger'),{'is-loading':deleting}]" @click="deleteMulti">{{confirm?'确认':'删除'}}</button>
          <!-- <button class="button is-primary">重命名</button> -->
        </div>
        <div class="buttons level-right">
          <button class="button is-success" :class="{'is-loading':loading}" :disabled="disable" @click="check">检查目录</button>
        </div>
      </div>
      <div class="table is-striped is-hoverable is-fullwidth">
        <div class="thead">
          <div class="tr">
            <div class="th"><input type="checkbox" v-model="allCheck" @change="allChecked"></div>
            <div class="th">文件名</div>
            <div class="th">子项目数</div>
            <div class="th">修改日期</div>
          </div>
        </div>
        <transition-group tag="div" class="tbody">
          <div class="tr" v-for="(item,index) in list" @click.stop="rowClick(index)" :key="item.id">
            
              <div class="td"><input v-model="item.checked" @change="listCheckChange" type="checkbox"></div>
              <div class="td"><button class="button is-ghost" @click.stop="openExplorer(item.path)">{{item.name}}</button></div>
              <div class="td action buttons are-small">
                <button class="button is-outlined is-" :class="['is-'+(item.confirm?'warning':'danger')]" @click.stop="deleteOne(index)">{{item.confirm?'确认':'删除'}}</button>
                <!-- <button class="button is-outlined is-primary">重命名</button> -->
              </div>
              <div class="td action-n">{{item.childNum}}</div>
              <div class="td action-n">{{item.lastModify}}</div>
            
          </div>
        </transition-group>
      </div>
      <notice-box ref="notice" />
    </div>
    `,
  mounted() {
    const that = this
    feObject = new Proxy(feObject, {
      set(target, prop, value) {
        target[prop] = value
        if (prop === 'localPath') {
          if (value === '') {
            that.disable = true
          } else {
            that.disable = false
          }
        }
        return true
      }
    })
  },
  methods: {
    allChecked(e) {
      this.list.forEach((_, i) => {
        this.$set(this.list[i], 'checked', e.target.checked)
      });
    },
    selectInvert(e) {
      let a = null
      this.list.forEach((_, i) => {
        if (a === null) a = !_.checked
        else if (a === _.checked) a = false
        this.$set(this.list[i], 'checked', !_.checked)
      });
      this.allCheck = a
    },
    listCheckChange() {
      this.allCheck = !this.list.some((item) => !item.checked)
    },
    rowClick(i) {
      this.$set(this.list[i], 'checked', !this.list[i].checked)
      this.listCheckChange()
    },
    async check(e) {
      try {
        let exist = feObject.pathExist(),
          isFolder = feObject.isFolder()
        if (exist && isFolder) {
          if (this.list.length !== 0) {
            this.list.splice(0)
            // await wait(7e2)
          }
          this.list.push(...feObject.checkPath().map(e => {
            e.childNum = e.childFiles.length
            e.checked = false
            e.id = randomString()
            e.confirm = false
            return e
          }))
          // this.disable = true
        } else {
          this.$refs.notice.show({
            type: "link",
            body: `${exist ? '' : '路径不存在'}\n${isFolder ? '' : '路径不是文件夹'}`
          })
        }
      } catch (error) {
        console.error(error);
      }
    },
    choose() {
      this.list.forEach(e => {
        if (e.childNum === 0) {
          e.checked = true
        } else {
          e.checked = false
          this.allCheck = false
        }
      });
    },
    deleteOne(i, confirm = false) {
      if (!this.list[i].confirm && !confirm) {
        this.list[i].confirm = true
        setTimeout(() => {
          if (this.list[i]) this.list[i].confirm = false
        }, 1000);
      } else {
        return feObject.rmdir(this.list[i].path, () => {
          !confirm && this.list.splice(i, 1)
        })
      }
    },
    async deleteMulti(e) {
      if (!this.confirm) {
        this.confirm = true
        setTimeout(() => {
          this.confirm = false
        }, 1000);
      } else {
        this.deleting = true
        let proms = []
        this.list.forEach((item, i) => {
          if (item.checked) {
            proms.push(this.deleteOne(i, true))
          }
        });
        Promise.allSettled(proms).then((res) => {
          let i = 0
          this.list = this.list.filter((item) => {
            if (!item.checked) return true
            return res[i++].status !== 'fulfilled'
          })
          this.deleting = false
        })
      }
    },
    openExplorer(path) {
      feObject.openInExplorer(path)
    }
  }
})

function randomString(len = 6) {
  if (len > 11) throw Error("长度不能大于11")
  return Math.random().toString(36).substring(2, 2 + len)
}
function wait(ms) {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, ms);
  });
}