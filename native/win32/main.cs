using System;
using System.Runtime.InteropServices;
using System.IO;


namespace ActiveWin
{
  public class Entrypoint 
  {        
    static string generateOutput(
      string windowTitle, 
      int windowId, 
      int processId, 
      string processFileName, 
      RECT bounds, 
      int screenIndex,
      ScreenInfo screen
    ) { 
       return  String.Format(@"{{
    ""title"": ""{0}"",
    ""id"": {1},
    ""owner"": {{
        ""name"": ""{2}"",
        ""processId"": {3},
        ""path"": ""{4}""
    }},
    ""screen"": {{
        ""x"": {9},
        ""y"": {10},
        ""width"": {11},
        ""height"": {12},
        ""index"": {13}
    }},
    ""bounds"": {{
        ""x"": {5},
        ""y"": {6},
        ""width"": {7},
        ""height"": {8}
    }}
}}", 
        windowTitle, 
        windowId, // Window Id
        Path.GetFileName(processFileName), 
        processId,
        processFileName,
        screen.WorkArea.Left, screen.WorkArea.Top, 
        screen.WorkArea.Right-screen.WorkArea.Left, screen.WorkArea.Bottom-screen.WorkArea.Top,
        bounds.Left, bounds.Top, 
        bounds.Right-bounds.Left, bounds.Bottom-bounds.Top);
    }

    static void Main(string[] args)
    {   
      // Get a "handle" of the active window
      IntPtr activeWindowHandle = WinApi.GetForegroundWindow();
      int processId = 0;
      WinApi.GetWindowThreadProcessId(activeWindowHandle, ref processId);

      string windowTitle = Utils.getWindowTitle(activeWindowHandle);
      string processFileName = Utils.getProcessFilename(processId);    
      RECT bounds = Utils.getBounds(processId);
      Tuple<int, ScreenInfo> screen = Utils.getScreen(bounds);

      System.Console.WriteLine(Entrypoint.generateOutput(
        windowTitle, 
        activeWindowHandle.ToInt32(), 
        processId, 
        processFileName, 
        bounds, 
        screen.Item1,
        screen.Item2
      ));
    }
  }
}