# Create New Files

Allows creating files and folders through a popup, inspired by the OG [AddNewFile](https://marketplace.visualstudio.com/items?itemName=MadsKristensen.AddNewFile) extension for Visual Studio.

The default hotkey is _Shift-F2_.

The preferred separator used in the UI is configurable via the extension settings.

There are already many alternatives, each falling short of my expectations:

1. The popup must be a single step dialog (the target folder and file must be accepted in the same dialog)
1. Should use the folder of the active document by default and allow addressing from the workspace root (`~/...`)
1. Support Unix style path expansions
1. Auto-completions
