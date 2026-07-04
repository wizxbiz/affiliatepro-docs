@echo off
echo Starting copy... > copy_log.txt
xcopy "d:\Flutterapp\caculateapp\build\web\*" "d:\Flutterapp\caculateapp\public\tuktuk\" /E /Y >> copy_log.txt 2>&1
echo Finished copy. >> copy_log.txt
