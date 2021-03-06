import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';

import { Observable } from 'rxjs'
import 'rxjs/add/operator/toPromise';
import * as _MC from '../model/app.modelClasses';

@Injectable()
export class DataService {
    // private baseUrl = 'https://mealappserver.appspot.com';  // URL to web api
    private baseUrl = 'http://localhost:8080';  // URL to web api
    private _headers = new Headers({ 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': 'localhost:*' });
    private isUserLoggedInKey: string = "_iuli";
    private lastLoginDateKey: string = "lastLogin";

    constructor(private http: Http) { }
    //#region AUTHENTICATION
    getCurrentUser(): _MC.userLoginStatus {
        return JSON.parse(localStorage.getItem(this.isUserLoggedInKey) || sessionStorage.getItem(this.isUserLoggedInKey)) as _MC.userLoginStatus;
    }
    isVendor(): boolean {
        let currentUser: _MC.userLoginStatus = this.getCurrentUser();
        return currentUser != null && currentUser.userType == _MC.usertTypeEnum.VENDOR
    }
    isLoggedIn(): boolean {
        let today: Date = new Date();
        today.setDate(today.getDate() - 30);
        let lastLoginDate: Date = localStorage.getItem(this.lastLoginDateKey) && new Date(localStorage.getItem(this.lastLoginDateKey));

        //>> log out if 30 days passed since last login
        if (lastLoginDate && today > lastLoginDate) {
            this.logoutUser()
            return false
        }
        else if (localStorage.getItem(this.isUserLoggedInKey) || sessionStorage.getItem(this.isUserLoggedInKey)) {
            return true;
        }
        return false;
    }

    logoutUser() {
        sessionStorage.removeItem(this.isUserLoggedInKey)
        localStorage.removeItem(this.isUserLoggedInKey)
        localStorage.removeItem(this.lastLoginDateKey)
    }

    private createLoginSession(_userid: string, _usertype: _MC.usertTypeEnum, _remember: boolean) {
        let loginStatus: _MC.userLoginStatus = new _MC.userLoginStatus();
        loginStatus.userId = _userid
        loginStatus.userType = _usertype;
        // iuli => is user logged in
        if (_remember) {
            localStorage.setItem(this.isUserLoggedInKey, JSON.stringify(loginStatus))
            localStorage.setItem(this.lastLoginDateKey, (new Date()).toUTCString())
        }
        else {
            sessionStorage.setItem(this.isUserLoggedInKey, JSON.stringify(loginStatus))
        }
    }

    loginUser(_logindata: _MC.loginData): Promise<_MC.loginResponse> {
        return this.http.post(`${this.baseUrl}/loginUser`, _logindata, { headers: this._headers }).toPromise()
            .then(x => {
                let res = x.json() as _MC.loginResponse;
                if (!res.userType)
                    res.userType = _MC.usertTypeEnum.DEFAULT
                if (res.isUsernameValid && res.isPasswordValid)
                    this.createLoginSession(res.userId, res.userType, _logindata.rememberMe);
                return res;
            })
            .catch(this.handleError);
    }

    registerUser(userdata: _MC.registrationData): Promise<_MC.registrationResponse> {
        const url = `${this.baseUrl}/registerUser`;
        return this.http.post(url, userdata, { headers: this._headers }).toPromise()
            .then(x => {
                if (x != null) {
                    let res = x.json() as _MC.registrationResponse;
                    if (res.isRegistered)
                        this.createLoginSession(res.userId, res.userType, false);
                    return res;
                }
            }).catch(
            this.handleError
            );
    }

    changePassword(_data: _MC.changePasswordData): Promise<boolean> {
        const url = `${this.baseUrl}/changePassword`;
        return this.http.post(url, _data, { headers: this._headers }).toPromise()
            .then(x => x.json())
            .catch(this.handleError)
    }
    //#endregion

    getMealOptions(): Promise<_MC.MealOptions[]> {
        return this.http.get(`${this.baseUrl}/getMealOptions`, { headers: this._headers }).toPromise()
            .then(response => response.json() as _MC.MealOptions[])
            .catch(this.handleError);
    }

    placeOrder(order: _MC.Order): Promise<_MC.Order> {
        const url = `${this.baseUrl}/placeOrder`;
        return this.http.post(url, order, { headers: this._headers }).toPromise()
            .then(res => {
                if (res != null) {
                    // console.log(res);
                    return res.json() as _MC.Order;
                }
            }
            ).catch(this.handleError);
    }

    updateOrderStatus_Vendor(orderid: string, _isAccepted:boolean): Promise<boolean> {
        const url = `${this.baseUrl}/${_isAccepted?'acceptOrder':'rejectOrder'}`;
        return this.http.post(url, { id: orderid }, { headers: this._headers }).toPromise()
            .then(res => {
                if (res != null) {
                    // console.log(res);
                    return res.json() as boolean;
                }
            }
            ).catch(this.handleError);
    }
    
    cancelOrder(orderid: string): Promise<boolean> {
        const url = `${this.baseUrl}/cancelOrder`;
        return this.http.post(url, { id: orderid }, { headers: this._headers }).toPromise()
            .then(res => {
                if (res != null) {
                    // console.log(res);
                    return res.json() as boolean;
                }
            }
            ).catch(this.handleError);
    }

    getUserOrderList(userid: string): Promise<_MC.Order[]> {
        return this.http.get(`${this.baseUrl}/getUserOrders/${userid}`, { headers: this._headers }).toPromise()
            .then(res => res.json() as _MC.Order[])
            .catch(this.handleError);
    }

    getAllOrders(): Promise<_MC.Order4Dashboard[]> {
        return this.http.get(`${this.baseUrl}/getAllOrders`, { headers: this._headers }).toPromise()
            .then(res => res.json() as _MC.Order4Dashboard[])
            .catch(this.handleError);
    }

    getFilterdOrders(_filterObj:_MC.Order4Dashboard): Promise<_MC.Order[]> {
        return this.http.post(`${this.baseUrl}/getFilteredOrders`,_filterObj, { headers: this._headers }).toPromise()
            .then(res => res.json() as _MC.Order[])
            .catch(this.handleError);
    }

    private handleError(error: any): Promise<any> {
        console.error('An error occurred', error);
        return Promise.reject(error.message || error);
    }
}
