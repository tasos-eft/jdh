import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NodeApiService } from '../../services/node-api.service';

@Component({
  selector: 'app-boarding',
  templateUrl: './boarding.component.html',
  styleUrls: ['./boarding.component.scss']
})
export class BoardingComponent implements OnInit {
  constructor(
    private router: Router,
    private nodeApiService: NodeApiService
  ) { }

  ngOnInit() {
    this.getPubs();
  }

  forward() {
    this.router.navigate(['/identification']);
  }
  /*
   * get pubs from wp api and cache them to local-storage
   */
  private getPubs() {
    const url = '/available-pubs/wp-api-pubs/';
    this.nodeApiService
      .getData(url)
      .then(pubs => {
        if (this.testLocalStorage()) {
          localStorage.removeItem('pubs');
          localStorage.setItem('pubs', JSON.stringify(pubs));
          this.router.navigate(['/identification']);
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
}
