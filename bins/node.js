var child_process = require('child_process');

function execHandler() {
    let params = process.argv.slice(2);

    if (params.length === 0) {
        throw new Error('No command provided');
    }

    let execFilePath = params[0];
    let execCommand = `flutter pub run build_runner build --build-filter '${execFilePath}'`;
    let result = child_process.exec(execCommand);

    result.stdout.on('data', (data) => {
        console.log(data);
    });
}

execHandler();