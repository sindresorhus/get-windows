using System;
using System.Runtime.InteropServices;
using System.Diagnostics;
using System.ComponentModel;
using System.Text;
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

        public WINDOWINFO(Boolean ?   filler)   :   this()   // Allows automatic initialization of "cbSize" with "new WINDOWINFO(null/true/false)".
        {
            cbSize = (UInt32)(Marshal.SizeOf(typeof( WINDOWINFO )));
        }
    }

    public class ActiveWinUtils 
    {
        
        static uint QueryLimitedInformation = 0x1000;
        static uint WS_THICKFRAME =  0x00040000;
        static uint WS_OVERLAPPED       = 0x00000000;
        static uint WS_MINIMIZEBOX      = 0x00020000;
        static uint WS_MAXIMIZEBOX      = 0x00010000;
        static uint WS_SYSMENU      = 0x00080000;
        static uint WS_CAPTION      = 0x00C00000;     /* WS_BORDER | WS_DLGFRAME  */

        static uint WS_OVERLAPPEDWINDOW = WS_OVERLAPPED  | 
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
        [return: MarshalAs(UnmanagedType.Bool)]
        static extern bool IsZoomed(IntPtr hWnd);

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

        public static RECT getBounds(int pid) {
            Process proc = Process.GetProcessById(pid);
            RECT rect = new RECT();
            bool res = GetWindowRect(proc.MainWindowHandle, ref rect);
            ActiveWinUtils.checkError(res);

            // Window Rect provides bad values in certain situations and should be affected
            // https://groups.google.com/forum/#!topic/microsoft.public.vc.mfc/02s-1NJAqEI
            WINDOWINFO info = new WINDOWINFO(); 
            res = GetWindowInfo(proc.MainWindowHandle, ref info);
            ActiveWinUtils.checkError(res);

            if (IsZoomed(proc.MainWindowHandle)) { 
                rect.Top +=  (int)(info.cyWindowBorders); 
                rect.Left +=  (int)(info.cxWindowBorders); 
                rect.Bottom -=  (int)(info.cyWindowBorders); 
                rect.Right -=  (int)(info.cxWindowBorders); 
            } else if ((info.dwStyle & ActiveWinUtils.WS_THICKFRAME) != 0) { 
                rect.Top +=  (int)(info.cyWindowBorders / 4); 
                rect.Left +=  (int)(info.cxWindowBorders / 4); 
                rect.Bottom -=  (int)(info.cyWindowBorders / 4); 
                rect.Right -=  (int)(info.cxWindowBorders / 4); 
            } else if ((info.dwStyle & ActiveWinUtils.WS_OVERLAPPEDWINDOW) != 0) { 
                rect.Left +=  (int)(info.cxWindowBorders); 
                rect.Bottom -=  (int)(info.cyWindowBorders); 
                rect.Right -=  (int)(info.cxWindowBorders); 
            } 

            return rect;
        }

        static RECT getDesktop() {
            RECT desktop = new RECT();
            bool res = GetWindowRect(GetDesktopWindow(), ref desktop);
            ActiveWinUtils.checkError(res);
            return desktop;
        }

        static string getProcessFilename(int processId) {
            int processFileNameLength = 10240;
            StringBuilder processFileName = new StringBuilder(processFileNameLength);

            IntPtr processHandle = OpenProcess(QueryLimitedInformation, false, processId);
            
            try {
                // Get file name
                bool res = QueryFullProcessImageNameW(processHandle, 0, processFileName, ref processFileNameLength);
                ActiveWinUtils.checkError(res);
            } finally {
                // Close Handle
                CloseHandle(processHandle);
            }

            return processFileName.ToString().Replace("\\", "\\\\").Replace("\"", "\\\"");
        }

        static string getWindowTitle(IntPtr windowHandle) {
            // Get Window Title
            int windowTextLength = GetWindowTextLengthW(windowHandle) + 1;
            StringBuilder  windowText = new StringBuilder(windowTextLength);
            int written = GetWindowTextW(windowHandle, windowText, windowTextLength);
            return windowText.ToString();
        }

        static string generateOutput(string windowTitle, int windowId, int processId, string processFileName, RECT bounds, RECT desktop) { 
           return  String.Format(@"{{
    ""title"": ""{0}"",
    ""id"": {1},
    ""owner"": {{
        ""name"": ""{2}"",
        ""processId"": {3},
        ""path"": ""{4}""
    }},
    ""bounds"": {{
        ""x"": {5},
        ""y"": {6},
        ""width"": {7},
        ""height"": {8}
    }},
    ""desktop"": {{
        ""x"": {9},
        ""y"": {10},
        ""width"": {11},
        ""height"": {12}
    }}
}}", 
                windowTitle, 
                windowId, // Window Id
                Path.GetFileName(processFileName), 
                processId,
                processFileName, 
                bounds.Left, bounds.Top, 
                bounds.Right-bounds.Left, bounds.Bottom-bounds.Top,
                desktop.Left, desktop.Top, 
                desktop.Right-desktop.Left, desktop.Bottom-desktop.Top);
        }

        static void Main(string[] args)
        {   
            // Get a "handle" of the active window
            IntPtr activeWindowHandle = GetForegroundWindow();
            int processId = 0;
            GetWindowThreadProcessId(activeWindowHandle, ref processId);

            string windowTitle = ActiveWinUtils.getWindowTitle(activeWindowHandle);
            string processFileName = ActiveWinUtils.getProcessFilename(processId);    
            RECT bounds = ActiveWinUtils.getBounds(processId);
            RECT desktop = ActiveWinUtils.getDesktop();

            System.Console.WriteLine(ActiveWinUtils.generateOutput(
                windowTitle, 
                activeWindowHandle.ToInt32(), 
                processId, 
                processFileName, 
                bounds, 
                desktop));
        }
    }
}