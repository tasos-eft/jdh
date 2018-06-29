import { RouterModule } from '@angular/router';
import { AgeGateComponent } from './components/age-gate/age-gate.component';
import { BoardingComponent } from './components/boarding/boarding.component';
import { IdentificationComponent } from './components/identification/identification.component';
import { PinComponent } from './components/pin/pin.component';
import { DrinksComponent } from './components/drinks/drinks.component';
import { PubsComponent } from './components/pubs/pubs.component';
import { RedemptionComponent } from './components/redemption/redemption.component';
import { NotFoundComponent } from './components/not-found/not-found.component';
import { EndComponent } from './components/end/end.component';

const routes = [
  { path: '', component: EndComponent },
  // { path: 'age-gate', component: AgeGateComponent, data: { state: 'age-gate' } },
  // { path: 'boarding', component: BoardingComponent, data: { state: 'boarding' } },
  // { path: 'identification', component: IdentificationComponent, data: { state: 'identification' } },
  // { path: 'pin', component: PinComponent, data: { state: 'pin' } },
  // { path: 'drinks', component: DrinksComponent, data: { state: 'drinks' } },
  // { path: 'pubs', component: PubsComponent, data: { state: 'pubs' } },
  // { path: 'redemption/:id', component: RedemptionComponent, data: { state: 'redemption' } },
  { path: '**', component: NotFoundComponent }
];

export const AppRouting = RouterModule.forRoot(routes);
