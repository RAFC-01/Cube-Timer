const { app, globalShortcut, BrowserWindow, Menu, ipcMain} = require('electron');
const path = require('path');
const fs = require('fs');
const msgpack = require('msgpack5')();

let devMode = true;

if (devMode) require('electron-reload')(__dirname);

const savesDir = path.join(__dirname, 'saves');
const sessionsDir = path.join(savesDir, 'sessions');

const timerFileExtension = 'rctimer';

const fileLocations = {
  'saves': savesDir,
  'sessions': sessionsDir
}
const fileExtensions = {
  'saves': 'json',
  'sessions': timerFileExtension,
}


function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    title: 'Cube Timer',
    backgroundColor: '#161616',
    autoHideMenuBar: true,
    show: false,
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

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  ipcMain.on('save-data', (event, data) => {
    
    if (!data.fileLoc) data.fileLoc = 'saves';

    let dir = fileLocations[data.fileLoc];
    if (!dir) throw console.error('no dir found with name ', data.fileLoc);
    
    let ext = fileExtensions[data.fileLoc]; // the dir is the save as for file extensions, so error is imposible here 

    const filePath = path.join(dir, data.path+'.'+ext);

    let times = data.times;

    if (!data.multiple) times = data.file;
      // Write the updated data back to the file
      let dataToSave = ext == 'json' ? JSON.stringify(times) : msgpack.encode(times);
      fs.writeFile(filePath, dataToSave, () => {
      if (data.closing){
        mainWindow.webContents.send('close-app');
      }    
    });
    return true;
  });
  ipcMain.on('get-data', (event, data) => {

    let dir = fileLocations[data.fileLoc];
    if (!dir) throw console.error('no dir found with name ', data.fileLoc);
    
    let ext = fileExtensions[data.fileLoc]; // the dir is the save as for file extensions, so error is imposible here 

    if (data.type == 'bin') ext = timerFileExtension;

    const filePath = path.join(dir, data.path+'.'+ext);

    if (!fs.existsSync(filePath)){
      let defaultData = {
        path: data.path,
        check: true,
        session: null,
        nickName: '',
        location: 'menu',
        cubes: [],
        fileLoc: data.fileLoc
      }
      if (data.type != 'mainData') defaultData = {check: true, fileLoc: data.fileLoc};
      let dataToSave = ext == 'json' ? JSON.stringify(defaultData) : msgpack.encode(defaultData);
      fs.writeFile(filePath, dataToSave, () => {
        mainWindow.webContents.send('load-data', {path: data.path, data: defaultData});
      });
      return;
    }

    fs.readFile(filePath, (event, file) => {
      const fileContent = ext == 'json' ? JSON.parse(file) : msgpack.decode(file);
      mainWindow.webContents.send('load-data', {path: data.path, data: fileContent});
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

