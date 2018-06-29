import { Injectable } from '@angular/core';
import { Observable, Observer, Subject } from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import * as io from 'socket.io-client';

@Injectable()
export class WebSocketService {
  private socket: any;

  constructor() {
    this.socket = io();
  }

  triggerConnection() {
    this.socket.emit('trigger-connection', 'start-countdown');
  }

  connect() {
    return Observable.create(observer => {
      this.socket.on('time-event', data => {
        console.info('web socket data', data);
        observer.next(data);
      });
    });
  }

  disconnect() {
    this.socket.disconnect();
    console.info('web socket disconnect');
  }

}
