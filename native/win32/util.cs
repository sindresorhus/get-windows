using System;
using System.ComponentModel;
using System.Text;
using System.Diagnostics;
using System.Collections.Generic;

namespace ActiveWin
{

  public class ScreenInfo
  {
    public string Availability;
    public string ScreenHeight;
    public string ScreenWidth;
    public RECT MonitorArea;
    public RECT WorkArea;
  }

  public class Utils 
  {   
    public static string getProcessFilename(int processId) {
      int processFileNameLength = 10240;
      StringBuilder processFileName = new StringBuilder(processFileNameLength);

      IntPtr processHandle = WinApi.OpenProcess(WinApi.QueryLimitedInformation, false, processId);
      
      try {
        // Get file name
        bool res = WinApi.QueryFullProcessImageNameW(processHandle, 0, processFileName, ref processFileNameLength);
        WinApi.checkError(res);
      } finally {
        // Close Handle
        WinApi.CloseHandle(processHandle);
      }

      return processFileName.ToString().Replace("\\", "\\\\").Replace("\"", "\\\"");
    }

    public static string getWindowTitle(IntPtr windowHandle) {
      // Get Window Title
      int windowTextLength = WinApi.GetWindowTextLengthW(windowHandle) + 1;
      StringBuilder  windowText = new StringBuilder(windowTextLength);
      int written = WinApi.GetWindowTextW(windowHandle, windowText, windowTextLength);
      return windowText.ToString();
    }

    public static Tuple<int, string> getActiveProcessInfo() {
      IntPtr activeWindowHandle = WinApi.GetForegroundWindow();

      int processId = 0;
      WinApi.GetWindowThreadProcessId(activeWindowHandle, ref processId);

      string processFileName = Utils.getProcessFilename(processId);

      return Tuple.Create(processId, processFileName);
    }

    public static Tuple<int, string> getActiveWindowInfo() {
      IntPtr activeWindowHandle = WinApi.GetForegroundWindow();
      string windowTitle = Utils.getWindowTitle(activeWindowHandle);
      return Tuple.Create(activeWindowHandle.ToInt32(), windowTitle);
    }

    public static List<ScreenInfo> getScreens() {
      List<ScreenInfo> col = new List<ScreenInfo>();
      WinApi.EnumDisplayMonitors( IntPtr.Zero, IntPtr.Zero, delegate (IntPtr hMonitor, IntPtr hdcMonitor, ref RECT lprcMonitor, IntPtr dwData) {
          MonitorInfo mi = new MonitorInfo();
          bool success = WinApi.GetMonitorInfo(hMonitor, ref mi);

          WinApi.checkError(success);

          if (success) {
            ScreenInfo di = new ScreenInfo();
            di.ScreenWidth = (mi.monitor.Right - mi.monitor.Left).ToString();
            di.ScreenHeight = (mi.monitor.Bottom - mi.monitor.Top).ToString();
            di.MonitorArea = mi.monitor;
            di.WorkArea = mi.work;
            di.Availability = mi.flags.ToString();
            col.Add(di);
          }
          return true;
        }, 
        IntPtr.Zero );

      return col;
    }

    public static RECT getBounds(int pid) {
      Process proc = Process.GetProcessById(pid);

      // Window Rect provides bad values in certain situations and should be affected
      // https://groups.google.com/forum/#!topic/microsoft.public.vc.mfc/02s-1NJAqEI
      WINDOWINFO info = new WINDOWINFO(); 
      bool res = WinApi.GetWindowInfo(proc.MainWindowHandle, ref info);
      RECT rect = info.rcWindow;
      WinApi.checkError(res);

      if (WinApi.IsZoomed(proc.MainWindowHandle)) { 
        rect.Top +=  (int)(info.cyWindowBorders); 
        rect.Left +=  (int)(info.cxWindowBorders); 
        rect.Bottom -=  (int)(info.cyWindowBorders); 
        rect.Right -=  (int)(info.cxWindowBorders); 
      } else if ((info.dwStyle & WinApi.WS_THICKFRAME) != 0) { 
        rect.Top +=  (int)(info.cyWindowBorders / 4); 
        rect.Left +=  (int)(info.cxWindowBorders / 4); 
        rect.Bottom -=  (int)(info.cyWindowBorders / 4); 
        rect.Right -=  (int)(info.cxWindowBorders / 4); 
      } else if ((info.dwStyle & WinApi.WS_OVERLAPPEDWINDOW) != 0) { 
        rect.Left +=  (int)(info.cxWindowBorders); 
        rect.Bottom -=  (int)(info.cyWindowBorders); 
        rect.Right -=  (int)(info.cxWindowBorders); 
      } 

      return rect;
    }

    public static bool contains(RECT parent, RECT child) {      
      return parent.Left <= child.Right && child.Left <= parent.Right &&
        parent.Top <= child.Bottom && child.Top <= parent.Bottom;
    }

    public static Tuple<int, ScreenInfo> getScreen(RECT bounds) {
      int i = 0;
      foreach (ScreenInfo item in Utils.getScreens()) {
        if (Utils.contains(item.WorkArea, bounds)) {
          return Tuple.Create(i, item);
        }
        i += 1;
      }
      throw new Exception("Screen not found");
    }
  }
}