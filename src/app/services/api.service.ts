import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(
    private http: HttpClient
  ) { }

  public getUrl(url: string): Observable<HttpResponse<any>> {
    return this.http.get(url, {observe: 'response' as 'response'});
  }
}
