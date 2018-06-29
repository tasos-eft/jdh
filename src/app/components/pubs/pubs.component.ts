import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';
import { SecurityContext } from '@angular/core';
import { BsModalService } from 'ngx-bootstrap/modal';
import { BsModalRef } from 'ngx-bootstrap/modal/bs-modal-ref.service';
import { NodeApiService } from '../../services/node-api.service';
import { DataStoreService } from '../../services/data-store.service';
import { slideUp } from '../../animations/slide-up';

@Component({
  selector: 'app-pubs',
  animations: [slideUp],
  templateUrl: './pubs.component.html',
  styleUrls: ['./pubs.component.scss']
})
export class PubsComponent implements OnInit {
  private phone: string;
  private drinks: any;
  pubs: any;
  modalRef: BsModalRef;
  message: string;
  drinkIndex: string;

  constructor(
    private router: Router,
    private sanitizer: DomSanitizer,
    private modalService: BsModalService,
    private nodeApiService: NodeApiService,
    private dataStoreService: DataStoreService
  ) { }


  ngOnInit() {
    this.retrieveStoredData();
    this.getPubs();
  }

  private retrieveStoredData() {
    let phone = null;
    let index = null;
    if (this.testLocalStorage()) {
      phone = localStorage.getItem('phone');
      index = localStorage.getItem('index');
    } else {
      phone = this.dataStoreService.pullData().phone;
      index = this.dataStoreService.pullData().index;
    }
    this.phone = phone;
    this.drinkIndex = index;
  }

  transform(content) {
    return content.replace('&amp;', '\&').replace('&ndash;', '\-').replace('&#8217;', '\'');
  }

  getPubs() {
    if (this.testLocalStorage() && localStorage.getItem('pubs')) {
      const storedPubs = JSON.parse(localStorage.getItem('pubs'));
      this.setPubs(storedPubs);
    } else {
      this.apiCall();
    }
  }

  private apiCall() {
    const url = '/available-pubs/wp-api-pubs/';
    // call
    this.nodeApiService
      .getData(url)
      .then(pubs => {
        this.setPubs(pubs);
      })
      .catch(error => {
        this.message = 'sorry, something went wrong';
        setTimeout(() => {
          this.message = null;
          this.router.navigate(['/']);
        }, 3000);
      });
  }

  /* setter for pubs table outlet */
  private setPubs(pubs) {
    this.pubs = pubs;
    this.pubs.map(pub => {
      pub.title.rendered = this.transform(pub.title.rendered);
      return pub;
    });
  }

  /* select pub to order drink via modal window */
  selectPub(content: any, pub: any) {
    this.modalRef = this.modalService.show(content, { class: 'pub-selection' });
    /* pass pub object to modalRef as content */
    this.modalRef.content = pub;
  }

  /* order drink on modal window & redirect to next screen */
  orderDrink(pubID) {
    const url = '/available-pubs/order-drink/';
    const data = { id: pubID, phone: this.phone, index: this.drinkIndex };

    /* name of the pub for GA */
    const redemptionPub = this.pubs.find(element => {
      return element.id === pubID;
    });

    /* hide modal */
    this.modalRef.hide();

    /* call service */
    this.nodeApiService
      .postData(url, data)
      .then(pub => {
        if (Object.keys(pub).length > 0) {
          /* navigate user to next page */
          this.router.navigate(['/redemption', pubID]);
        }
      }).catch(error => {
        this.message = 'sorry, something went wrong';
        setTimeout(() => {
          this.message = null;
          this.router.navigate(['/']);
        }, 3000);
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
}
