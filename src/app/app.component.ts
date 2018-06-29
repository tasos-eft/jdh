import { Component, OnInit } from '@angular/core';
import { slideTransition } from './animations/slide-left';
import { BsModalService } from 'ngx-bootstrap/modal';
import { BsModalRef } from 'ngx-bootstrap/modal/bs-modal-ref.service';
import { Router, NavigationEnd, RoutesRecognized } from "@angular/router";
import 'rxjs/add/operator/pairwise';
import 'rxjs/add/operator/filter';
import { first } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  animations: [slideTransition],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  logo: string;
  ban: boolean;
  modalRef: BsModalRef;

  constructor(
    private modalService: BsModalService,
    private router: Router
  ) { }

  ngOnInit() {
    this.logo = '../assets/images/logo.png';
    this.ban = this.checkUser();
    /* router events, check redirection & GTM page view event 
     * https://stackoverflow.com/questions/33520043/how-to-detect-a-route-change-in-angular 
     * https://github.com/angular/angular/issues/11268 
     * https://codeburst.io/using-google-analytics-with-angular-25c93bffaa18
     * https://www.lunametrics.com/blog/2018/03/30/single-page-applications-google-analytics/
     */
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {        
        (<any>window).dataLayer.push({ event: 'pageview', 'url': event.urlAfterRedirects });             
      }
    });
  }

  getState(outlet) {
    return outlet.activatedRouteData.state;
  }
  /*
   * if local storage is enabled, and related local storage keys are set,
   * check if user has been under-aged and banned.
   */
  private checkUser() {
    let ban = false;
    const isLSEnabled = this.testLocalStorage();
    if (isLSEnabled) {
      const banned = localStorage.getItem('banned-under-age-user');
      const time = localStorage.getItem('ban-time-stamp');
      if (banned) {
        const d1 = new Date();
        const d2 = new Date(time);
        const diff = Math.abs(d1.getTime() - d2.getTime()) / 36e5;
        if (diff <= 2) {
          ban = true;
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
