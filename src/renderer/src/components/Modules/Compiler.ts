import Websocket from 'isomorphic-ws';
import { Dispatch, SetStateAction } from 'react';
import { base64StringToBlob } from 'blob-util';
import { Buffer } from 'buffer';
import { Elements } from '@renderer/types/diagram';
import {
  CompilerSettings,
  CompilerResult,
  Binary,
  SourceFile,
} from '@renderer/types/CompilerTypes';

export class Compiler {
  static port = 8081;
  static host = 'localhost';
  static base_address = `ws://${this.host}:${this.port}/`;
  static connection: Websocket | undefined;
  static connecting: boolean = false;
  static setCompilerData: Dispatch<SetStateAction<CompilerResult | undefined>>;
  // Статус подключения.
  static setCompilerStatus: Dispatch<SetStateAction<string>>;
  static setCompilerMode: Dispatch<SetStateAction<string>>;
  static setImportData: Dispatch<SetStateAction<string | undefined>>;
  static mode: string;

  static timerID: NodeJS.Timeout;
  //Если за данное время не пришел ответ от компилятора
  //мы считаем, что произошла ошибка.
  static timeOutTime = 100000;
  static timeoutSetted = false;
  static filename: string;

  static setDefaultStatus() {
    this.setCompilerStatus('Не подключен');
    this.setCompilerData(undefined);
  }

  static bindReact(
    setCompilerData: Dispatch<SetStateAction<CompilerResult | undefined>>,
    setCompilerStatus: Dispatch<SetStateAction<string>>,
    setImportData: Dispatch<SetStateAction<string | undefined>>
  ): void {
    this.setCompilerData = setCompilerData;
    this.setCompilerStatus = setCompilerStatus;
    this.setImportData = setImportData;
  }

  static binary: Array<Binary> | undefined = undefined;
  static source: Array<SourceFile> | undefined = undefined;

  static checkConnection(): boolean {
    return this.connection !== undefined;
  }

  static decodeBinaries(binaries: Array<any>) {
    binaries.map((binary) => {
      console.log(base64StringToBlob(binary.fileContent!));
      console.log(binary.filename, binary.extension);
      this.binary?.push({
        filename: binary.filename,
        extension: binary.extension,
        fileContent: base64StringToBlob(binary.fileContent!),
      } as Binary);
    });
  }

  static async prepareToSave(binaries: Array<Binary>): Promise<Array<Binary>> {
    const newArray = Object.assign([], binaries) as Binary[];
    for (const bin of newArray) {
      const blob = new Blob([bin.fileContent as Uint8Array]);
      bin.fileContent = Buffer.from(await blob.arrayBuffer());
    }

    return newArray;
  }

  static getSourceFiles(sources: Array<any>): Array<SourceFile> {
    const result = new Array<SourceFile>();
    sources.map((source) => {
      result.push({
        filename: source.filename,
        extension: source.extension,
        fileContent: source.fileContent,
      } as SourceFile);
    });

    return result;
  }

  static connect(host: string, port: number, timeout = 0) {
    this.host = host;
    this.port = port;
    this.base_address = `ws://${this.host}:${this.port}/main`;
    Compiler.connectRoute(this.base_address, timeout);
  }

  static connectRoute(route: string, timeout: number = 0): Websocket {
    if (this.checkConnection()) return this.connection!;
    if (this.connecting) return;
    this.setCompilerStatus('Идет подключение...');
    // FIXME: подключение к несуществующему узлу мгновенно кидает неотлавливаемую
    //   асинхронную ошибку, и никто с этим ничего не может сделать.
    const ws = new WebSocket(route);
    this.connecting = true;

    ws.onopen = () => {
      console.log('Compiler: connected');
      this.setCompilerStatus('Подключен');
      this.connection = ws;
      this.connecting = false;
      this.timeoutSetted = false;
      timeout = 0;
    };

    ws.onmessage = (msg) => {
      // console.log(msg);
      this.setCompilerStatus('Подключен');
      clearTimeout(this.timerID);
      let data;
      switch (this.mode) {
        case 'compile':
          data = JSON.parse(msg.data);
          console.log(msg.data);
          console.log(typeof data);
          if (data.binary.length > 0) {
            this.binary = [];
            this.decodeBinaries(data.binary);
          } else {
            this.binary = undefined;
          }
          this.setCompilerData({
            result: data.result,
            stdout: data.stdout,
            stderr: data.stderr,
            binary: this.binary,
            source: this.getSourceFiles(data.source),
          } as CompilerResult);
          break;
        case 'import':
          data = JSON.parse(msg.data);
          // TODO: Сразу распарсить как Elements.
          this.setImportData(JSON.stringify(data.source[0].fileContent));
          break;
        case 'export':
          data = msg.data;
          console.log(data);
          this.setCompilerData({
            result: 'OK',
            binary: [],
            source: [
              {
                filename: this.filename,
                extension: 'graphml',
                fileContent: data,
              },
            ],
          });
        default:
          break;
      }
    };

    ws.onclose = () => {
      if (this.connection) {
        console.log('Compiler: connection closed');
      }
      this.setCompilerStatus('Не подключен');
      this.connection = undefined;
      this.connecting = false;
      if (!this.timeoutSetted) {
        this.timeoutSetted = true;
        if (timeout < 16000) {
          timeout += 2000;
        }
        setTimeout(() => {
          // console.log(`Compiler: retry in ${timeout} ms`);
          this.connectRoute(route, timeout);
          this.timeoutSetted = false;
        }, timeout);
      }
    };

    return ws;
  }

  static compile(platform: string, data: Elements | string) {
    const route = `${this.base_address}main`;
    const ws: Websocket = this.connectRoute(route);
    let compilerSettings: CompilerSettings;
    console.log(platform);
    switch (platform) {
      case 'ArduinoUno':
        ws.send('arduino');
        this.mode = 'compile';
        compilerSettings = {
          compiler: 'arduino-cli',
          filename: 'biba',
          flags: ['-b', 'arduino:avr:uno'],
        };
        const obj = {
          ...(data as Elements),
          compilerSettings: compilerSettings,
        };
        ws.send(JSON.stringify(obj));
        break;
      case 'BearlogaDefendImport':
        ws.send('berlogaImport');
        ws.send(data);
        console.log('import!');
        this.mode = 'import';
        break;
      case 'BearlogaDefend':
        ws.send('berlogaExport');
        ws.send(JSON.stringify(data));
        console.log('export!');
        this.mode = 'export';
        break;
      default:
        console.log('unknown platform');
        return;
    }

    this.setCompilerStatus('Идет компиляция...');
    this.timerID = setTimeout(() => {
      Compiler.setCompilerStatus('Что-то пошло не так...');
    }, this.timeOutTime);
  }
}
