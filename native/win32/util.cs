using System;
using System.ComponentModel;
using System.Text;
using System.Diagnostics;
using System.Collections.Generic;
using System.Runtime.InteropServices;

namespace ActiveWin
{

  public class ScreenInfo
  {
    public string Availability;
    public string ScreenHeight;
    public string ScreenWidth;
    public RECT MonitorArea;
    public RECT WorkArea;
    public int Index;
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

    public static int getActiveProcessId() {
      IntPtr activeWindowHandle = WinApi.GetForegroundWindow();
      int processId = 0;
      WinApi.GetWindowThreadProcessId(activeWindowHandle, ref processId);
      return processId;
    }

    public static Tuple<int, string, string> getWindowInfo(int processId) {
      IntPtr windowHandle = Process.GetProcessById(processId).MainWindowHandle;
      string processFileName = Utils.getProcessFilename(processId);

      int windowTextLength = WinApi.GetWindowTextLengthW(windowHandle) + 1;
      StringBuilder  windowText = new StringBuilder(windowTextLength);
      int written = WinApi.GetWindowTextW(windowHandle, windowText, windowTextLength);

      return Tuple.Create(windowHandle.ToInt32(), processFileName, windowText.ToString());
    }

    public static RECT getBounds(int processId) {
      Process proc = Process.GetProcessById(processId);

      // Window Rect provides bad values in certain situations and should be affected
      // https://groups.google.com/forum/#!topic/microsoft.public.vc.mfc/02s-1NJAqEI
      WINDOWINFO info = new WINDOWINFO(); 
      info.cbSize = (uint) Marshal.SizeOf(typeof(WINDOWINFO));
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

    public static List<ScreenInfo> getScreens(RECT bounds) {
      List<ScreenInfo> col = new List<ScreenInfo>();
      int i = 0;

      foreach (MonitorInfo mi in WinApi.getMonitors()) {
        if (!Utils.contains(mi.work, bounds)) {
          continue;
        }

        ScreenInfo di = new ScreenInfo();
        di.ScreenWidth = (mi.monitor.Right - mi.monitor.Left).ToString();
        di.ScreenHeight = (mi.monitor.Bottom - mi.monitor.Top).ToString();
        di.MonitorArea = mi.monitor;
        di.WorkArea = mi.work;
        di.Availability = mi.flags.ToString();
        di.Index = i++;
        col.Add(di);
      }

      if (col.Count == 0) {
        throw new Exception("Screens not found");
      }

      return col;
    }
  }
}