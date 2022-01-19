const activeWindow = require('./index');

setTimeout(() => {
    const startTime = performance.now()
    const win = activeWindow.sync();
    const endTime = performance.now()
    console.log(`Call to activeWindow took ${endTime - startTime} milliseconds`)
    console.log(win.owner.name);
    console.log(win.owner.path);
    console.log(win.owner.processId);    
    console.log(win.title);
}, 1000)


/*
WinStore.App.exe
C:\Program Files\WindowsApps\Microsoft.WindowsStore_22112.1401.2.0_x64__8wekyb3d8bbwe\WinStore.App.exe
11128


Application Frame Host
C:\Windows\System32\ApplicationFrameHost.exe
11128
*/