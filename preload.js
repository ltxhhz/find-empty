const fs = require('fs')
const path = require('path')
console.log('preload');
Date.prototype.format = function (fmt = 'yyyy-MM-dd hh:mm:ss') {
  const o = {
    "M+": this.getMonth() + 1, //月份 
    "d+": this.getDate(), //日 
    "h+": this.getHours(), //小时 
    "m+": this.getMinutes(), //分 
    "s+": this.getSeconds(), //秒 
    "q+": Math.floor((this.getMonth() + 3) / 3), //季度 
    "S": this.getMilliseconds() //毫秒 
  };
  const year = /(y+)/.exec(fmt)
  if (year) fmt = fmt.replace(year[1], (this.getFullYear() + "").substring(4 - year[1].length));
  for (let k in o) {
    const a = new RegExp("(" + k + ")").exec(fmt)
    if (a) {
      fmt = fmt.replace(a[1], (a[1].length == 1) ? (o[k]) : (("00" + o[k]).substring((o[k].toString()).length)));
    }
  }
  return fmt;
}
window.feObject = {
  pathExist() {
    return fs.existsSync(this.localPath)
  },
  isFolder(path) {
    return fs.statSync(path ?? this.localPath).isDirectory()
  },
  checkPath() {
    return fs.readdirSync(this.localPath)
      .filter(e => this.isFolder(path.resolve(this.localPath, e)))
      .map(e => {
        let dir = path.resolve(this.localPath, e),
          stat = fs.statSync(dir)
        return {
          name: e,
          childFiles: fs.readdirSync(dir),
          lastModify: new Date(stat.mtime).format(),
          path: dir
        }
      })
  },
  rmdir(path, cb) {
    return new Promise((resolve, reject) => {
      fs.rm(path, { force: true, recursive: true }, (err) => {
      if (err) reject(err)
      resolve()
      cb?.()
    })
    });
    
  },
  pathResolve(...args){
    return path.resolve(args)
  },
  openInExplorer: utools.shellShowItemInFolder,
  localPath: ''
}
utools.onPluginEnter(({
  code,
  type,
  payload
}) => {
  switch (code) {
    case 'main':
      switch (type) {
        case 'text':
        case 'regex':
          if (["查找空文件夹", "空文件夹", "find empty"].includes(payload)) {
            utools.setSubInput(({
              text
            }) => {
              feObject.localPath = text
            }, '输入本地路径')
          } else {
            feObject.localPath = payload
          }
          break;
        case 'files':
          feObject.localPath = payload[0].path
          break;
        default:
          break;
      }
      break;
    default:
      break;
  }
  console.log('用户进入插件', code, type, payload)
})
utools.onPluginOut(() => {
  // utools.removeSubInput()
  // utools.showNotification('退出')
  console.log('用户退出插件')
})