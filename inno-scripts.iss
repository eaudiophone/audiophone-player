; Audiophone player setup, only windows
[Setup]
AppName=Audiophone Player
DefaultDirName={autopf}\audiophone-player
AppVersion=0.2
AppPublisher=gabmart1995
DisableDirPage=no
DisableWelcomePage=no

[Languages]
Name: "es"; MessagesFile: "compiler:Languages\Spanish.isl";
Name: "en"; MessagesFile: "compiler:Default.isl";

[Files]
Source: ".\out\audiophone-player-win32-x64\*"; DestDir: "{app}"; Flags: "recursesubdirs"