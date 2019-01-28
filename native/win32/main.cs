using System;
using System.IO;
using System.Text;
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
      List<ScreenInfo> screens
    ) { 


      string screenData = 
        String.Join(",\n",
          screens.ConvertAll(screen => 
            String.Format(@"
        {{
          ""x"": {0},
          ""y"": {1},
          ""width"": {2},
          ""height"": {3},
          ""index"": {4}
        }}", 
          screen.WorkArea.Left, screen.WorkArea.Top, 
          screen.WorkArea.Right - screen.WorkArea.Left, screen.WorkArea.Bottom - screen.WorkArea.Top,
          screen.Index
          )));        

       return  String.Format(@"{{
    ""title"": ""{0}"",
    ""id"": {1},
    ""owner"": {{
        ""name"": ""{2}"",
        ""processId"": {3},
        ""path"": ""{4}""
    }},
    ""screens"": [ {5} ],
    ""bounds"": {{
        ""x"": {6},
        ""y"": {7},
        ""width"": {8},
        ""height"": {9}
    }}
}}", 
        windowTitle, 
        windowId, // Window Id
        Path.GetFileName(processFileName), 
        processId,
        processFileName,
        screenData,
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

      List<ScreenInfo> screens = Utils.getScreens(bounds);

      System.Console.WriteLine(Entrypoint.generateOutput(
        windowTitle, 
        windowId, 
        processId, 
        processFileName, 
        bounds, 
        screens
      ));
    }
  }
}