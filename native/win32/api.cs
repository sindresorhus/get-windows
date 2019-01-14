using System;
using System.Runtime.InteropServices;
using System.Text;
using System.Diagnostics;
using System.ComponentModel;
using System.IO;

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

  public class MonitorInfo
  {
    public UInt32 size;
    public RECT monitor;
    public RECT work;
    public UInt32 flags;

    public MonitorInfo()
    {
      monitor = new RECT();
      work = new RECT();

      size = (UInt32)System.Runtime.InteropServices.Marshal.SizeOf(typeof(MonitorInfo));
      flags = 0;
    }
  }

  public class ScreenInfo
  {
    public string Availability;
    public string ScreenHeight;
    public string ScreenWidth;
    public RECT MonitorArea;
    public RECT WorkArea;
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

    public WINDOWINFO(Boolean? filler): this()   // Allows automatic initialization of "cbSize" with "new WINDOWINFO(null/true/false)".
    {
      cbSize = (UInt32)(Marshal.SizeOf(typeof( WINDOWINFO )));
    }
  }

  public delegate bool MonitorEnumProc(IntPtr hMonitor, IntPtr hdcMonitor, ref RECT lprcMonitor, IntPtr dwData);

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

    #region User32
    [DllImport("user32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool GetWindowRect(IntPtr hWnd, ref RECT rect);

    [DllImport("user32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.SysUInt)]
    public static extern IntPtr GetDesktopWindow();

    [DllImport("user32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.SysUInt)]
    public static extern bool GetMonitorInfo(IntPtr hMptr, ref MonitorInfo info);

    [DllImport("user32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.SysUInt)]
    public static extern void EnumDisplayMonitors(IntPtr hdc, IntPtr lprcClip, MonitorEnumProc lpfnEnum, IntPtr dwData);

    [DllImport("user32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool IsZoomed(IntPtr hWnd);

    [DllImport("user32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool GetWindowInfo(IntPtr hWnd, ref WINDOWINFO info);

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
  }
}     