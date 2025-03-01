$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-File G:\WORK\ELEC\geolog\gpx-files-uploader\upload.ps1"
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 1) -RepetitionDuration (New-TimeSpan -Days 9999)
Register-ScheduledTask -TaskName "GPX自动上传" -Action $action -Trigger $trigger -User "SYSTEM"