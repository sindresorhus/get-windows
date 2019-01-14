using System;
using System.IO;
using System.Collections.Generic;

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
      Tuple<int, string> procInfo = Utils.getActiveProcessInfo();
      int processId =  procInfo.Item1;
      string processFileName =  procInfo.Item2;

      Tuple<int, string> windowInfo = Utils.getActiveWindowInfo();
      int windowId =  windowInfo.Item1;
      string windowTitle =  windowInfo.Item2;

      RECT bounds = Utils.getBounds(processId);

      Tuple<int, ScreenInfo> scr = Utils.getScreen(bounds);
      int screenIndex = scr.Item1;
      ScreenInfo screenInfo = scr.Item2;

      System.Console.WriteLine(Entrypoint.generateOutput(
        windowTitle, 
        windowId, 
        processId, 
        processFileName, 
        bounds, 
        screenIndex,
        screenInfo
      ));
    }
  }
}