using System;
using System.Runtime.InteropServices;
using System.Text;
using System.ComponentModel;
using System.IO;
using System.Collections.Generic;

namespace ActiveWin
{
  [StructLayout(LayoutKind.Sequential)]
  public struct RECT
  {
    public int Left;        // x position of upper-left corner
    public int Top;         // y position of upper-left corner
    public int Right;       // x position of lower-right corner
    public int Bottom;      // y position of lower-right corner
  }

 [StructLayout(LayoutKind.Sequential)] //, CharSet=CharSet.Auto)]
  public struct MonitorInfo
  {
    public UInt32 size;
    public RECT monitor;
    public RECT work;
    public UInt32 flags;
  }

  [StructLayout(LayoutKind.Sequential)]
  public struct WINDOWINFO
  {
    public uint cbSize;
    public RECT rcWindow;
    public RECT rcClient;
    public uint dwStyle;
    public uint dwExStyle;
    public uint dwWindowStatus;
    public uint cxWindowBorders;
    public uint cyWindowBorders;
    public ushort atomWindowType;
    public ushort wCreatorVersion;
  }

  public class WinApi 
  {
    public static uint QueryLimitedInformation = 0x1000;
    public static uint WS_THICKFRAME  = 0x00040000;
    public static uint WS_OVERLAPPED  = 0x00000000;
    public static uint WS_MINIMIZEBOX = 0x00020000;
    public static uint WS_MAXIMIZEBOX = 0x00010000;
    public static uint WS_SYSMENU     = 0x00080000;
    public static uint WS_CAPTION     = 0x00C00000;     /* WS_BORDER | WS_DLGFRAME  */

    public static uint WS_OVERLAPPEDWINDOW = WS_OVERLAPPED | 
      WS_CAPTION     | 
      WS_SYSMENU     | 
      WS_THICKFRAME  | 
      WS_MINIMIZEBOX | 
      WS_MAXIMIZEBOX;

    delegate bool MonitorEnumDelegate(IntPtr hMonitor, IntPtr hdcMonitor, ref RECT lprcMonitor, IntPtr dwData);

    #region User32
    [DllImport("user32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool GetWindowRect(IntPtr hWnd, ref RECT rect);

    [DllImport("user32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.SysUInt)]
    public static extern IntPtr GetDesktopWindow();

    [DllImport("user32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool GetMonitorInfo(IntPtr hMptr, ref MonitorInfo info);

    [DllImport("user32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    static extern bool EnumDisplayMonitors(IntPtr hdc, IntPtr lprcClip, MonitorEnumDelegate lpfnEnum, IntPtr dwData);

    [DllImport("user32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool IsZoomed(IntPtr hWnd);

    [DllImport("user32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool GetWindowInfo(IntPtr hWnd, ref WINDOWINFO info);

    [DllImport("user32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.SysUInt)]
    public static extern IntPtr MonitorFromWindow(IntPtr hWnd, uint flags);

    // https://msdn.microsoft.com/en-us/library/windows/desktop/ms633505(v=vs.85).aspx
    [DllImport("user32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.SysUInt)]
    public static extern IntPtr GetForegroundWindow();

    // https://msdn.microsoft.com/en-us/library/windows/desktop/ms633520(v=vs.85).aspx
    [DllImport("user32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.I4)]
    public static extern int GetWindowTextW(
      IntPtr hwnd, 
      [MarshalAs(UnmanagedType.LPWStr)]
      StringBuilder buffer, 
      int maxCount 
    );

    // https://msdn.microsoft.com/en-us/library/windows/desktop/ms633521(v=vs.85).aspx
    [DllImport("user32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.I4)]
    public static extern int GetWindowTextLengthW(IntPtr hwnd);	


    // https://msdn.microsoft.com/en-us/library/windows/desktop/ms633522(v=vs.85).aspx
    [DllImport("user32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.I4)]
    public static extern int GetWindowThreadProcessId(IntPtr hwd, ref int proccessId);
    #endregion

    #region Kernel32
    // https://msdn.microsoft.com/en-us/library/windows/desktop/ms684320(v=vs.85).aspx
    [DllImport("kernel32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.SysUInt)]
    public static extern IntPtr OpenProcess(uint access, bool inheritHandle, int processId);

    // https://msdn.microsoft.com/en-us/library/windows/desktop/ms724211(v=vs.85).aspx
    [DllImport("kernel32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool CloseHandle(IntPtr hwnd);

    // https://msdn.microsoft.com/en-us/library/windows/desktop/ms684919(v=vs.85).aspx
    [DllImport("kernel32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool QueryFullProcessImageNameW(
      IntPtr hproc,
      uint flags,
      [MarshalAs(UnmanagedType.LPWStr)]
      StringBuilder lpExeName, 
      ref int size
    );
    #endregion

    public static void checkError(bool good) {
      if (!good) {
        System.Console.Error.WriteLine(new Win32Exception().Message);
        Environment.Exit(1);
      }
    }

    public static List<MonitorInfo> getMonitors() {
      List<MonitorInfo> col = new List<MonitorInfo>();
      EnumDisplayMonitors( IntPtr.Zero, IntPtr.Zero, delegate (IntPtr hMonitor, IntPtr hdcMonitor, ref RECT lprcMonitor, IntPtr dwData) {
          MonitorInfo mi = new MonitorInfo();
          mi.size = (uint)Marshal.SizeOf( mi );
          bool success = GetMonitorInfo(hMonitor, ref mi);

          checkError(success);

          if (success) {
            col.Add(mi);
          }
          return true;
        }, 
        IntPtr.Zero );

      return col;
    }
  }
}     