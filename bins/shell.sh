#! /bin/bash
filePath="$1"

if [ -z "$filePath" ]; then
    echo "filePath params is empty"
    exit 1;
fi;

echo "$filePath"

flutter pub run build_runner build --build-filter "$filePath" | while read line; do
    echo $line
done

FlutterBuildIsSuccess=$?

if [ $FlutterBuildIsSuccess -eq 0 ]; then
    echo "=================build_runner sucess================="
else
    echo "增加--delete-conflicting-outputs参数，删除冲突代码再生成"
    flutter pub run build_runner build --delete-conflicting-outputs | while read line; do
        echo $line
    done
fi
