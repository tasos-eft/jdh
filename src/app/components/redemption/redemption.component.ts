import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { DatePipe, Location } from '@angular/common';
import { BsModalService } from 'ngx-bootstrap/modal';
import { BsModalRef } from 'ngx-bootstrap/modal/bs-modal-ref.service';
import { NodeApiService } from '../../services/node-api.service';
import { DataStoreService } from '../../services/data-store.service';
import { slideUp } from '../../animations/slide-up';
import { CommentStmt } from '@angular/compiler';
import { timer } from 'rxjs/observable/timer';
import { take, map } from 'rxjs/operators';
import { Observable } from 'rxjs/Rx';

@Component({
  selector: 'app-redemption',
  animations: [slideUp],
  templateUrl: './redemption.component.html',
  styleUrls: ['./redemption.component.scss']
})

export class RedemptionComponent implements OnInit, OnDestroy {

  pub: any;
  title: string;
  minutes: string;
  seconds: string;
  message: string;
  private id: number;
  private phone: string;
  private drinkIndex: string;
  private subscribe: any;
  private loggedIn: string;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private modalService: BsModalService,
    private nodeApiService: NodeApiService,
    private dataStoreService: DataStoreService,
    private location: Location
  ) { }

  ngOnInit() {
    this.title = '';
    this.minutes = '5';
    this.seconds = '00';
    this.route.params.forEach(params => {
      this.id = params['id'];
      this.getPub(this.id);
    });
    this.location.subscribe(event => {
      console.log(event);
      if (event.pop === true) {
        this.message = 'sorry, this action is not allowed';
        setTimeout(() => {
          this.message = null;
          this.router.navigate(['/']);
        }, 3000);
      }
    });
    /* checks if user phone is stored, thus user is logged in */
    this.loggedIn = this.retrievePhone();
    if (!this.loggedIn) {
      this.message = 'user is not logged in';
        setTimeout(() => {
          this.message = null;
          this.router.navigate(['/']);
        }, 3000);
    }
  }


  transform(content) {
    return content.replace('&amp;', '\&').replace('&ndash;', '\-').replace('&#8217;', '\'');
  }

  getPub(id) {
    const data = {
      id: id
    };
    const url = '/redemption/redemption-data/';
    this.nodeApiService
      .postData(url, data)
      .then(pub => {
        this.title = this.transform(pub.pub_title);
        /* check for legit redemption */
        this.countDown();
      })
      .catch(error => {
        this.message = 'sorry, something went wrong';
        setTimeout(() => {
          this.message = null;
          this.router.navigate(['/']);
        }, 3000);
      });
  }

  countDown() {
    // emit tick every 1s
    const ticker = Observable.interval(1000);
    // after 5 minutes, emit timer
    const timer = Observable.timer(5 * 60 * 1000);
    // when timer emits after 5 minutes, complete ticker
    const counter = ticker.takeUntil(timer);
    // countdown
    this.subscribe = counter.subscribe(sec => {
      // calculate minutes and seconds left on the clock
      const left = 300 - sec;
      const minutes = Math.floor(left / 60);
      const seconds = left % 60;
      if (seconds < 10) {
        this.minutes = minutes.toString();
        this.seconds = '0' + seconds.toString();
      } else {
        this.minutes = minutes.toString();
        this.seconds = seconds.toString();
      }
    });
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

  private clearStorage() {
    this.dataStoreService.pushData({});
    if (this.testLocalStorage()) {
      localStorage.removeItem('phone');
      localStorage.removeItem('pubs');
      localStorage.removeItem('index');
    }
  }

  /* checks */
  private retrievePhone() {
    let phone = null;
    if (this.testLocalStorage()) {
      phone = localStorage.getItem('phone');
    } else {
      phone = this.dataStoreService.pullData().phone;
    }
    return phone;
  }

  serve() {
    this.minutes = '0';
    this.seconds = '00';
    this.clearStorage();
    /* detect if subscription was initialized*/
    if (this.subscribe) {
      this.subscribe.unsubscribe();
    }
    this.message = 'thanks for using tennessee honey';
    setTimeout(() => {
      this.message = null;
      this.router.navigate(['/']);
    }, 3000);
  }

  ngOnDestroy() {
    this.minutes = '0';
    this.seconds = '00';
    this.clearStorage();
    /* detect if subscription was initialized*/
    if (this.subscribe) {
      this.subscribe.unsubscribe();
    }
  }
}

