import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NodeApiService } from '../../services/node-api.service';
import { DataStoreService } from '../../services/data-store.service';
import { Drink } from '../../data-structure/drink';
import { forEach } from '@angular/router/src/utils/collection';
import { concat } from 'rxjs/operators/concat';
import { count } from 'rxjs/operators/count';

@Component({
  selector: 'app-drinks',
  templateUrl: './drinks.component.html',
  styleUrls: ['./drinks.component.scss']
})
export class DrinksComponent implements OnInit {
  drinks: Drink[];
  rows: any;
  perRow: number;
  duration: string;
  private phone: string;

  constructor(
    private router: Router,
    private nodeApiService: NodeApiService,
    private dataStoreService: DataStoreService
  ) { }

  ngOnInit() {
    this.drinksData();
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

  drinksData() {
    const url = '/available-drinks/drinks-data/';
    const data = { phone: this.retrievePhone() };
    /* populate default drinks fields view with data from the CMS */
    let index = 0;
    this.nodeApiService
      .postData(url, data)
      .then(drinks => {
        drinks.map(drink => {
          drink.index = index++;
          drink.image = '../../../assets/images/' + drink.glass + '.png';
          drink.button = 'enjoy now';
          return drink;
        });
        this.drinks = drinks;
        this.perRow = 2;
        this.rows = Array.from(
          Array(Math.ceil(this.drinks.length / this.perRow)).keys()
        );
      })
      .catch(error => {
        this.router.navigate(['/']);
      });
  }

  select(i) {
    let phone = '';
    phone = this.retrievePhone();
    this.dataStoreService.pushData({ phone: phone, index: i });
    if (this.testLocalStorage()) {
      localStorage.removeItem('index');
      localStorage.setItem('index', i);
    }
    this.router.navigate(['/pubs']);
  }



}
