Dim excelObject
Set excelObject = CreateObject("Excel.Application")

If excelObject Is Nothing Then
	MsgBox "Excel installation not detected.", 0, "Krona Excel template"
	WScript.Quit
End If

Dim fso
Set fso = CreateObject("Scripting.FileSystemObject")

If Not fso.FileExists("Krona.xltm") Then
	MsgBox "The archive must be unzipped before installing.", 0, "Krona Excel template"
	WScript.Quit
End If

fso.CopyFile "Krona.xltm", excelObject.TemplatesPath, True

MsgBox "Installation complete", 0, "Krona Excel template"
