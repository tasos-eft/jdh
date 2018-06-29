import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AgeGateService } from '../../services/age-gate.service';
import { slideUp } from '../../animations/slide-up';
import { DataStoreService } from '../../services/data-store.service';

@Component({
  selector: 'app-age-gate',
  animations: [slideUp],
  templateUrl: './age-gate.component.html',
  styleUrls: ['./age-gate.component.scss']
})
export class AgeGateComponent implements OnInit {
  keyboardRows: Keyboard[];
  age: string;
  day: string;
  month: string;
  year: string;
  btnEnabled: boolean;
  countries: Country[];
  ageGateData: LDA;
  underAge: boolean;
  message: string;
  ageGateBan: boolean;
  ageGateBanDate: Date;

  constructor(
    private ageGateService: AgeGateService,
    private router: Router,
    private dataStoreService: DataStoreService
  ) { }

  ngOnInit() {
    this.clearStorage();
    this.checkUser();
    this.day = 'DD';
    this.month = 'MM';
    this.year = 'YYYY';
    this.age = '';
    this.keyboardRows = [{
      rid: 1,
      set: [1, 2, 3]
    }, {
      rid: 2,
      set: [4, 5, 6]
    }, {
      rid: 3,
      set: [7, 8, 9]
    }, {
      rid: 4,
      set: [10, 0, 11]
    }];
    this.btnEnabled = false;
    this.underAge = false;
  }

  private clearStorage() {
    this.dataStoreService.pushData({});
    if (this.testLocalStorage()) {
      localStorage.clear();
    }
  }

  ageGateKeyBoard(key) {
    // delete last input
    if (key === 10) {
      this.delete();
    }
    if (key === 11) {
      this.enter();
    }
    // numerical inputs
    if ((key !== 10) && (key !== 11)) {
      this.age += key;
      this.validate();
    }
  }

  private delete() {
    this.age = this.age.substring(0, this.age.length - 1);

    switch (true) {
      case (this.age.length < 1):
        this.day = 'DD';
        this.month = 'MM';
        this.year = 'YYYY';
        break;
      case (this.age.length <= 2):
        this.day = this.age.substring(0, this.age.length);
        this.month = 'MM';
        this.year = 'YYYY';
        break;
      case (this.age.length > 2 && this.age.length <= 4):
        this.month = this.age.substring(2, this.age.length);
        this.year = 'YYYY';
        break;
      case (this.age.length > 4 && this.age.length < 8):
        this.year = this.age.substring(4, this.age.length);
        break;
      default:
        this.day = 'DD';
        this.month = 'MM';
        this.year = 'YYYY';
        this.age = '';
        break;
    }

    this.btnEnabled = false;
  }

  private validate() {
    // validation
    const regexD = new RegExp('(0[1-9]|[12][0-9]|3[01])');
    const regexM = new RegExp('^(0?[1-9]|1[012])$');
    // const regexY = new RegExp('^\d{4}$');
    let substring = '';
    let validation = false;

    switch (true) {
      case (this.age.length === 1):
        if (parseInt(this.age, 10) <= 3) {
          this.day = this.age;
        } else {
          this.age = '';
        }
        break;
      case (this.age.length === 2):
        substring = this.age.substring(0, 2);
        validation = regexD.test(substring);
        if (validation === true) {
          this.day = substring;
        } else {
          this.age = this.age.substring(0, 1);
        }
        break;
      case (this.age.length === 3):
        substring = this.age.substring(2, 3);
        if (parseInt(substring, 10) <= 1) {
          this.month = substring;
        } else {
          this.age = this.age.substring(0, 2);
        }
        break;
      case (this.age.length === 4):
        substring = this.age.substring(2, 4);
        if (regexM.test(substring)) {
          this.month = substring;
        } else {
          this.age = this.age.substring(0, 3);
        }
        break;
      case (this.age.length === 5):
        substring = this.age.substring(4, 5);
        if (parseInt(substring, 10) <= 2) {
          this.year = this.age.substring(4, 5);
        } else {
          this.age = this.age.substring(0, 4);
        }
        break;
      case (this.age.length > 5 && this.age.length < 8):
        this.year = this.age.substring(4, this.age.length);
        break;
      case (this.age.length === 8):
        this.year = this.age.substring(4, 8);
        this.btnEnabled = true;
        break;
      case (this.age.length > 8):
        this.year = this.age.substring(4, 8);
        break;
      default:
        this.age = '';
        break;
    }
  }

  private enter() {
    this.ageGateData = {
      birth_date: this.year + '-' + this.month + '-' + this.day,
      country: 'IE',
      category: 'spirits'
    };
    this.ageGateService
      .validateLDA(this.ageGateData)
      .then(response => {
        if (response === true) {
          this.router.navigate(['/boarding']);
        } else if (response === false) {
          this.underAge = true;
          this.banUnderAgeUser();
          setTimeout(() => {
            this.underAge = false;
            window.location.href = 'http://www.drinkaware.ie/';
          }, 3000);
        } else {
          if (response.birth_date.length > 0) {
            this.message = response.birth_date[0];
            setTimeout(() => {
              this.message = null;
              this.day = 'DD';
              this.month = 'MM';
              this.year = 'YYYY';
              this.age = '';
            }, 4000);
          }
        }
      });
  }
  /*
   * if use is under age, is banned for two hours
   * this information is stored on browser's localstorage
   * if localstorage isn't available, age-gate appears
   */
  private banUnderAgeUser() {
    const lsLSEnabled = this.testLocalStorage();
    if (lsLSEnabled) {
      const time = new Date();
      localStorage.setItem('banned-under-age-user', 'true');
      localStorage.setItem('ban-time-stamp', time.toString());
    } else {
      return;
    }
  }
  /*
   * if local storage is enabled, and related local storage keys are set,
   * check if user has been undeaged and banned.
   */
  private checkUser() {
    let ban = false;
    const lsLSEnabled = this.testLocalStorage();
    if (lsLSEnabled) {
      const banned = localStorage.getItem('banned-under-age-user');
      const time = localStorage.getItem('ban-time-stamp');
      if (banned) {
        const d1 = new Date();
        const d2 = new Date(time);
        const diff = Math.abs(d1.getTime() - d2.getTime()) / 36e5;
        if (diff >= 2) {
          ban = true;
        } else {
          localStorage.removeItem('banned-under-age-user');
          localStorage.removeItem('ban-time-stamp');
        }
      }
    }
    return ban;
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

interface Keyboard {
  rid: number;
  set: number[];
}

interface Country {
  name: string;
  iso2_code: string;
  iso3_code: string;
  spirits_lda: string;
  wine_lda: string;
}

interface LDA {
  birth_date: string;
  country: string;
  category: string;
}
