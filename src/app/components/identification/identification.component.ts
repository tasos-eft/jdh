import { Component, OnInit, transition } from '@angular/core';
import { Router } from '@angular/router';
import { NodeApiService } from '../../services/node-api.service';
import { DataStoreService } from '../../services/data-store.service';

@Component({
  selector: 'app-identification',
  templateUrl: './identification.component.html',
  styleUrls: ['./identification.component.scss']
})
export class IdentificationComponent implements OnInit {
  phoneNumber: string;
  errorMessage: string;
  showInfo: boolean;
  showBtn: boolean;
  showLoader: boolean;

  constructor(
    private nodeApiService: NodeApiService,
    private dataStoreService: DataStoreService,
    private router: Router,
  ) { }

  ngOnInit() {
    this.phoneNumber = null;
  }

  validatePhone(phone) {
    const irishMobile = new RegExp('^08[3-9][0-9]{7}$');
    this.showBtn = irishMobile.test(phone);
    if (irishMobile.test(phone)) {
      this.phoneNumber = phone;
      this.showInfo = false;
    } else {
      this.showInfo = true;
    }
    if (phone.length === 10) {
      this.showInfo = !irishMobile.test(phone);
    }
  }

  sendPin(phone) {
    const json = { phone: phone };
    return this.nodeApiService
      .postData('/identify-customers/twilio/', json)
      .then(data => data);
  }

  postUser() {
    const url = '/identify-customers/wp-api-customers/';
    const body = { phone: this.phoneNumber };
    this.showBtn = false;
    this.showLoader = true;
    this.storePhone(this.phoneNumber);
    // call
    this.nodeApiService
      .postData(url, body)
      .then(user => {
        return this.sendPin(this.phoneNumber);
      })
      .then(data => {
        if (Object.keys(data).length > 0) {
          this.router.navigate(['/pin']);
        }
      })
      .catch(error => {
        this.errorMessage = error;
      });
  }

  private storePhone(phone) {
    this.dataStoreService.pushData({phone: phone});
    if (this.testLocalStorage()) {
      localStorage.removeItem('phone');
      localStorage.setItem('phone', phone);
    }
  }
  /*
   * local storage check
   */
  private testLocalStorage() {
    try {
      localStorage.setItem('mod', 'mod');
      localStorage.removeItem('mod');
      return true;
    } catch (e) {
      console.log('does not supports local storage');
      return false;
    }
  }
}
