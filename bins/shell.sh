#! /bin/bash
filePath="$1"

if [ -z "$filePath" ]; then
    echo "filePath params is empty"
    exit 1;
fi;

flutter pub run build_runner build --build-filter "$filePath"

FlutterBuildResult=$?

if [ $FlutterBuildResult -eq 0 ]; then
    echo "=================build_runner sucess================="
elif [ $FlutterBuildResult -eq 78 ]; then
    echo "增加--delete-conflicting-outputs参数，删除冲突代码再生成"
    flutter pub run build_runner build --delete-conflicting-outputs
elif [ $FlutterBuildResult -eq 65 ]; then
    echo "执行flutter pub get"
    flutter pub get
    echo "build_runner build"
    flutter pub run build_runner build --delete-conflicting-outputs
else
    echo "===========$FlutterBuildResult"
fi
