const { app, BrowserWindow, Tray, Menu, nativeImage } = require('electron');
const path = require('path');

let mainWindow, tray;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 900, height: 750,
        webPreferences: { nodeIntegration: false, contextIsolation: true },
        icon: path.join(__dirname, 'assets/icons/icon.png'),
        titleBarStyle: 'hiddenInset',
        show: false
    });
    mainWindow.loadFile('src/ui/web/index.html');
    mainWindow.once('ready-to-show', () => mainWindow.show());
    mainWindow.on('close', (e) => { e.preventDefault(); mainWindow.hide(); });
}

app.whenReady().then(() => {
    createWindow();
    const icon = nativeImage.createFromPath(path.join(__dirname, 'assets/icons/icon.png'));
    tray = new Tray(icon.resize({ width: 16, height: 16 }));
    const contextMenu = Menu.buildFromTemplate([
        { label: '显示', click: () => mainWindow.show() },
        { label: '退出', click: () => { app.exit(); } }
    ]);
    tray.setToolTip('AlipayQR v3.0');
    tray.setContextMenu(contextMenu);
    tray.on('click', () => mainWindow.show());
});

app.on('window-all-closed', () => {});
