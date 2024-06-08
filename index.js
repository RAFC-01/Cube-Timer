const { app, globalShortcut, BrowserWindow, Menu, ipcMain} = require('electron');
const path = require('path');
const fs = require('fs');
const { assert } = require('console');

let devMode = true;

let fileNames = ['allTimes', 'mainData'];

let recivedData = {};

if (devMode) require('electron-reload')(__dirname);

const savesDir = path.join(__dirname, 'saves');
const sessionsDir = path.join(savesDir, 'sessions');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    title: 'Cube Timer',
    autoHideMenuBar: true,
    webPreferences: {
      // offscreen: true,
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false
    }
  }, );

  if (!devMode) mainWindow.removeMenu();

  mainWindow.loadFile(path.join(__dirname, 'app', 'index.html'));
  mainWindow.webContents.openDevTools();


  ipcMain.on('save-data', (event, data) => {
    
    let dir = data.type.includes('session') ? sessionsDir : savesDir;

    const filePath = path.join(dir, data.type+'.json');

    let times = data.times;

    if (!data.multiple) times = data;
      // Write the updated data back to the file

      fs.writeFile(filePath, JSON.stringify(times, null, 2), 'utf8', () => {
      if (data.closing){
        mainWindow.webContents.send('close-app');
      }    
    });
    return true;
  });
  ipcMain.on('get-data', (event, data) => {

    let dir = data.isSession ? sessionsDir : savesDir;

    const filePath = path.join(dir, data.type+'.json');

    console.log(filePath);

    if (!fs.existsSync(filePath)){
      let defaultData = {
        type: data.type,
        check: true,
        session: null,
        nickName: '',
        location: 'menu',
        cubes: [],
      }
      if (data.type != 'mainData') defaultData = {check: true};
      fs.writeFile(filePath, JSON.stringify(defaultData), 'utf-8', () => {
        mainWindow.webContents.send('load-data', {type: data.type, data: defaultData});
      });
      return;
    }

    fs.readFile(filePath, 'utf-8', (event, file) => {
      const fileContent = JSON.parse(file);
      mainWindow.webContents.send('load-data', {type: data.type, data: fileContent});
    });
  });

}

app.whenReady().then(() => {
    createWindow()
});
app.on('will-quit', () => {
  
    // Unregister all shortcuts.
    globalShortcut.unregisterAll()
  })
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

if (!fs.existsSync(savesDir)) {
  fs.mkdirSync(savesDir);
  console.log('Directory "saves" created');
}
if (!fs.existsSync(sessionsDir)) {
  fs.mkdirSync(sessionsDir);
  console.log('Directory "sessions" created');
}

