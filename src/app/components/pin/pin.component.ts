import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NodeApiService } from '../../services/node-api.service';
import { DataStoreService } from '../../services/data-store.service';

@Component({
  selector: 'app-pin',
  templateUrl: './pin.component.html',
  styleUrls: ['./pin.component.scss']
})
export class PinComponent implements OnInit {
  pin: string;
  private phone: string;
  showBtn: boolean;
  showError: boolean;
  message: string;

  constructor(
    private router: Router,
    private nodeApiService: NodeApiService,
    private dataStoreService: DataStoreService,
  ) { }

  ngOnInit() {
    this.pin = null;
    this.phone = this.retrievePhone();
    this.showError = false;
  }

  twilioPin(pin) {
    if (pin.length === 4) {
      this.pin = pin;
      this.showBtn = true;
    } else {
      this.showBtn = false;
    }
  }

  postPin() {
    const url = '/verify-pin/pin/';
    const body = { pin: this.pin, phone: this.phone };
    // call
    this.nodeApiService
      .postData(url, body)
      .then(verification => {
        if (verification.valid) {
          this.router.navigate(['/drinks']);
        } else {
          this.showError = true;
          this.message = 'wrong pin';
        }
      });
  }

  private retrievePhone() {
    let phone = null;
    if (this.testLocalStorage()) {
      phone = localStorage.getItem('phone');
    } else {
      phone = this.dataStoreService.pullData().phone;
    }
    return phone;
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
