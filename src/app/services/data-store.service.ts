import { Injectable } from '@angular/core';

@Injectable()
export class DataStoreService {

  constructor() { }

  private serviceData: any;

  pushData(data: any) {
    this.serviceData = data;
  }

  pullData() {
    return this.serviceData;
  }

}
