import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { DataService } from "../services/app.service";
import { Router } from '@angular/router';
import { Observable } from "rxjs";

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})

export class HeaderComponent implements OnInit {
  @Output()
  loggedOut: EventEmitter<void> = new EventEmitter();
  @Input()
  _isLoggedIn: boolean = false;
  constructor(private _dataservice: DataService) { }

  ngOnInit() {
    this._isLoggedIn = this._dataservice.isLoggedIn()
  }

  _logoutClick() {
    this._dataservice.logoutUser();
    this._isLoggedIn = false;
    this.loggedOut.emit();
  }

}