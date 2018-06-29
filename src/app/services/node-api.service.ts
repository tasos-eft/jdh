/* NodeApiService is a generic CRUD data service, which interact with our NodeJS/ExpressJS middleware. */
import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/toPromise';

@Injectable()
export class NodeApiService {
  constructor(public http: Http) { }

  /* get("/<api>/<data>") */
  getData(url: string): Promise<void | any> {
    return this.http.get(url)
      .toPromise()
      .then(response => response.json() as any)
      .catch(this.handleError);
  }

  /* post("/<api>/<data>") */
  postData(url: string, body: any): Promise<any> {
    return this.http.post(url, body)
      .toPromise()
      .then(response => response.json() as any)
      .catch(this.handleError);
  }

  /* put("/<api>/<data>/:param") */
  putData(url: string, body: any, param: string): Promise<any> {
    const putUrl = url + '/' + param;
    return this.http.put(putUrl, body)
      .toPromise()
      .then(response => response.json() as any)
      .catch(this.handleError);
  }

  /* delete("/<api>/<data>/:param") */
  deleteData(url: string, param: string): Promise<any> {
    return this.http.delete(url + '/' + param)
      .toPromise()
      .then(response => response.json() as any)
      .catch(this.handleError);
  }

  private handleError(error: any): Promise<any> {
    const errMsg = (error.message) ? error.message :
      error.status ? `${error.status} - ${error.statusText}` : 'Server error';
    console.error(errMsg);
    return Promise.reject(errMsg);
  }
}
