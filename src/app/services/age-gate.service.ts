import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';

@Injectable()
export class AgeGateService {
  private BFonlineCountries: string;
  private BFonlineLDA: string;

  constructor(public http: Http) {
    this.initilizer();
  }

  private initilizer() {
    this.BFonlineLDA = 'https://api.b-fonline.com/api/validate_lda';
  }

  // post data to Brown Formasn Age Gate API
  validateLDA(ageGateData: LDA): Promise<any> {
    return this.http.post(this.BFonlineLDA, ageGateData)
      .toPromise()
      .then(response => response.json() as any)
      .catch(error => error.json() as any);
  }
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
