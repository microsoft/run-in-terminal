/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';

import { ChildProcess, spawn, exec } from 'child_process';
import { join } from 'path';
import { format } from 'util';

export interface Options {
    cwd?: string;
    stdio?: any;
    custom?: any;
    env?: any;
    detached?: boolean;
}

class DefaultOptions implements Options {
    cwd: string = process.cwd();
}

export
interface TerminalChildProcess extends ChildProcess {
    kill2(): Promise<number>;
}

export
function runInTerminal(
    command: string,
    args?: string[],
    options: Options = new DefaultOptions()
): Promise<TerminalChildProcess> {
    return _terminalSpawn(command, args || [], options)
        .then(value => {
            const result = <TerminalChildProcess> value;
            result.kill2 = () => _terminate(value);
            return result;
        });
}

const _terminalSpawn = /^win/.test(process.platform)
    ? runInTerminalWin
    : process.platform === 'darwin'
        ? runInTerminalMac
        : runInTerminalLinux;


const _terminate = /^win/.test(process.platform)
    ? terminateWin
    : terminateMacLinux;


function promiseSpawn(
    command: string,
    args: string[],
    options: any
): Promise<ChildProcess> {
    return new Promise((resolve, reject) => {
        const childProcess = spawn(command, args, options);
        childProcess.on('error', reject);

        // give process a change to emit an error
        setTimeout(_ => resolve(childProcess), 0);
    });
}

function runInTerminalWin(
    file: string,
    args: string[],
    options: Options
): Promise<ChildProcess> {
    // we use `start` to get another cmd.exe where `& pause` can be handled
    args = [
        '/c',
        'start',
        '/wait',
        'cmd.exe',
        '/c',
        `"${file} ${args.map(escapeWinArg).join(' ')} & pause"`
    ];

    options = options || <any>{};
    (<any>options).windowsVerbatimArguments = true;

    return promiseSpawn('cmd.exe', args, options);
}

function runInTerminalMac(
    file: string,
    args: string[],
    options: Options
): Promise<ChildProcess> {

    args = [
        join(__dirname, 'launcher.scpt'),
        'cd', format("'%s'", options.cwd), ';',
        file
    ].concat(args);

    return promiseSpawn('/usr/bin/osascript', args, options);
}

function runInTerminalLinux(
    file: string,
    args: string[],
    options: Options
): Promise<ChildProcess> {

    // '/usr/bin/x-terminal-emulator'
    const LINUX_TERM = '/usr/bin/gnome-terminal';

    let flattenedArgs = '';
    if (args.length > 0) {
        flattenedArgs = '"' + args.join('" "') + '"';
    }

    let cdCommand = '';
    if (options.cwd) {
        cdCommand = format('cd "%s"', options.cwd);
    }

    let bashCommand = format('%s; "%s" %s ; echo; read -p "%s" -n1;',
        cdCommand,
        file,
        flattenedArgs,
        "Press any key to continue..."
    );

    args = [
        '-x',
        'bash',
        '-c',
        // wrapping argument in two sets of ' because node is so "friendly"
        // that it removes one set...
        format('\'\'%s\'\'', bashCommand)
    ];

    return promiseSpawn(LINUX_TERM, args, options);
}

function terminateWin(process: ChildProcess): Promise<number> {
    if (process) {
        return new Promise((resolve, reject) => {
            process.once('exit', (code, _signal) => {
                resolve(code);
            });
            exec(
                `taskkill /F /T /PID ${process.pid}`,
                function(err, _stdout, _stderr) {
                    if (err) {
                        reject(err);
                    }
                }
            );
        });
    }
}

function terminateMacLinux(process: ChildProcess): Promise<number> {
    if (process) {
        return new Promise((resolve, reject) => {
            process.once('exit', (code, _signal) => {
                resolve(code);
            });
            process.once('error', err => {
                reject(err);
            });
            process.kill('SIGTERM');
        });
    }
}

function escapeWinArg(arg: string) {
    if (/"[^"]+"/.test(arg) && arg.includes(" ")) {
        return `"${arg}"`;
    }

    return arg;
}