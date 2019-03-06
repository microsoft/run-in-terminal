# run-in-terminal

[![npm package](https://img.shields.io/npm/v/run-in-terminal.svg)](https://www.npmjs.com/package/run-in-terminal)
[![NPM downloads](https://img.shields.io/npm/dm/run-in-terminal.svg)](https://www.npmjs.com/package/run-in-terminal)

Runs a command in a terminal (cmd.exe, gnome-terminal, Terminal) window. 

## Installation

```sh
$ npm i run-in-terminal
```

## Usage

```js
const { runInTerminal } = require('run-in-terminal');

runInTerminal('npm run watch');

runInTerminal('npm run watch').then(() => {
  // the terminal closed 
});
```

## API

### runInTerminal(command[, args[, options]])

Returns a promise for the [spawned child process](https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options).

#### command

Type: `string`

The command to run in a terminal window.

#### args

Type: `Array`

List of string arguments.

#### options

Type: `Object`

See [`child_process.spawn()` options](https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options).

##### cwd

Type: `string`  
Default: `process.cwd()`

Current working directory of the child process.

## License

MIT