import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { RouterModule, Routes } from '@angular/router';
import { AlertModule } from 'ngx-bootstrap/alert';
import { ModalModule } from 'ngx-bootstrap/modal';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppComponent } from './app.component';
import { AppRouting } from './app.routing';
import { AgeGateComponent } from './components/age-gate/age-gate.component';
import { BoardingComponent } from './components/boarding/boarding.component';
import { IdentificationComponent } from './components/identification/identification.component';
import { PinComponent } from './components/pin/pin.component';
import { DrinksComponent } from './components/drinks/drinks.component';
import { PubsComponent } from './components/pubs/pubs.component';
import { RedemptionComponent } from './components/redemption/redemption.component';
import { NotFoundComponent } from './components/not-found/not-found.component';
import { EndComponent } from './components/end/end.component';

import { AgeGateService } from './services/age-gate.service';
import { NodeApiService } from './services/node-api.service';
import { WebSocketService } from './services/web-socket.service';
import { DataStoreService } from './services/data-store.service';

@NgModule({
  declarations: [
    AppComponent,
    AgeGateComponent,
    BoardingComponent,
    IdentificationComponent,
    PinComponent,
    DrinksComponent,
    PubsComponent,
    RedemptionComponent,
    NotFoundComponent,
    EndComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    AppRouting,
    BrowserAnimationsModule,
    AlertModule.forRoot(),
    ModalModule.forRoot()
  ],
  providers: [AgeGateService, NodeApiService, WebSocketService, DataStoreService],
  bootstrap: [AppComponent]
})
export class AppModule { }

